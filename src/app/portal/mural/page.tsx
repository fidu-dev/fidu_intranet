import { fetchMural } from '@/app/actions';
import { MuralGrid } from '@/components/MuralGrid';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mural | Fidu Viagens Intranet',
    description: 'Atualizações e novidades da Fidu Viagens.',
};

export default async function MuralPage() {
    const { items, readLogs, isAdmin, userName, error } = await fetchMural();

    if (error && error.includes('ACESSO NEGADO')) {
        return (
            <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
                <div className="bg-amber-50 border border-amber-100 p-8 rounded-2xl inline-block max-lg">
                    <h2 className="text-xl font-bold text-amber-900 mb-2">Acesso Restrito</h2>
                    <p className="text-amber-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <span>No ar!</span>
                    <span>›</span>
                    <span className="text-gray-900 font-medium">Mural</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mural de Atualizações</h1>
                <p className="text-gray-500 mt-1">Fique por dentro das últimas novidades e alterações no tarifário.</p>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-center">
                    {error}
                </div>
            ) : (
                <MuralGrid items={items} readLogs={readLogs} isAdmin={isAdmin} userName={userName} />
            )}
        </div>
    );
}
