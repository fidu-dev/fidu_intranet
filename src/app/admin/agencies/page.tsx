import { getAgencies } from '@/app/admin/actions';
import { AgenciesTable } from '@/components/admin/AgenciesTable';

export const dynamic = 'force-dynamic';

export default async function AgenciesPage() {
    const agencies = await getAgencies();

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Agency Management</h1>
            <AgenciesTable initialAgencies={agencies} />
        </div>
    );
}
