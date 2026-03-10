import { getPasseioById } from '@/app/admin/actions';
import { PasseioEditarClient } from './PasseioEditarClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditarPasseioPage({ params }: Props) {
    const { id } = await params;
    const passeio = await getPasseioById(id);

    if (!passeio) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Editar Passeio</h1>
                <p className="text-gray-500">{passeio.title || 'Sem título'}</p>
            </div>
            <PasseioEditarClient passeio={passeio} />
        </div>
    );
}
