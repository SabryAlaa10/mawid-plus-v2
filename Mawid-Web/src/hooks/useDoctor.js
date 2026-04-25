import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import * as doctorService from '../services/doctorService'

// ─── Constants ────────────────────────────────────────────────────────────────

const REALTIME_CHANNEL = (userId) => `doctor_profile:${userId}`

const ERROR_MESSAGES = {
  notFound: 'لم يُعثر على ملف طبيب مرتبط بهذا الحساب. تأكد من ربط auth.users.id مع doctors.id في Supabase.',
  loadFailed: 'تعذر تحميل بيانات الطبيب',
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDoctor(userId) {

  // ─── State ─────────────────────────────────────────────────────────────────

  const [doctor, setDoctor]   = useState(null)
  const [loading, setLoading] = useState(!!userId)
  const [error, setError]     = useState(null)

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    if (!userId) {
      setDoctor(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const row = await doctorService.getDoctorProfile(userId)
      setDoctor(row)
      if (!row) setError(ERROR_MESSAGES.notFound)
    } catch (e) {
      setError(e.message || ERROR_MESSAGES.loadFailed)
      setDoctor(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // ─── Initial Load ──────────────────────────────────────────────────────────

  useEffect(() => {
    refresh()
  }, [refresh])

  // ─── Realtime Subscription ─────────────────────────────────────────────────

  // Re-fetches when the doctor row is updated (e.g. after a patient leaves a review)
  // so rating and review_count stay in sync without a full page reload.
  useEffect(() => {
    if (!userId) return undefined

    const channel = supabase
      .channel(REALTIME_CHANNEL(userId))
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'doctors', filter: `id=eq.${userId}` },
        refresh,
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (import.meta.env.DEV) console.warn('[useDoctor] realtime:', status, err)
        }
      })

    return () => supabase.removeChannel(channel)
  }, [userId, refresh])

  // ─── Return ────────────────────────────────────────────────────────────────

  return { doctor, loading, error, refresh }
}