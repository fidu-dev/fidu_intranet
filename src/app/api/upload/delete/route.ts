import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getUserCapabilities } from '@/lib/auth/getUserCapabilities'
import { deleteImage } from '@/lib/db/supabaseStorage'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const email = user.emailAddresses[0]?.emailAddress
        if (!email) return NextResponse.json({ error: 'No email' }, { status: 401 })

        const capabilities = await getUserCapabilities(email)
        if (!capabilities?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { imageId } = await req.json()
        if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 })

        const image = await prisma.tourImage.findUnique({ where: { id: imageId } })
        if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

        await deleteImage(image.url)
        await prisma.tourImage.delete({ where: { id: imageId } })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Delete image error:', err)
        return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
    }
}
