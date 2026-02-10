-import { getProductBase, getAgencyBase } from '@/lib/airtable/client';
+import { getProductBase, getAccessBase } from '@/lib/airtable/client';
+import { AIRTABLE_TABLES } from '@/lib/airtable/config';
import { currentUser } from '@clerk/nextjs/server';

export default async function DebugPage() {
    const user = await currentUser();
    const apiKey = process.env.AIRTABLE_API_KEY;
    const productBaseId = process.env.AIRTABLE_PRODUCT_BASE_ID || process.env.AIRTABLE_BASE_ID;
    -    const agencyBaseId = process.env.AIRTABLE_AGENCY_BASE_ID;
    +    const agencyBaseId = process.env.AIRTABLE_ACCESS_BASE_ID || process.env.AIRTABLE_AGENCY_BASE_ID;
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    let productsTest = "Não iniciado";
    let agenciesTest = "Não iniciado";
    let rawError = "";

    const pBase = getProductBase();
    -    const aBase = getAgencyBase();
    +    const aBase = getAccessBase();

    // Test 1: Products
    try {
        if (pBase) {
            await pBase('Products').select({ maxRecords: 1 }).firstPage();
            productsTest = "✅ Sucesso";
        } else {
            productsTest = "❌ Base nula ou API Key faltando (Verarque AIRTABLE_API_KEY e AIRTABLE_PRODUCT_BASE_ID)";
        }
    } catch (e: any) {
        productsTest = `❌ Erro: ${e.message}`;
        rawError += `Produtos Base (${productBaseId}): ${e.message}\n`;
    }

    // Test 2: Agencies (In Product Base)
    try {
        -        if (pBase) {
            +        if (aBase) {
                // Using User's new table ID for Acessos
                -            await pBase('tbljUc8sptfa7QnAE').select({ maxRecords: 1 }).firstPage();
                -            agenciesTest = "✅ Sucesso (na Product Base)";
                +            await aBase(AIRTABLE_TABLES.ACCESS).select({ maxRecords: 1 }).firstPage();
                +            agenciesTest = "✅ Sucesso (na Access Base)";
            } else {
                agenciesTest = "❌ Base nula: A conexão com o Airtable falhou.";
            }
        } catch (e: any) {
            agenciesTest = `❌ Erro: ${e.message}`;
            rawError += `Agências na Product Base (${productBaseId}): ${e.message}\n`;
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
