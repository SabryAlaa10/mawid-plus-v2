import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import * as appointmentService from '../services/appointmentService'

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEW_MODES = { TODAY: 'today', WEEK: 'week', CUSTOM: 'custom' }

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches and subscribes to appointments for a given doctor.
 * @param {'today'|'week'|'custom'} viewMode
 */
export function useAppointments(doctorId, date, status, search, viewMode = VIEW_MODES.CUSTOM) {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // ─── Fetch Logic ───────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!doctorId) {
      setRows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const filters = { status, search }
      let data

      if (viewMode === VIEW_MODES.TODAY) {
        data = await appointmentService.fetchAppointmentsForDoctor(doctorId, {
          date: todayISO(),
          ...filters,
        })
      } else if (viewMode === VIEW_MODES.WEEK) {
        data = await appointmentService.getWeekAppointments(doctorId, filters)
      } else {
        data = await appointmentService.fetchAppointmentsForDoctor(doctorId, {
          date,
          ...filters,
        })
      }

      setRows(data)
    } catch (e) {
      setError(e.message || 'خطأ في المواعيد')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [doctorId, date, status, search, viewMode])

  // ─── Initial Load ──────────────────────────────────────────────────────────

  useEffect(() => {
    load()
  }, [load])

  // ─── Realtime Subscription ─────────────────────────────────────────────────

  useEffect(() => {
    if (!doctorId) return undefined
    return appointmentService.subscribeToAppointments(doctorId, load, 'list')
  }, [doctorId, load])

  return { rows, loading, error, refresh: load }
}