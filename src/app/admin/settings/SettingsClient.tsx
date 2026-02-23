'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

export function SettingsClient() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncMsg, setLastSyncMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setLastSyncMsg(null);
        try {
            const res = await fetch('/api/sync/tours', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setLastSyncMsg({ type: 'success', text: `Sincronização concluída: ${data.count} itens sincronizados e cadastrados com sucesso.` });
            } else {
                const err = await res.json();
                setLastSyncMsg({ type: 'error', text: `Erro: ${err.error || 'Falha na requisição'}` });
            }
        } catch (error) {
            setLastSyncMsg({ type: 'error', text: 'Erro de comunicação de rede ou permissões insuficientes.' });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-xl">
            <h2 className="text-lg font-bold mb-4">Sincronização Airtable</h2>
            <p className="text-sm text-gray-500 mb-6">
                Clique no botão abaixo para forçar uma sincronização manual de todo o diretório de passeios com sua base no Airtable.
                Isso atualizará os produtos no banco de dados local com os respectivos dados de temporada e preços base.
            </p>
            <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full sm:w-auto"
            >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isSyncing ? 'Sincronizando...' : 'Atualizar dados do API Airtable'}
            </Button>

            {lastSyncMsg && (
                <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 text-sm ${lastSyncMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {lastSyncMsg.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                    <p>{lastSyncMsg.text}</p>
                </div>
            )}
        </div>
    );
}
