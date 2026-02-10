import { NextRequest, NextResponse } from 'next/server';
import { getNoticeReaders, getAgencyByEmail } from '@/lib/airtable/service';

export const dynamic = 'force-dynamic';

const DEFAULT_EMAIL = 'public@fiduviagens.com';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const noticeId = searchParams.get('noticeId');

    // Structured Log Init
    const logData = {
        event: "read-log-request",
        baseIdPrefix: (process.env.AIRTABLE_BASE_ID || '').substring(0, 7) + '...',
        noticeId: noticeId,
        returnedCount: 0,
        errorStack: null as string | null
    };

    if (!noticeId) {
        return NextResponse.json({ success: false, readers: [], error: 'Missing noticeId' }, { status: 400 });
    }

    try {
        // Use default public email
        const email = DEFAULT_EMAIL;
        const agency = await getAgencyByEmail(email);

        if (!agency) {
            throw new Error('Agency not found for default user');
        }

        const readers = await getNoticeReaders(noticeId, agency.id, false);

        logData.returnedCount = readers.length;
        console.log(JSON.stringify(logData));

        return NextResponse.json({
            success: true,
            readers: readers
        });

    } catch (error: any) {
        logData.errorStack = error.stack || error.message;
        console.error(JSON.stringify(logData));
        return NextResponse.json({ success: false, readers: [], error: error.message }, { status: 500 });
    }
}
