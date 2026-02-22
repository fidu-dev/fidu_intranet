import { getAgencies } from '@/app/admin/actions';
import { Simulator } from '@/components/admin/Simulator';

export const dynamic = 'force-dynamic';

export default async function SimulatorPage() {
    const agencies = await getAgencies();

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Price Simulator</h1>
            <p className="text-gray-500 mb-8 max-w-2xl">
                Select an agency to view their specific pricing table.
                Sales team can verify the final consumer price here.
            </p>
            <Simulator agencies={agencies} />
        </div>
    );
}
