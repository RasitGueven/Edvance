// Supabase-Storage-Wrapper fuer Task-Assets.
// Bucket-Konvention: 'task-assets' (public read), Pfad: tasks/<task_id>/<timestamp>-<sanitized-name>
// RLS-Setup siehe migrations/010_task_assets_storage_rls.sql.

import { supabase } from './client'
import type { SupabaseResult } from '@/types'

const TASK_ASSETS_BUCKET = 'task-assets'

export type UploadedAsset = { url: string; path: string }

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '_')
    .slice(0, 80)
}

export async function uploadTaskAssetFile(
  taskId: string,
  file: File,
): Promise<SupabaseResult<UploadedAsset>> {
  try {
    const safeName = sanitizeFilename(file.name)
    const path = `tasks/${taskId}/${Date.now()}-${safeName}`
    const { error: uploadError } = await supabase.storage
      .from(TASK_ASSETS_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      })
    if (uploadError) return { data: null, error: uploadError.message }
    const { data } = supabase.storage.from(TASK_ASSETS_BUCKET).getPublicUrl(path)
    return { data: { url: data.publicUrl, path }, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bild-Upload fehlgeschlagen'
    return { data: null, error: message }
  }
}
