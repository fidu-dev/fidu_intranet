import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getUserCapabilities } from '@/lib/auth/getUserCapabilities'
import { uploadImage } from '@/lib/db/supabaseStorage'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const email = user.emailAddresses[0]?.emailAddress
        if (!email) return NextResponse.json({ error: 'No email' }, { status: 401 })

        const capabilities = await getUserCapabilities(email)
        if (!capabilities?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const tourId = formData.get('tourId') as string | null

        if (!file || !tourId) {
            return NextResponse.json({ error: 'file and tourId required' }, { status: 400 })
        }

        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 })
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const url = await uploadImage(tourId, buffer, file.name)

        // Get next sortOrder
        const maxSort = await prisma.tourImage.aggregate({
            where: { tourId },
            _max: { sortOrder: true },
        })

        const image = await prisma.tourImage.create({
            data: {
                tourId,
                url,
                sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
            },
        })

        return NextResponse.json({ id: image.id, url: image.url })
    } catch (err: any) {
        console.error('Upload error:', err)
        return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
    }
}
