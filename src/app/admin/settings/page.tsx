import { SettingsClient } from './SettingsClient';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Configurações de Sistema</h1>
                <p className="text-gray-500">Ações avançadas de sistema e integração.</p>
            </div>
            <SettingsClient />
        </div>
    );
}
