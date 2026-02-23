import { NextResponse } from 'next/server'
import { syncToursFromAirtable } from '@/lib/sync/airtableTours'
import { currentUser } from '@clerk/nextjs/server'
import { getUserCapabilities } from '@/lib/auth/getUserCapabilities'

export async function POST() {
    try {
        const user = await currentUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const email = user.emailAddresses[0]?.emailAddress
        if (!email) {
            return NextResponse.json({ error: 'No email found' }, { status: 401 })
        }

        const capabilities = await getUserCapabilities(email)

        // Only ADMIN can sync tours
        if (!capabilities?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 })
        }

        const result = await syncToursFromAirtable()

        if (result.success) {
            return NextResponse.json({ message: 'Sync completed', count: result.count })
        } else {
            return NextResponse.json({ error: 'Sync failed', details: result.error }, { status: 500 })
        }
    } catch (error) {
        console.error('Internal error executing sync:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
