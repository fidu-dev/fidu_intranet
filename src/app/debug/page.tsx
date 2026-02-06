import { getAirtableBase } from '@/lib/airtable/client';

export default async function DebugPage() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    let libraryTest = "Não iniciado";
    let fetchTest = "Não iniciado";
    let rawError = "";

    // Test 1: Library
    try {
        const base = getAirtableBase();
        if (base) {
            await base('Products').select({ maxRecords: 1 }).firstPage();
            libraryTest = "✅ Sucesso (Livraria conectou!)";
        } else {
            libraryTest = "❌ Falha: Cliente não inicializado (Base é null)";
        }
    } catch (e: any) {
        libraryTest = `❌ Erro da Livraria: ${e.message}`;
        rawError = JSON.stringify(e, null, 2);
    }

    // Test 2: Direct Fetch
    if (apiKey && baseId) {
        try {
            const res = await fetch(`https://api.airtable.com/v0/${baseId}/Products?maxRecords=1`, {
                headers: { Authorization: `Bearer ${apiKey}` },
                cache: 'no-store'
            });
            if (res.ok) {
                fetchTest = "✅ Sucesso (Fetch funcionou!)";
            } else {
                fetchTest = `❌ Erro no Fetch: Status ${res.status} ${res.statusText}`;
                const body = await res.text();
                rawError = rawError ? rawError + "\n\n" + body : body;
            }
        } catch (e: any) {
            fetchTest = `❌ Falha no Fetch: ${e.message}`;
        }
    }

    return (
        <div className="p-10 font-sans max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Diagnóstico de Conectividade (Vercel)</h1>

            <div className="grid gap-6">
                <div className="p-4 border rounded shadow-sm bg-gray-50">
                    <h2 className="font-semibold text-lg border-b mb-2 pb-1">1. Chaves no Servidor</h2>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-500">API Key:</span>
                        <span className="font-mono">{apiKey ? `${apiKey.substring(0, 8)}... (Length: ${apiKey.length})` : 'MISSING'}</span>

                        <span className="text-gray-500">Base ID:</span>
                        <span className="font-mono">{baseId ? baseId : 'MISSING'}</span>

                        <span className="text-gray-500">Clerk Key:</span>
                        <span className="font-mono">{clerkKey ? 'PRESENT' : 'MISSING'}</span>
                    </div>
                </div>

                <div className="p-4 border rounded shadow-sm">
                    <h2 className="font-semibold text-lg border-b mb-2 pb-1 text-blue-600">2. Teste de Conexão</h2>
                    <div className="space-y-2">
                        <p><strong>Airtable Library:</strong> {libraryTest}</p>
                        <p><strong>Direct Fetch/API:</strong> {fetchTest}</p>
                    </div>
                </div>

                {rawError && (
                    <div className="p-4 border rounded shadow-sm bg-red-50">
                        <h2 className="font-semibold text-red-600 mb-2">Detalhes do Erro:</h2>
                        <pre className="text-xs overflow-auto max-h-60 p-2 bg-black text-green-400 rounded">
                            {rawError}
                        </pre>
                    </div>
                )}
            </div>

            <div className="mt-10 p-4 bg-yellow-50 border border-yellow-100 rounded text-sm text-yellow-800">
                <strong>Sugestão:</strong> Se o Fetch falhar com 401, o Token definitivamente não é aceito pela API do Airtable vindo da Vercel.
                Confirme se o Token não tem restrição de IP (IP Restrictions) e se o Base ID é exatamente o que aparece na URL do seu workspace.
            </div>
        </div>
    );
}
