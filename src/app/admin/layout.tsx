import { getAgencyProducts } from '@/app/actions';
import { PortalHeader } from '@/components/PortalHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const { agency, hasUnreadMural, error } = await getAgencyProducts();

    if (error === 'UNAUTHENTICATED') {
        redirect('/sign-in');
    }
    if (error === 'UNAUTHORIZED' || !agency?.isAdmin) {
        redirect('/portal');
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PortalHeader agency={agency} hasUnreadMural={hasUnreadMural} />
            <div className="flex flex-1 overflow-hidden">
                <AdminSidebar />
                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-gray-50/50">
                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
