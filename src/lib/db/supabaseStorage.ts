import { createClient } from '@supabase/supabase-js'

const BUCKET = 'tour-images'

function getClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
    return createClient(url, key)
}

export async function uploadImage(tourId: string, fileBuffer: Buffer, filename: string): Promise<string> {
    const supabase = getClient()
    const ext = filename.split('.').pop() || 'jpg'
    const path = `tours/${tourId}/${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, fileBuffer, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: false })

    if (error) throw new Error(`Upload failed: ${error.message}`)

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
}

export async function deleteImage(publicUrl: string): Promise<void> {
    const supabase = getClient()
    // Extract path from public URL: .../<bucket>/tours/...
    const parts = publicUrl.split(`/${BUCKET}/`)
    if (parts.length < 2) throw new Error('Invalid image URL')
    const path = parts[1]

    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) throw new Error(`Delete failed: ${error.message}`)
}
