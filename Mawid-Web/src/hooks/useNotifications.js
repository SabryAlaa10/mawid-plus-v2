import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AR_LOCALE } from '../constants/region'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_NOTIFICATIONS = 100
const DEFAULT_PATIENT_NAME = 'مريض جديد'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatArabicDate(dateStr) {
  if (!dateStr) return ''
  try {
    const iso = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
    return new Intl.DateTimeFormat(AR_LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(iso))
  } catch {
    return String(dateStr)
  }
}

function isSameDoctor(a, b) {
  if (a == null || b == null) return false
  return String(a).replace(/-/g, '').toLowerCase() ===
         String(b).replace(/-/g, '').toLowerCase()
}

function isCancelled(status) {
  return status === 'cancelled' || status === 'canceled'
}

function parseStars(raw) {
  if (raw == null || raw === '') return NaN
  const n = Number(raw)
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : NaN
}

async function resolvePatientName(patientId) {
  if (!patientId) return DEFAULT_PATIENT_NAME
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', patientId)
    .maybeSingle()
  return data?.full_name?.trim() || DEFAULT_PATIENT_NAME
}

function buildNotif(base) {
  return { ...base, timestamp: new Date(), read: false }
}

function prepend(prev, notif) {
  return [notif, ...prev].slice(0, MAX_NOTIFICATIONS)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * In-memory notifications for the doctor dashboard.
 * Listens to INSERT (new booking) and UPDATE (cancellation or new rating).
 * Resets on doctorId change. No persistence — clears on page refresh.
 */
export function useNotifications(doctorId) {

  // ─── State ─────────────────────────────────────────────────────────────────

  const [notifications, setNotifications] = useState([])
  const ratedAppointmentsRef = useRef(new Set())

  useEffect(() => {
    ratedAppointmentsRef.current = new Set()
  }, [doctorId])

  // ─── Derived ───────────────────────────────────────────────────────────────

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  // ─── Realtime ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!doctorId) return undefined

    // ── INSERT: new booking ─────────────────────────────────────────────────
    async function handleInsert(payload) {
      try {
        const appt = payload.new
        if (!appt?.id || !isSameDoctor(appt.doctor_id, doctorId)) return

        const patientName  = await resolvePatientName(appt.patient_id)
        const formattedDate = formatArabicDate(appt.appointment_date)
        const q = appt.queue_number ?? '—'

        setNotifications((prev) =>
          prepend(prev, buildNotif({
            id: appt.id,
            type: 'new_booking',
            title: 'حجز موعد جديد',
            message: `${patientName} — رقم #${q} — ${formattedDate}`,
            appointmentId: appt.id,
            appointmentDate: appt.appointment_date,
            queueNumber: appt.queue_number,
            patientName,
          }))
        )
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[useNotifications] INSERT:', e)
      }
    }

    // ── UPDATE: cancellation or new rating ──────────────────────────────────
    async function handleUpdate(payload) {
      try {
        const appt = payload.new
        const prev = payload.old
        if (!appt?.id || !isSameDoctor(appt.doctor_id, doctorId)) return

        // Cancellation
        if (isCancelled(appt.status) && !isCancelled(prev?.status)) {
          setNotifications((list) =>
            prepend(list, buildNotif({
              id: `cancel_${appt.id}_${Date.now()}`,
              type: 'cancellation',
              title: 'إلغاء موعد',
              message: `تم إلغاء الموعد رقم #${appt.queue_number ?? '—'}`,
              appointmentId: appt.id,
              appointmentDate: appt.appointment_date,
            }))
          )
          return
        }

        // New rating — skip if already rated or previously had a rating
        if (prev?.patient_rating != null && prev.patient_rating !== '') return
        const stars = parseStars(appt.patient_rating)
        if (Number.isNaN(stars)) return
        if (ratedAppointmentsRef.current.has(appt.id)) return
        ratedAppointmentsRef.current.add(appt.id)

        const patientName   = await resolvePatientName(appt.patient_id)
        const formattedDate = formatArabicDate(appt.appointment_date)
        const q = appt.queue_number ?? '—'

        setNotifications((list) =>
          prepend(list, buildNotif({
            id: `rating_${appt.id}_${Date.now()}`,
            type: 'new_rating',
            title: 'تقييم جديد من مريض',
            message: `${patientName} قيّمك بـ ${stars} من 5 — دور #${q} — ${formattedDate}`,
            appointmentId: appt.id,
            appointmentDate: appt.appointment_date,
            queueNumber: appt.queue_number,
            patientName,
            stars,
          }))
        )
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[useNotifications] UPDATE:', e)
      }
    }

    const channel = supabase
      .channel(`doctor_notifications:${doctorId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, handleInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, handleUpdate)
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (import.meta.env.DEV) console.warn('[useNotifications] channel:', status, err)
        }
      })

    return () => supabase.removeChannel(channel)
  }, [doctorId])

  // ─── Actions ───────────────────────────────────────────────────────────────

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markOneRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const clearAll = useCallback(() => setNotifications([]), [])

  const timeAgo = useCallback((timestamp) => {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (diff < 60)    return 'الآن'
    if (diff < 3600)  return `منذ ${Math.floor(diff / 60)} دقيقة`
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`
    return `منذ ${Math.floor(diff / 86400)} يوم`
  }, [])

  // ─── Return ────────────────────────────────────────────────────────────────

  return { notifications, unreadCount, markAllRead, markOneRead, clearAll, timeAgo }
}