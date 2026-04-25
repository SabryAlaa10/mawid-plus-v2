import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import * as queueService from '../services/queueService'
import * as appointmentService from '../services/appointmentService'

// ─── Constants ────────────────────────────────────────────────────────────────

const FLASH_DURATION_MS = { success: 2000, error: 3000 }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasNextPatient(list, currentNumber) {
  return list.some((p) => (p.queue_number ?? 0) > currentNumber)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQueue(doctorId) {

  // ─── State ─────────────────────────────────────────────────────────────────

  const [queue, setQueue]               = useState(null)
  const [waitingList, setWaitingList]   = useState([])
  const [maxQueueNumber, setMaxQueueNumber] = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [flash, setFlash]               = useState(null)

  // ─── Refs (avoid stale closures in callNext) ───────────────────────────────

  const waitingListRef = useRef([])
  const queueRef       = useRef(null)

  useEffect(() => { waitingListRef.current = waitingList }, [waitingList])
  useEffect(() => { queueRef.current = queue }, [queue])

  // ─── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!doctorId) {
      setQueue(null)
      setWaitingList([])
      setMaxQueueNumber(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [q, w, maxQ] = await Promise.all([
        queueService.getQueueSettings(doctorId),
        queueService.fetchWaitingAppointments(doctorId),
        queueService.getMaxQueueNumber(doctorId),
      ])
      setQueue(q)
      setWaitingList(w)
      setMaxQueueNumber(maxQ)
    } catch (e) {
      setError(e.message || 'خطأ في الطابور')
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  // ─── Initial Load ──────────────────────────────────────────────────────────

  useEffect(() => {
    load()
  }, [load])

  // ─── Realtime Subscriptions ────────────────────────────────────────────────

  useEffect(() => {
    if (!doctorId) return undefined

    const unsubQueue       = queueService.subscribeToQueue(doctorId, load)
    const unsubAppointments = appointmentService.subscribeToAppointments(doctorId, load, 'queue')

    return () => {
      unsubQueue()
      unsubAppointments()
    }
  }, [doctorId, load])

  // ─── Derived State ─────────────────────────────────────────────────────────

  const currentNumber = queue?.current_number ?? 0

  const canCallNext = useMemo(
    () => hasNextPatient(waitingList, currentNumber),
    [waitingList, currentNumber]
  )

  // ─── Flash Helper ──────────────────────────────────────────────────────────

  function showFlash(type, text) {
    setFlash({ type, text })
    window.setTimeout(
      () => setFlash((f) => (f?.text === text ? null : f)),
      FLASH_DURATION_MS[type]
    )
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  const callNext = useCallback(async () => {
    if (!doctorId) return

    const cur = queueRef.current?.current_number ?? 0
    if (!hasNextPatient(waitingListRef.current, cur)) return

    try {
      const result = await queueService.callNextPatient(doctorId)

      if (!result.success) {
        showFlash('error', result.message)
        return
      }

      showFlash('success', result.message)
      await load()
    } catch {
      showFlash('error', 'حدث خطأ، حاول مرة أخرى')
    }
  }, [doctorId, load])

  const reset = useCallback(async () => {
    if (!doctorId) return
    await queueService.resetQueue(doctorId)
    await load()
  }, [doctorId, load])

  const toggle = useCallback(async (isOpen) => {
    if (!doctorId) return
    await queueService.toggleQueueOpen(doctorId, isOpen)
    await load()
  }, [doctorId, load])

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    currentNumber,
    isOpen: queue?.is_open ?? false,
    queueDate: queue?.queue_date,
    waitingList,
    maxQueueNumber,
    canCallNext,
    flash,
    loading,
    error,
    refresh: load,
    callNext,
    reset,
    toggle,
  }
}