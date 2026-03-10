import { SettingsClient } from './SettingsClient';
import { getAllSeasons } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const seasons = await getAllSeasons();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Configurações de Sistema</h1>
                <p className="text-gray-500">Gestão de temporadas, integrações e ações avançadas.</p>
            </div>
            <SettingsClient initialSeasons={seasons} />
        </div>
    );
}
