import { format } from 'date-fns'
import { supabase } from '../lib/supabaseClient'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_LIMIT = 1000

const APPOINTMENT_FIELDS = [
  'id', 'patient_id', 'doctor_id', 'queue_number',
  'status', 'appointment_date', 'created_at',
  'notes', 'doctor_notes', 'time_slot',
].join(', ')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Arabic week: Saturday → Friday */
export function getWeekRange() {
  const today = new Date()
  const daysFromSaturday = (today.getDay() + 1) % 7

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - daysFromSaturday)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  return { weekStart, weekEnd }
}

/** Normalize legacy Android status */
export function normalizeStatus(status) {
  if (!status || status === 'scheduled') return 'waiting'
  return status
}

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

// ─── Profile Mapping ──────────────────────────────────────────────────────────

async function buildProfileMap(appointments) {
  const patientIds = [...new Set(
    (appointments ?? []).map((a) => a.patient_id).filter(Boolean)
  )]

  if (!patientIds.length) return {}

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', patientIds)

  if (error) throw error

  return Object.fromEntries((data ?? []).map((p) => [p.id, p]))
}

// ─── Row Enrichment ───────────────────────────────────────────────────────────

function enrichRows(appointments, profileMap) {
  return (appointments ?? []).map((row) => ({
    ...row,
    status: normalizeStatus(row.status),
    patient_name: profileMap[row.patient_id]?.full_name ?? '—',
    patient_phone: profileMap[row.patient_id]?.phone ?? '',
  }))
}

function applyFilters(rows, { status, search } = {}) {
  let result = rows

  if (status && status !== 'all') {
    result = result.filter((r) => r.status === status)
  }

  if (search?.trim()) {
    const keyword = search.trim().toLowerCase()
    result = result.filter((r) =>
      (r.patient_name ?? '').toLowerCase().includes(keyword)
    )
  }

  return result
}

// ─── Fetch Appointments ───────────────────────────────────────────────────────

export async function fetchAppointmentsForDoctor(doctorId, { date, status, search } = {}) {
  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_FIELDS)
    .eq('doctor_id', doctorId)
    .order('queue_number', { ascending: true })
    .limit(ROWS_LIMIT)

  if (date) query = query.eq('appointment_date', date)

  const { data, error } = await query
  if (error) throw error

  const profileMap = await buildProfileMap(data)
  const enriched = enrichRows(data, profileMap)

  return applyFilters(enriched, { status, search })
}

export async function getTodayAppointments(doctorId) {
  return fetchAppointmentsForDoctor(doctorId, {
    date: todayISO(),
    status: 'all',
    search: '',
  })
}

export async function getWeekAppointments(doctorId, { status, search } = {}) {
  const { weekStart, weekEnd } = getWeekRange()

  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_FIELDS)
    .eq('doctor_id', doctorId)
    .gte('appointment_date', format(weekStart, 'yyyy-MM-dd'))
    .lte('appointment_date', format(weekEnd, 'yyyy-MM-dd'))
    .order('appointment_date', { ascending: true })
    .limit(ROWS_LIMIT)

  if (error) throw error

  const profileMap = await buildProfileMap(data)
  const enriched = enrichRows(data, profileMap)

  const sorted = enriched.sort((a, b) => {
    const byDate = a.appointment_date.localeCompare(b.appointment_date)
    return byDate !== 0 ? byDate : (a.queue_number ?? 0) - (b.queue_number ?? 0)
  })

  return applyFilters(sorted, { status, search })
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function fetchAppointmentStatsForDay(doctorId, isoDate) {
  const { data, error } = await supabase
    .from('appointments')
    .select('status')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', isoDate)

  if (error) throw error

  const counts = { today: 0, waiting: 0, in_progress: 0, done: 0, cancelled: 0 }

  for (const row of data ?? []) {
    counts.today++

    const raw = (row.status ?? '').trim().toLowerCase()

    if (raw === 'cancelled' || raw === 'canceled') {
      counts.cancelled++
      continue
    }

    const normalized = normalizeStatus(row.status)
    if (normalized === 'waiting')     counts.waiting++
    else if (normalized === 'in_progress') counts.in_progress++
    else if (normalized === 'done')   counts.done++
  }

  return counts
}

export async function getTodayStats(doctorId) {
  return fetchAppointmentStatsForDay(doctorId, todayISO())
}

export async function fetchAppointmentsLast7Days(doctorId) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 6)

  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_date')
    .eq('doctor_id', doctorId)
    .gte('appointment_date', format(start, 'yyyy-MM-dd'))
    .lte('appointment_date', format(end, 'yyyy-MM-dd'))

  if (error) throw error

  return (data ?? []).reduce((acc, row) => {
    acc[row.appointment_date] = (acc[row.appointment_date] ?? 0) + 1
    return acc
  }, {})
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function updateAppointment(appointmentId, patch) {
  const { data, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('id', appointmentId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

export async function completeAppointment(appointmentId, notes) {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'done', doctor_notes: notes ?? null })
    .eq('id', appointmentId)

  if (error) throw error
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export function subscribeToAppointments(doctorId, callback, scope = 'default') {
  const channel = supabase
    .channel(`appointments-doctor-${doctorId}-${scope}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments', filter: `doctor_id=eq.${doctorId}` },
      (payload) => {
        if (import.meta.env.DEV) console.log('Realtime payload:', payload)
        callback(payload)
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function subscribeAppointmentNotifications(doctorId, onPayload) {
  const EVENTS = ['INSERT', 'UPDATE']

  const channel = EVENTS.reduce(
    (ch, event) =>
      ch.on(
        'postgres_changes',
        { event, schema: 'public', table: 'appointments', filter: `doctor_id=eq.${doctorId}` },
        onPayload
      ),
    supabase.channel(`appointments-notify-${doctorId}`)
  ).subscribe()

  return () => supabase.removeChannel(channel)
}