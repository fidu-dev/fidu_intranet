import { getAgencyProducts } from '@/app/actions';
import { ProductGrid } from '@/components/ProductGrid';
import { UserButton } from '@clerk/nextjs';

export default async function Portal() {
    const { products, agency, error } = await getAgencyProducts();

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="font-bold text-xl tracking-tight" style={{ color: '#3b5998' }}>
                            Fidu<span className="text-gray-900">Viagens</span> Partner
                        </div>

                        {agency && (
                            <div className="hidden md:flex items-center gap-6 text-sm border-l pl-8">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold">Agente</span>
                                    <span className="text-gray-900 font-semibold">{agency.agentName}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold">Agência</span>
                                    <span className="text-gray-900 font-semibold">{agency.agencyName}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold">Comissão</span>
                                    <span className="bg-blue-50 text-[#3b5998] px-2 py-0.5 rounded font-bold">
                                        {(agency.commissionRate * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <UserButton afterSignOutUrl="/sign-in" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-10">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: '#3b5998' }}>Tarifário de Experiências</h1>
                    <p className="text-gray-500">
                        Tarifas exclusivas para nossos parceiros verificados.
                    </p>
                </div>

                {error ? (
                    <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-100">
                        {error}
                    </div>
                ) : (
                    <ProductGrid products={products} />
                )}

                {products.length === 0 && !error && (
                    <div className="text-center py-20 text-gray-500">
                        Nenhum passeio encontrado para sua agência.
                    </div>
                )}
            </main>
        </div>
    );
}
