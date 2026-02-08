import { getAgencyProducts } from '@/app/actions';
import { ProductGrid } from '@/components/ProductGrid';
import { UserButton } from '@clerk/nextjs';

export default async function Portal() {
    const { products, agency, error } = await getAgencyProducts();

    return (
        <main className="container mx-auto px-6 py-10">
            <div className="mb-6">
                <p className="text-gray-500">
                    Tarifas exclusivas para nossos parceiros verificados.
                </p>
            </div>

            {error ? (
                <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-100">
                    {error}
                </div>
            ) : (
                <ProductGrid
                    products={products}
                    isInternal={agency?.isInternal}
                    agencyInfo={agency ? {
                        agentName: agency.agentName || '',
                        agencyName: agency.agencyName || '',
                        commissionRate: agency.commissionRate || 0,
                        canReserve: !!agency.canReserve,
                        canAccessMural: !!agency.canAccessMural,
                        isInternal: !!agency.isInternal
                    } : undefined}
                />
            )}

            {products.length === 0 && !error && (
                <div className="text-center py-20 text-gray-500">
                    Nenhum passeio encontrado para sua agência.
                </div>
            )}
        </main>
    );
}
