'use server'

import { getProducts } from '@/lib/services/productService';
import { getAgencyByEmail as getPrismaUser } from '@/lib/services/userService';
import { getAgencyByEmail as getAirtableUser, getMuralItems, getNoticeReadLogs, confirmNoticeRead, getNoticeReaders, getExchangeRates } from '@/lib/airtable/service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

export interface AgencyInfo {
    agentName: string;
    agencyName: string;
    commissionRate: number;
    canReserve: boolean;
    canAccessMural: boolean;
    isInternal: boolean;
    canAccessExchange: boolean;
}

// Get the currently authenticated Clerk user's primary email
async function getAuthEmail(): Promise<{ email?: string, error?: 'UNAUTHENTICATED' | 'CLERK_ERROR' }> {
    try {
        const user = await currentUser();
        if (!user) return { error: 'UNAUTHENTICATED' };

        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) return { error: 'UNAUTHENTICATED' };

        return { email };
    } catch (error) {
        console.error('Clerk Authentication Error:', error);
        return { error: 'CLERK_ERROR' };
    }
}

export async function getAgencyProducts(): Promise<{ products: any[], agency?: AgencyInfo, preferences?: any, hasUnreadMural?: boolean, error?: string | 'UNAUTHENTICATED' | 'UNAUTHORIZED' }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { products: [], error: authResult.error };

    const email = authResult.email!;

    try {
        const capabilities = await getPrismaUser(email);
        if (!capabilities) return { products: [], error: 'UNAUTHORIZED' };

        const commissionRate = capabilities.commissionRate || 0.15;

        const agencyInfo: AgencyInfo = {
            agentName: capabilities.name || email, // Nome do agente (usuário)
            agencyName: capabilities.agencyName || capabilities.name || email, // Nome da agência
            commissionRate: commissionRate,
            canReserve: capabilities.canReserve,
            canAccessMural: capabilities.canAccessMural,
            isInternal: capabilities.isInternal,
            canAccessExchange: capabilities.canAccessExchange
        };

        const products = await getProducts();

        if (!products || products.length === 0) {
            return { products: [], agency: agencyInfo, preferences: capabilities.preferences, hasUnreadMural: false };
        }

        const agencyProducts = products
            .map(product => {
                const calculateNeto = (venda: number) => Math.round(venda * (1 - commissionRate) * 100) / 100;

                const parsePrice = (priceStr: string) => {
                    const cleaned = priceStr.replace(/[^0-9,.]/g, '').replace(',', '.');
                    return parseFloat(cleaned) || 0;
                };

                const basePrice = parsePrice(product.inv26Adu);
                const priceAdulto = parsePrice(product.inv26Adu);
                const priceMenor = parsePrice(product.inv26Chd);
                const priceBebe = parsePrice(product.inv26Inf);

                const priceAdultoVer26 = parsePrice(product.ver26Adu);
                const priceMenorVer26 = parsePrice(product.ver26Chd);
                const priceBebeVer26 = parsePrice(product.ver26Inf);

                return {
                    id: product.id,
                    destination: product.destino,
                    tourName: product.servico,
                    category: product.categoria,
                    basePrice,
                    priceAdulto,
                    priceMenor,
                    priceBebe,
                    salePriceAdulto: priceAdulto,
                    netoPriceAdulto: calculateNeto(priceAdulto),
                    salePriceMenor: priceMenor,
                    netoPriceMenor: calculateNeto(priceMenor),
                    salePriceBebe: priceBebe,
                    netoPriceBebe: calculateNeto(priceBebe),

                    priceAdultoVer26,
                    priceMenorVer26,
                    priceBebeVer26,
                    salePriceAdultoVer26: priceAdultoVer26,
                    netoPriceAdultoVer26: calculateNeto(priceAdultoVer26),
                    salePriceMenorVer26: priceMenorVer26,
                    netoPriceMenorVer26: calculateNeto(priceMenorVer26),
                    salePriceBebeVer26: priceBebeVer26,
                    netoPriceBebeVer26: calculateNeto(priceBebeVer26),

                    priceAdultoInv26: priceAdulto,
                    priceMenorInv26: priceMenor,
                    priceBebeInv26: priceBebe,
                    salePriceAdultoInv26: priceAdulto,
                    netoPriceAdultoInv26: calculateNeto(priceAdulto),
                    salePriceMenorInv26: priceMenor,
                    netoPriceMenorInv26: calculateNeto(priceMenor),
                    salePriceBebeInv26: priceBebe,
                    netoPriceBebeInv26: calculateNeto(priceBebe),

                    pickup: product.pickup,
                    retorno: product.retorno,
                    temporada: product.temporada,
                    diasElegiveis: product.diasElegiveis,
                    subCategory: product.tags?.join(', '),
                    taxasExtras: product.taxasExtras,
                    description: product.resumo,
                    inclusions: product.opcionais,
                    exclusions: '',
                    requirements: product.restricoes,
                    imageUrl: product.midia,
                    status: product.status,
                    provider: product.operador,
                    duration: product.duracao,
                    whatToBring: product.oQueLevar,
                    valorExtra: product.valorExtra,
                    optionals: product.opcionais,
                    restrictions: product.restricoes,
                    observations: product.observacoes,
                };
            });

        return { products: agencyProducts, agency: agencyInfo, preferences: capabilities.preferences, hasUnreadMural: false };
    } catch (err: any) {
        console.error('Error in getAgencyProducts:', err);
        const errorMessage = typeof err === 'string' ? err : (err?.message || 'Unknown error');
        return {
            products: [],
            error: `Falha ao carregar produtos: ${errorMessage}.`
        };
    }
}

