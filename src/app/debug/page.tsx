import { getProductBase, getAgencyBase } from '@/lib/airtable/client';
import { currentUser } from '@clerk/nextjs/server';

export default async function DebugPage() {
    const user = await currentUser();
    const apiKey = process.env.AIRTABLE_API_KEY;
    const productBaseId = process.env.AIRTABLE_PRODUCT_BASE_ID || process.env.AIRTABLE_BASE_ID;
    const agencyBaseId = process.env.AIRTABLE_AGENCY_BASE_ID;
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    let productsTest = "Não iniciado";
    let agenciesTest = "Não iniciado";
    let rawError = "";

    const pBase = getProductBase();
    const aBase = getAgencyBase();

    // Test 1: Products
    try {
        if (pBase) {
            await pBase('Products').select({ maxRecords: 1 }).firstPage();
            productsTest = "✅ Sucesso";
        } else {
            productsTest = "❌ Base nula (AIRTABLE_PRODUCT_BASE_ID)";
        }
    } catch (e: any) {
        productsTest = `❌ Erro: ${e.message}`;
        rawError += `Produtos Base (${productBaseId}): ${e.message}\n`;
    }

    // Test 2: Agencies
    try {
        if (aBase) {
            // Note: Schema confirms "Table 1" as the name
            await aBase('Table 1').select({ maxRecords: 1 }).firstPage();
            agenciesTest = "✅ Sucesso";
        } else {
            agenciesTest = "❌ Base nula (AIRTABLE_AGENCY_BASE_ID)";
        }
    } catch (e: any) {
        agenciesTest = `❌ Erro: ${e.message}`;
        rawError += `Agências Base (${agencyBaseId}): ${e.message}\n`;
    }

    return (
        <div className="p-10 font-sans max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Diagnóstico Multi-Base (Vercel)</h1>

            <div className="grid gap-6">
                <div className="p-4 border rounded shadow-sm bg-purple-50">
                    <h2 className="font-semibold text-lg border-b mb-2 pb-1 text-purple-700">0. Usuário da Sessão</h2>
                    <div className="text-sm">
                        <p><strong>Email logado:</strong> {user?.emailAddresses[0]?.emailAddress || 'Ninguém logado'}</p>
                    </div>
                </div>

                <div className="p-4 border rounded shadow-sm bg-gray-50">
                    <h2 className="font-semibold text-lg border-b mb-2 pb-1 text-gray-700">1. Chaves de Ambiente</h2>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-500">API Key:</span>
                        <span className="font-mono">{apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING'}</span>

                        <span className="text-gray-500">Product Base:</span>
                        <span className="font-mono">{productBaseId || 'MISSING'}</span>

                        <span className="text-gray-500">Agency Base:</span>
                        <span className="font-mono">{agencyBaseId || 'MISSING'}</span>
                    </div>
                </div>

                <div className="p-4 border rounded shadow-sm bg-white">
                    <h2 className="font-semibold text-lg border-b mb-2 pb-1 text-blue-600">2. Teste de Conexão</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="font-medium">Tabela 'Products':</p>
                            <p className="text-sm">{productsTest}</p>
                        </div>
                        <div>
                            <p className="font-medium">Tabela 'Table 1' (Agencies):</p>
                            <p className="text-sm">{agenciesTest}</p>
                        </div>
                    </div>
                </div>

                {rawError && (
                    <div className="p-4 border rounded shadow-sm bg-red-50">
                        <h2 className="font-semibold text-red-600 mb-2">Logs de Erro:</h2>
                        <pre className="text-xs overflow-auto max-h-60 p-2 bg-black text-green-400 rounded">
                            {rawError}
                        </pre>
                    </div>
                )}
            </div>

            <p className="mt-8 text-sm text-gray-400 italic">
                Se tudo estiver verde, o `/portal` já deve funcionar se o seu email estiver cadastrado na 'Table 1'.
            </p>
        </div>
    );
}
