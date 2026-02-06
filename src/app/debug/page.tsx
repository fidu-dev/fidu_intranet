import { getAirtableBase } from '@/lib/airtable/client';
import { currentUser } from '@clerk/nextjs/server';

export default async function DebugPage() {
    const user = await currentUser();
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    let productsTest = "Não iniciado";
    let agenciesTest = "Não iniciado";
    let rawError = "";

    const base = getAirtableBase();

    // Test 1: Products
    try {
        if (base) {
            await base('Products').select({ maxRecords: 1 }).firstPage();
            productsTest = "✅ Sucesso";
        } else {
            productsTest = "❌ Base nula";
        }
    } catch (e: any) {
        productsTest = `❌ Erro: ${e.message}`;
        rawError += `Produtos: ${e.message}\n`;
    }

    // Test 2: Agencies
    try {
        if (base) {
            await base('Agencies').select({ maxRecords: 1 }).firstPage();
            agenciesTest = "✅ Sucesso";
        } else {
            agenciesTest = "❌ Base nula";
        }
    } catch (e: any) {
        agenciesTest = `❌ Erro: ${e.message}`;
        rawError += `Agências: ${e.message}\n`;
    }

    return (
        <div className="p-10 font-sans max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Diagnóstico de Conectividade (Vercel)</h1>

            <div className="grid gap-6">
                <div className="p-4 border rounded shadow-sm bg-gray-50">
                    <h2 className="font-semibold text-lg border-b mb-2 pb-1 text-purple-600">0. Usuário Logado</h2>
                    <div className="text-sm">
                        <p><strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress || 'Ninguém logado'}</p>
                        <p><strong>ID Clerk:</strong> {user?.id || 'N/A'}</p>
                    </div>
                </div>

                <div className="p-4 border rounded shadow-sm bg-gray-50">
                    <h2 className="font-semibold text-lg border-b mb-2 pb-1">1. Chaves no Servidor</h2>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-500">API Key:</span>
                        <span className="font-mono">{apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING'}</span>

                        <span className="text-gray-500">Base ID:</span>
                        <span className="font-mono">{baseId ? baseId : 'MISSING'}</span>

                        <span className="text-gray-500">Clerk Key:</span>
                        <span className="font-mono">{clerkKey ? 'PRESENT' : 'MISSING'}</span>
                    </div>
                </div>

                <div className="p-4 border rounded shadow-sm">
                    <h2 className="font-semibold text-lg border-b mb-2 pb-1 text-blue-600">2. Teste de Tabelas (Airtable SDK)</h2>
                    <div className="space-y-2">
                        <p><strong>Tabela 'Products':</strong> {productsTest}</p>
                        <p><strong>Tabela 'Agencies':</strong> {agenciesTest}</p>
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
                <strong>Sugestão:</strong> Se o teste de 'Agencies' falhar com 404, verifique se a tabela existe com esse nome exato. Se falhar com 401, o Token não tem acesso a essa base no Airtable.
            </div>
        </div>
    );
}
