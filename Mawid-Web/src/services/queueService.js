import { format } from 'date-fns'
import { supabase } from '../lib/supabaseClient'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUEUE_FIELDS = 'doctor_id, current_number, queue_date, is_open, updated_at'
const WAITING_STATUSES = ['waiting', 'scheduled']

function nowISO() {
  return new Date().toISOString()
}

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

// ─── Queue Settings ───────────────────────────────────────────────────────────

export async function getQueueSettings(doctorId) {
  const { data, error } = await supabase
    .from('queue_settings')
    .select(QUEUE_FIELDS)
    .eq('doctor_id', doctorId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateCurrentNumber(doctorId, newNumber) {
  const { data, error } = await supabase
    .from('queue_settings')
    .update({ current_number: newNumber, updated_at: nowISO() })
    .eq('doctor_id', doctorId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

export async function resetQueue(doctorId) {
  return updateCurrentNumber(doctorId, 0)
}

export async function toggleQueueOpen(doctorId, isOpen) {
  const { data, error } = await supabase
    .from('queue_settings')
    .update({ is_open: isOpen, updated_at: nowISO() })
    .eq('doctor_id', doctorId)
    .select(QUEUE_FIELDS)
    .maybeSingle()

  if (error) throw error
  return data
}

// ─── Queue Number ─────────────────────────────────────────────────────────────

/**
 * Returns the highest queue number for today.
 * Includes cancelled appointments to prevent number reuse.
 */
export async function getMaxQueueNumber(doctorId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('queue_number')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', todayISO())
    .order('queue_number', { ascending: false })
    .limit(1)

  if (error) return 0
  return data?.[0]?.queue_number ?? 0
}

// ─── Call Next ────────────────────────────────────────────────────────────────

/**
 * Calls the next waiting patient with a queue number greater than the current one.
 * Skips gaps and cancelled slots automatically.
 */
export async function callNextPatient(doctorId) {
  const settings = await getQueueSettings(doctorId)

  if (!settings) {
    return { success: false, message: 'إعدادات الطابور غير متوفرة', currentNumber: 0 }
  }

  const currentNumber = settings.current_number ?? 0
  const today = todayISO()

  const { data: rows, error: fetchErr } = await supabase
    .from('appointments')
    .select('id, queue_number, status')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', today)
    .neq('status', 'cancelled')
    .order('queue_number', { ascending: true })

  if (fetchErr) throw fetchErr

  const waitingList = (rows ?? []).filter((a) => WAITING_STATUSES.includes(a.status))
  const nextPatient = waitingList.find((a) => (a.queue_number ?? 0) > currentNumber)

  if (!nextPatient) {
    return {
      success: false,
      message: waitingList.length === 0
        ? 'لا يوجد مرضى في قائمة الانتظار'
        : 'لا يوجد مريض تالٍ في الطابور',
      currentNumber,
    }
  }

  // Mark current in-progress appointment as done
  if (currentNumber > 0) {
    await supabase
      .from('appointments')
      .update({ status: 'done' })
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .eq('queue_number', currentNumber)
      .eq('status', 'in_progress')
  }

  // Set next patient as in-progress
  const { error: upNextErr } = await supabase
    .from('appointments')
    .update({ status: 'in_progress' })
    .eq('id', nextPatient.id)

  if (upNextErr) throw upNextErr

  // Advance the queue counter
  const { error: updateErr } = await supabase
    .from('queue_settings')
    .update({ current_number: nextPatient.queue_number, updated_at: nowISO() })
    .eq('doctor_id', doctorId)

  if (updateErr) throw updateErr

  return {
    success: true,
    message: `جارٍ استدعاء المريض رقم #${nextPatient.queue_number}`,
    currentNumber: nextPatient.queue_number,
    patientId: nextPatient.id,
  }
}

// ─── Waiting List ─────────────────────────────────────────────────────────────

export async function fetchWaitingAppointments(doctorId) {
  const { data: apps, error } = await supabase
    .from('appointments')
    .select('id, queue_number, status, appointment_date, created_at, patient_id')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', todayISO())
    .order('queue_number', { ascending: true })

  if (error) throw error

  const waiting = (apps ?? []).filter((a) => WAITING_STATUSES.includes(a.status))

  // Fetch patient names in a single batch query
  const patientIds = [...new Set(waiting.map((a) => a.patient_id))]
  let profileMap = {}

  if (patientIds.length) {
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', patientIds)

    if (profileErr) throw profileErr
    profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
  }

  return waiting.map((r) => ({
    ...r,
    status: r.status === 'scheduled' ? 'waiting' : r.status,
    patient_name: profileMap[r.patient_id]?.full_name ?? '—',
  }))
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export function subscribeToQueue(doctorId, callback) {
  const channel = supabase
    .channel(`queue-doctor-${doctorId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'queue_settings', filter: `doctor_id=eq.${doctorId}` },
      (payload) => {
        if (import.meta.env.DEV) console.log('Realtime: queue updated', payload)
        callback(payload)
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}