import { PasseioNovoClient } from './PasseioNovoClient';

export const dynamic = 'force-dynamic';

export default function NovoPasseioPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Novo Passeio</h1>
                <p className="text-gray-500">Preencha os dados para cadastrar um novo passeio.</p>
            </div>
            <PasseioNovoClient />
        </div>
    );
}
