import { getAgencyProducts } from '@/app/actions';
import { PortalHeader } from '@/components/PortalHeader';

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { agency } = await getAgencyProducts();

    return (
        <div className="min-h-screen bg-gray-50/50">
            <PortalHeader agency={agency} />
            {children}
        </div>
    );
}
