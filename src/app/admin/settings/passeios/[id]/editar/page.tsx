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

    return <PasseioEditarClient passeio={passeio} />;
}
