'use server'

import { getProducts, getActiveSeasons } from '@/lib/services/productService';
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
    isAdmin: boolean;
    canAccessExchange: boolean;
    allowedDestinations: string[];
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

export async function getAgencyProducts(): Promise<{ products: any[], agency?: AgencyInfo, preferences?: any, hasUnreadMural?: boolean, seasons?: { code: string; label: string }[], error?: string | 'UNAUTHENTICATED' | 'UNAUTHORIZED' }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { products: [], error: authResult.error };

    const email = authResult.email!;

    try {
        const capabilities = await getPrismaUser(email);
        if (!capabilities) return { products: [], error: 'UNAUTHORIZED' };

        const commissionRate = capabilities.commissionRate || 0.15;

        const agencyInfo: AgencyInfo = {
            agentName: capabilities.name || email,
            agencyName: capabilities.agencyName || capabilities.name || email,
            commissionRate: commissionRate,
            canReserve: capabilities.canReserve,
            canAccessMural: capabilities.canAccessMural,
            isInternal: capabilities.isInternal,
            isAdmin: capabilities.isAdmin || false,
            canAccessExchange: capabilities.canAccessExchange,
            allowedDestinations: capabilities.allowedDestinations || []
        };

        const [rawProducts, seasons] = await Promise.all([
            getProducts(),
            getActiveSeasons(),
        ]);

        // Filter by allowed destinations (empty array means ALL destinations are allowed)
        const products = agencyInfo.allowedDestinations.length > 0
            ? rawProducts.filter(p => agencyInfo.allowedDestinations.includes((p.destino || '').trim().toUpperCase()))
            : rawProducts;

        if (!products || products.length === 0) {
            return { products: [], agency: agencyInfo, preferences: capabilities.preferences, hasUnreadMural: false, seasons };
        }

        const parsePrice = (priceStr: string) => {
            const cleaned = priceStr.replace(/[^0-9,.]/g, '').replace(',', '.');
            return parseFloat(cleaned) || 0;
        };

        const agencyProducts = products
            .map(product => {
                const calculateNeto = (venda: number) => Math.round(venda * (1 - commissionRate) * 100) / 100;

                // Preços dinâmicos por temporada
                const seasonPrices: Record<string, {
                    priceAdulto: number; priceMenor: number; priceBebe: number;
                    salePriceAdulto: number; netoPriceAdulto: number;
                    salePriceMenor: number; netoPriceMenor: number;
                    salePriceBebe: number; netoPriceBebe: number;
                }> = {};

                for (const season of seasons) {
                    const sp = product.prices[season.code];
                    const adu = sp ? parsePrice(sp.adu) : 0;
                    const chd = sp ? parsePrice(sp.chd) : 0;
                    const inf = sp ? parsePrice(sp.inf) : 0;
                    seasonPrices[season.code] = {
                        priceAdulto: adu, priceMenor: chd, priceBebe: inf,
                        salePriceAdulto: adu, netoPriceAdulto: calculateNeto(adu),
                        salePriceMenor: chd, netoPriceMenor: calculateNeto(chd),
                        salePriceBebe: inf, netoPriceBebe: calculateNeto(inf),
                    };
                }

                // Default: primeiro season ou fallback legado
                const defaultSeason = seasons[0]?.code;
                const defaultPrices = defaultSeason && seasonPrices[defaultSeason]
                    ? seasonPrices[defaultSeason]
                    : { priceAdulto: 0, priceMenor: 0, priceBebe: 0, salePriceAdulto: 0, netoPriceAdulto: 0, salePriceMenor: 0, netoPriceMenor: 0, salePriceBebe: 0, netoPriceBebe: 0 };

                return {
                    id: product.id,
                    destination: product.destino,
                    tourName: product.title,
                    category: product.categoria,
                    basePrice: defaultPrices.priceAdulto,
                    // Default prices (backward compat)
                    ...defaultPrices,
                    // Preços por temporada
                    seasonPrices,
                    // Compat legado explícito para VER26/INV26
                    priceAdultoVer26: seasonPrices['VER26']?.priceAdulto ?? 0,
                    priceMenorVer26: seasonPrices['VER26']?.priceMenor ?? 0,
                    priceBebeVer26: seasonPrices['VER26']?.priceBebe ?? 0,
                    salePriceAdultoVer26: seasonPrices['VER26']?.salePriceAdulto ?? 0,
                    netoPriceAdultoVer26: seasonPrices['VER26']?.netoPriceAdulto ?? 0,
                    salePriceMenorVer26: seasonPrices['VER26']?.salePriceMenor ?? 0,
                    netoPriceMenorVer26: seasonPrices['VER26']?.netoPriceMenor ?? 0,
                    salePriceBebeVer26: seasonPrices['VER26']?.salePriceBebe ?? 0,
                    netoPriceBebeVer26: seasonPrices['VER26']?.netoPriceBebe ?? 0,
                    priceAdultoInv26: seasonPrices['INV26']?.priceAdulto ?? 0,
                    priceMenorInv26: seasonPrices['INV26']?.priceMenor ?? 0,
                    priceBebeInv26: seasonPrices['INV26']?.priceBebe ?? 0,
                    salePriceAdultoInv26: seasonPrices['INV26']?.salePriceAdulto ?? 0,
                    netoPriceAdultoInv26: seasonPrices['INV26']?.netoPriceAdulto ?? 0,
                    salePriceMenorInv26: seasonPrices['INV26']?.salePriceMenor ?? 0,
                    netoPriceMenorInv26: seasonPrices['INV26']?.netoPriceMenor ?? 0,
                    salePriceBebeInv26: seasonPrices['INV26']?.salePriceBebe ?? 0,
                    netoPriceBebeInv26: seasonPrices['INV26']?.netoPriceBebe ?? 0,

                    pickup: product.pickup,
                    retorno: product.retorno,
                    temporada: product.temporada,
                    diasElegiveis: product.diasElegiveis,
                    subCategory: product.tags?.join(', '),
                    taxasExtras: product.taxasExtras,
                    description: product.description,
                    inclusions: product.opcionais,
                    exclusions: '',
                    requirements: product.restricoes,
                    imageUrl: product.midia,
                    status: product.statusOperativo,
                    provider: product.operador,
                    duration: product.duracao,
                    whatToBring: product.oQueLevar,
                    valorExtra: product.valorExtra,
                    optionals: product.opcionais,
                    restrictions: product.restricoes,
                    observations: product.observacoes,
                };
            });

        return { products: agencyProducts, agency: agencyInfo, preferences: capabilities.preferences, hasUnreadMural: false, seasons };
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

