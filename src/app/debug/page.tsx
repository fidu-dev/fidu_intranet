import { getProductBase, getAccessBase } from '@/lib/airtable/client';
import { AIRTABLE_TABLES } from '@/lib/airtable/config';
import { currentUser } from '@clerk/nextjs/server';

export default async function DebugPage() {
    const user = await currentUser();
    const apiKey = process.env.AIRTABLE_API_KEY;
    const productBaseId = process.env.AIRTABLE_PRODUCT_BASE_ID || process.env.AIRTABLE_BASE_ID;
    const accessBaseId = process.env.AIRTABLE_ACCESS_BASE_ID || process.env.AIRTABLE_AGENCY_BASE_ID;

    let productsTest = "Não iniciado";
    let accessTest = "Não iniciado";
    let rawError = "";

    const pBase = getProductBase();
    const aBase = getAccessBase();

    // Test 1: Products
    try {
        if (pBase) {
            await pBase(AIRTABLE_TABLES.PRODUCTS).select({ maxRecords: 1 }).firstPage();
            productsTest = "✅ Sucesso";
        } else {
            productsTest = "❌ Base nula ou API Key faltando";
        }
    } catch (e: any) {
        productsTest = `❌ Erro: ${e.message}`;
        rawError += `Produtos Base (${productBaseId}): ${e.message}\n`;
    }

    // Test 2: Access
    try {
        if (aBase) {
            await aBase(AIRTABLE_TABLES.ACCESS).select({ maxRecords: 1 }).firstPage();
            accessTest = "✅ Sucesso";
        } else {
            accessTest = "❌ Base nula";
        }
    } catch (e: any) {
        accessTest = `❌ Erro: ${e.message}`;
        rawError += `Acesso Base (${accessBaseId}): ${e.message}\n`;
    }

    return (
        <div className="p-10 font-sans max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Diagnóstico de Conexão Airtable</h1>

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
                        <span className="text-gray-500">Access Base:</span>
                        <span className="font-mono">{accessBaseId || 'Using Product Base'}</span>
                    </div>
                </div>

                <div className="p-4 border rounded shadow-sm bg-white">
                    <h2 className="font-semibold text-lg border-b mb-2 pb-1 text-blue-700">2. Testes de Conexão</h2>
                    <div className="space-y-3 mt-2">
                        <div>
                            <p className="text-sm font-medium">Tabela de Produtos:</p>
                            <div className={`p-2 rounded text-sm ${productsTest.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {productsTest}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium">Tabela de Acessos:</p>
                            <div className={`p-2 rounded text-sm ${accessTest.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {accessTest}
                            </div>
                        </div>
                    </div>
                </div>

                {rawError && (
                    <div className="p-4 border border-red-200 rounded bg-red-50">
                        <h2 className="font-semibold text-red-700 mb-2">Erros Detalhados</h2>
                        <pre className="text-xs overflow-auto max-h-60 p-2 bg-black text-green-400 rounded">
                            {rawError}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
