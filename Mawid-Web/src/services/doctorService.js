import { supabase } from '../lib/supabaseClient'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024

const DOCTOR_FIELDS =
  'id, clinic_id, full_name, specialty, slot_duration_minutes, image_url, avatar_url, ' +
  'experience_years, about, rating, review_count, consultation_fee_sar, ' +
  'available_days, start_time, end_time, latitude, longitude, clinic_address, created_at'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bustCache(publicUrl) {
  const base = publicUrl.split('?')[0]
  return `${base}?v=${Date.now()}`
}

function buildPatch(source, allowedKeys) {
  return allowedKeys.reduce((patch, key) => {
    if (source[key] !== undefined) patch[key] = source[key]
    return patch
  }, {})
}

// ─── Image Compression ────────────────────────────────────────────────────────

/**
 * Compresses a file to JPEG using canvas.
 * Resizes proportionally so the longest side does not exceed maxDim.
 */
export async function compressImageToJpeg(file, maxDim = 1024, quality = 0.85) {
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error('حجم الصورة يتجاوز 5 ميجابايت')
  }

  const bitmap = await createImageBitmap(file)

  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('تعذر معالجة الصورة')

    ctx.drawImage(bitmap, 0, 0, w, h)

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('تعذر ضغط الصورة'))),
        'image/jpeg',
        quality,
      )
    })
  } finally {
    bitmap.close()
  }
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

/**
 * Uploads a compressed JPEG to doctor-avatars/{doctorId}.jpg
 * and returns the public URL.
 */
export async function uploadDoctorAvatar(doctorId, file) {
  const blob = await compressImageToJpeg(file)
  const path = `${doctorId}.jpg`

  const { error } = await supabase.storage
    .from('doctor-avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

  if (error) throw error

  const { data } = supabase.storage.from('doctor-avatars').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Saves the avatar URL to the doctors table.
 * Appends a cache-busting query param so browsers reload the new image.
 */
export async function updateAvatarUrl(doctorId, publicUrl) {
  const { data, error } = await supabase
    .from('doctors')
    .update({ avatar_url: bustCache(publicUrl) })
    .eq('id', doctorId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// ─── Doctor Profile ───────────────────────────────────────────────────────────

export async function getDoctorProfile(doctorId) {
  const { data, error } = await supabase
    .from('doctors')
    .select(DOCTOR_FIELDS)
    .eq('id', doctorId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Updates bio fields: name, specialty, about, experience.
 * Also syncs full_name to profiles table if provided.
 */
export async function updateDoctorProfile(doctorId, { full_name, specialty, about, experience_years }) {
  const patch = buildPatch(
    { full_name, specialty, about, experience_years },
    ['full_name', 'specialty', 'about', 'experience_years']
  )

  const { data, error: doctorErr } = await supabase
    .from('doctors')
    .update(patch)
    .eq('id', doctorId)
    .select()
    .maybeSingle()

  if (doctorErr) throw doctorErr

  // Keep profiles table in sync
  if (full_name !== undefined) {
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ full_name })
      .eq('id', doctorId)

    if (profileErr) throw profileErr
  }

  return data
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function updateSchedule(doctorId, scheduleData) {
  const patch = buildPatch(scheduleData, [
    'available_days',
    'start_time',
    'end_time',
    'slot_duration_minutes',
  ])

  const { data, error } = await supabase
    .from('doctors')
    .update(patch)
    .eq('id', doctorId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// ─── Fee ──────────────────────────────────────────────────────────────────────

/**
 * Fee is stored in EGP — column name (consultation_fee_sar) is legacy,
 * kept as-is to avoid breaking the Android app.
 */
export async function updateFee(doctorId, feeEgp) {
  const { data, error } = await supabase
    .from('doctors')
    .update({ consultation_fee_sar: feeEgp })
    .eq('id', doctorId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}

// ─── Location ─────────────────────────────────────────────────────────────────

export async function updateLocation(doctorId, { latitude, longitude, clinicAddress }) {
  const isValidCoord = (v) => v !== undefined && v !== null && !Number.isNaN(v)

  const patch = {}
  if (isValidCoord(latitude)) patch.latitude = latitude
  if (isValidCoord(longitude)) patch.longitude = longitude
  if (clinicAddress !== undefined) patch.clinic_address = clinicAddress || null

  const { data, error } = await supabase
    .from('doctors')
    .update(patch)
    .eq('id', doctorId)
    .select()
    .maybeSingle()

  if (error) throw error
  return data
}