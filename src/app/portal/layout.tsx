import { getAgencyProducts } from '@/app/actions';
import { PortalHeader } from '@/components/PortalHeader';
import { ExchangeTicker } from '@/components/ExchangeTicker';
import { CartProvider } from '@/components/CartContext';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Portal do Parceiro | Fidu Viagens",
    description: "Gerencie suas reservas e produtos exclusivos.",
    openGraph: {
        title: "Portal do Parceiro | Fidu Viagens",
        description: "Acesso exclusivo a agências e operadores.",
    }
};

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { agency, hasUnreadMural, error } = await getAgencyProducts();

    if (error === 'UNAUTHENTICATED') {
        redirect('/sign-in');
    }
    if (error === 'UNAUTHORIZED') {
        redirect('/unauthorized');
    }
    if (error === 'CLERK_ERROR') {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-red-100 max-w-md">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Erro de Autenticação</h2>
                    <p className="text-gray-600">Não foi possível conectar ao servidor de autenticação. Verifique suas chaves do Clerk e tente novamente.</p>
                </div>
            </div>
        );
    }

    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-50/50">
                <PortalHeader agency={agency} hasUnreadMural={hasUnreadMural} />
                <ExchangeTicker canAccess={!!agency?.canAccessExchange} />
                {children}
            </div>
        </CartProvider>
    );
}