// Restoring Airtable features for Mural and Exchange with DB permissions Checks
export async function fetchMural(): Promise<{ items: any[], readLogs: string[], isAdmin: boolean, error?: string | 'UNAUTHENTICATED' | 'UNAUTHORIZED' }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { items: [], readLogs: [], isAdmin: false, error: authResult.error };

    const email = authResult.email!;
    const capabilities = await getPrismaUser(email);

    if (!capabilities || !capabilities.canAccessMural) {
        return { items: [], readLogs: [], isAdmin: false, error: 'UNAUTHORIZED' };
    }

    try {
        const airtableUser = await getAirtableUser(email);
        const userId = airtableUser?.id || '';

        const [items, logs] = await Promise.all([
            getMuralItems(),
            userId ? getNoticeReadLogs(userId) : Promise.resolve([])
        ]);

        const readNoticeIds = logs.map(l => l.noticeId);

        return {
            items,
            readLogs: readNoticeIds,
            isAdmin: !!capabilities.isAdmin
        };
    } catch (error: any) {
        console.error('Error fetching mural:', error);
        return { items: [], readLogs: [], isAdmin: !!capabilities.isAdmin, error: error.message };
    }
}

export async function confirmNoticeReadAction(noticeId: string): Promise<{ success: boolean, error?: string }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { success: false, error: authResult.error };

    const email = authResult.email!;
    try {
        const airtableUser = await getAirtableUser(email);
        if (!airtableUser?.id) return { success: false, error: 'Usuário não encontrado no Airtable para registro' };

        await confirmNoticeRead(airtableUser.id, noticeId);
        revalidatePath('/portal/mural');
        revalidatePath('/portal');
        return { success: true };
    } catch (e: any) {
        console.error('Action error confirming notice:', e);
        return { success: false, error: e.message };
    }
}

export async function fetchMuralReaders(noticeId: string): Promise<{ readers: any[], error?: string }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { readers: [], error: authResult.error };

    const email = authResult.email!;
    const capabilities = await getPrismaUser(email);

    // Only Admin can fetch readers list
    if (!capabilities || !capabilities.isAdmin) {
        return { readers: [], error: 'UNAUTHORIZED' };
    }

    try {
        const readers = await getNoticeReaders(noticeId, undefined, true);
        return { readers };
    } catch (e: any) {
        return { readers: [], error: e.message };
    }
}

export async function createReservationAction(data: any): Promise<{ success: boolean, id?: string, error?: string }> {
    return { success: true, id: '123' }; // To be replaced when moving reservations to Prisma
}

export async function getExchangeRatesAction(): Promise<{ rates: any[], error?: string }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { rates: [], error: authResult.error };

    const email = authResult.email!;
    const capabilities = await getPrismaUser(email);

    if (!capabilities || !capabilities.canAccessExchange) {
        return { rates: [], error: 'UNAUTHORIZED' };
    }

    try {
        const rates = await getExchangeRates();
        return { rates };
    } catch (e: any) {
        console.error('Action error fetching exchange rates:', e);
        return { rates: [], error: e.message };
    }
}

export async function saveUserPreferences(preferences: any): Promise<{ success: boolean }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { success: false };

    try {
        await prisma.user.update({
            where: { email: authResult.email },
            data: { preferences } as any
        });
        return { success: true };
    } catch (error) {
        console.error('Error saving user preferences:', error);
        return { success: false };
    }
}

