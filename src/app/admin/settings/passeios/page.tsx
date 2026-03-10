import { getPasseios, getPasseiosDestinos } from '@/app/admin/actions';
import { PasseiosClient } from './PasseiosClient';

export const dynamic = 'force-dynamic';

export default async function PasseiosPage() {
    const [passeios, destinos] = await Promise.all([
        getPasseios(),
        getPasseiosDestinos(),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Passeios</h1>
                <p className="text-gray-500">Gerencie o catálogo de passeios cadastrados.</p>
            </div>
            <PasseiosClient initialPasseios={passeios} destinos={destinos} />
        </div>
    );
}
