import { getAgencyProducts } from '@/app/actions';
import { PortalHeader } from '@/components/PortalHeader';
import { CartProvider } from '@/components/CartContext';

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { agency, hasUnreadMural } = await getAgencyProducts();

    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-50/50">
                <PortalHeader agency={agency} hasUnreadMural={hasUnreadMural} />
                {children}
            </div>
        </CartProvider>
    );
}
