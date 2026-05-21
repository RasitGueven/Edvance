// Foto-Uploads für den Rechenweg. Privater Bucket — Zugriff via Signed URL
// mit kurzer Laufzeit (1 h), damit dataURLs nicht durch Logs/Caches leaken.
//
// Pfad: {student_id}/{timestamp}-{rand}.{ext} — das erste Segment ist via
// RLS auf get_my_student_id() gebunden (Migration 031).

import { supabase } from './client'
import type { SupabaseResult } from '@/types'

export const SCREENING_UPLOADS_BUCKET = 'screening-uploads'
const SIGNED_URL_TTL = 60 * 60 // 1 h

function extFromMime(mime: string, fallback = 'jpg'): string {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/heic') return 'heic'
  if (mime === 'image/webp') return 'webp'
  return fallback
}

function randomId(): string {
  // Kollisionssicher genug für „mehrere Uploads pro Sekunde pro Schüler".
  return Math.random().toString(36).slice(2, 10)
}

export async function uploadScreeningPhoto(
  studentId: string,
  file: File,
): Promise<SupabaseResult<string>> {
  try {
    const ext = extFromMime(file.type)
    const path = `${studentId}/${Date.now()}-${randomId()}.${ext}`
    const { error } = await supabase.storage
      .from(SCREENING_UPLOADS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      })
    if (error) return { data: null, error: error.message }
    return { data: path, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Foto-Upload fehlgeschlagen'
    return { data: null, error: msg }
  }
}

export async function getScreeningPhotoSignedUrl(
  path: string,
): Promise<SupabaseResult<string>> {
  try {
    const { data, error } = await supabase.storage
      .from(SCREENING_UPLOADS_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL)
    if (error || !data) return { data: null, error: error?.message ?? 'Signed URL fehlt' }
    return { data: data.signedUrl, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signed URL fehlgeschlagen'
    return { data: null, error: msg }
  }
}

// Batch-Variante für die Coach-Inbox.
export async function getScreeningPhotoSignedUrls(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data } = await supabase.storage
    .from(SCREENING_UPLOADS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL)
  const out: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) out[row.path] = row.signedUrl
  }
  return out
}

// Schüler:in verwirft eigenes Foto vor dem Submit.
export async function deleteScreeningPhoto(
  path: string,
): Promise<SupabaseResult<true>> {
  try {
    const { error } = await supabase.storage
      .from(SCREENING_UPLOADS_BUCKET)
      .remove([path])
    if (error) return { data: null, error: error.message }
    return { data: true, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Löschen fehlgeschlagen'
    return { data: null, error: msg }
  }
}
