'use server'

import { getProducts, getAgencyByEmail, getMuralItems, getNoticeReadLogs, confirmNoticeRead, getNoticeReaders, createReservation, getExchangeRates } from '@/lib/airtable/service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface AgencyInfo {
    agentName: string;
    agencyName: string;
    commissionRate: number;
    canReserve: boolean;
    canAccessMural: boolean;
    isInternal: boolean;
    canAccessExchange: boolean;
}

import { AgencyProduct, MuralItem, Reservation, ExchangeRate } from '@/lib/airtable/types';

import { auth, currentUser } from '@clerk/nextjs/server';

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

export async function getAgencyProducts(): Promise<{ products: AgencyProduct[], agency?: AgencyInfo, hasUnreadMural?: boolean, error?: string | 'UNAUTHENTICATED' | 'UNAUTHORIZED' }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { products: [], error: authResult.error };

    const email = authResult.email!;

    try {
        const agency = await getAgencyByEmail(email);
        if (!agency) return { products: [], error: 'UNAUTHORIZED' };

        // If no agency found for default email, show all products with default commission
        const commissionRate = agency?.commissionRate || 0.15; // Default 15% commission
        const isAdmin = false; // No admin access in public mode

        const agencyInfo: AgencyInfo = {
            agentName: agency?.agentName || 'Agente',
            agencyName: agency?.name || 'Fidu Viagens',
            commissionRate: commissionRate,
            canReserve: agency?.canReserve ?? false,
            canAccessMural: agency?.canAccessMural ?? false,
            isInternal: agency?.isInternal ?? false,
            canAccessExchange: agency?.canAccessExchange ?? false
        };

        // Fetch Mural items to check for unread
        let hasUnreadMural = false;
        if (agency) {
            try {
                const [muralItems, readLogs] = await Promise.all([
                    getMuralItems(),
                    getNoticeReadLogs(agency.id)
                ]);
                const readNoticeIds = new Set(readLogs.map(log => log.noticeId));
                hasUnreadMural = muralItems.some(item => !readNoticeIds.has(item.id));
            } catch (e) {
                console.error('Error checking unread mural:', e);
            }
        }

        // Fetch Base Products
        const products = await getProducts();

        if (!products || products.length === 0) {
            return { products: [], agency: agencyInfo, hasUnreadMural };
        }

        // Calculate Prices and Filter by Skill (Destination)
        const authorizedSkills = agency?.skills ? agency.skills.map(s => s.toLowerCase().trim()) : [];

        const agencyProducts = products
            .filter(product => {
                // If no agency or no skills, show all products
                if (!agency || authorizedSkills.length === 0) return true;

                return authorizedSkills.some(skill =>
                    skill === product.destination.toLowerCase().trim()
                );
            })
            .map(product => {
                const calculateNeto = (venda: number) => Math.round(venda * (1 - commissionRate) * 100) / 100;

                return {
                    id: product.id,
                    destination: product.destination,
                    tourName: product.tourName,
                    category: product.category,
                    basePrice: product.basePrice,
                    priceAdulto: product.priceAdulto,
                    priceMenor: product.priceMenor,
                    priceBebe: product.priceBebe,
                    // Adulto
                    salePriceAdulto: product.priceAdulto,
                    netoPriceAdulto: calculateNeto(product.priceAdulto),
                    // Menor
                    salePriceMenor: product.priceMenor,
                    netoPriceMenor: calculateNeto(product.priceMenor),
                    // Bebê
                    salePriceBebe: product.priceBebe,
                    netoPriceBebe: calculateNeto(product.priceBebe),

                    // Seasonal - Verão 2026
                    priceAdultoVer26: product.priceAdultoVer26,
                    priceMenorVer26: product.priceMenorVer26,
                    priceBebeVer26: product.priceBebeVer26,

                    salePriceAdultoVer26: product.priceAdultoVer26,
                    netoPriceAdultoVer26: calculateNeto(product.priceAdultoVer26),
                    salePriceMenorVer26: product.priceMenorVer26,
                    netoPriceMenorVer26: calculateNeto(product.priceMenorVer26),
                    salePriceBebeVer26: product.priceBebeVer26,
                    netoPriceBebeVer26: calculateNeto(product.priceBebeVer26),

                    // Seasonal - Inverno 2026
                    priceAdultoInv26: product.priceAdultoInv26,
                    priceMenorInv26: product.priceMenorInv26,
                    priceBebeInv26: product.priceBebeInv26,

                    salePriceAdultoInv26: product.priceAdultoInv26,
                    netoPriceAdultoInv26: calculateNeto(product.priceAdultoInv26),
                    salePriceMenorInv26: product.priceMenorInv26,
                    netoPriceMenorInv26: calculateNeto(product.priceMenorInv26),
                    salePriceBebeInv26: product.priceBebeInv26,
                    netoPriceBebeInv26: calculateNeto(product.priceBebeInv26),

                    pickup: product.pickup,
                    retorno: product.retorno,
                    temporada: product.temporada,
                    diasElegiveis: product.diasElegiveis,
                    subCategory: product.subCategory,
                    taxasExtras: product.taxasExtras,
                    description: product.description,
                    inclusions: product.inclusions,
                    exclusions: product.exclusions,
                    requirements: product.requirements,
                    imageUrl: product.imageUrl,
                    status: product.status,
                    provider: product.provider,
                    duration: product.duration,
                    whatToBring: product.whatToBring,
                    valorExtra: product.valorExtra,
                    optionals: product.optionals,
                    restrictions: product.restrictions,
                    observations: product.observations,
                };
            });

        return { products: agencyProducts, agency: agencyInfo, hasUnreadMural };
    } catch (err: any) {
        console.error('Error in getAgencyProducts:', err);
        // Safely extract the error message to avoid returning an object to the React server component
        const errorMessage = typeof err === 'string' ? err : (err?.message || 'Unknown error');
        return {
            products: [],
            error: `Falha ao carregar produtos: ${errorMessage}. Verifique suas credenciais do Airtable.`
        };
    }
}

export async function fetchMural(): Promise<{ items: MuralItem[], readLogs: string[], isAdmin: boolean, error?: string | 'UNAUTHENTICATED' | 'UNAUTHORIZED' }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { items: [], readLogs: [], isAdmin: false, error: authResult.error };

    const email = authResult.email!;

    try {
        const agency = await getAgencyByEmail(email);
        if (!agency) return { items: [], readLogs: [], isAdmin: false, error: 'UNAUTHORIZED' };

        const [items, logs] = await Promise.all([
            getMuralItems(),
            agency ? getNoticeReadLogs(agency.id) : Promise.resolve([])
        ]);

        return {
            items,
            readLogs: logs.map(l => l.noticeId),
            isAdmin: false
        };
    } catch (e: any) {
        console.error('Error fetching mural:', e);
        return { items: [], readLogs: [], isAdmin: false, error: `Erro ao carregar o mural: ${e.message || 'Unknown error'}` };
    }
}

export async function confirmNoticeReadAction(noticeId: string): Promise<{ success: boolean, error?: string }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { success: false, error: authResult.error };

    const email = authResult.email!;

    try {
        const agency = await getAgencyByEmail(email);

        if (!agency) {
            return { success: false, error: 'UNAUTHORIZED' };
        }

        await confirmNoticeRead(agency.id, noticeId);

        return { success: true };
    } catch (e: any) {
        console.error('Error confirming notice read:', e);
        return { success: false, error: e.message || 'Erro ao confirmar leitura.' };
    }
}

export async function fetchMuralReaders(noticeId: string): Promise<{ readers: { userName: string, timestamp: string, agencyName?: string }[], error?: string }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { readers: [], error: authResult.error };

    const email = authResult.email!;

    try {
        const agency = await getAgencyByEmail(email);

        if (!agency) {
            return { readers: [], error: 'UNAUTHORIZED' };
        }

        const readers = await getNoticeReaders(noticeId, agency.agencyId, false);
        return { readers };
    } catch (e) {
        console.error('Error fetching mural readers:', e);
        return { readers: [], error: 'Erro ao carregar lista de leitura.' };
    }
}

export async function createReservationAction(data: Omit<Reservation, 'agentName' | 'agentEmail' | 'status'>): Promise<{ success: boolean, id?: string, error?: string }> {
    const authResult = await getAuthEmail();
    if (authResult.error) return { success: false, error: authResult.error };

    const email = authResult.email!;

    try {
        const agency = await getAgencyByEmail(email);

        if (!agency) return { success: false, error: 'UNAUTHORIZED' };

        const agentName = agency?.agentName || 'Agente';

        const reservationId = await createReservation({
            ...data,
            agentName,
            agentEmail: email,
            status: 'Pré-reserva'
        });

        return { success: true, id: reservationId };
    } catch (e: any) {
        console.error('Error in createReservationAction:', e);
        return { success: false, error: e.message || 'Erro ao criar reserva.' };
    }
}

export async function getExchangeRatesAction(): Promise<{ rates: ExchangeRate[], error?: string }> {
    try {
        const rates = await getExchangeRates();
        return { rates };
    } catch (e: any) {
        console.error('Error in getExchangeRatesAction:', e);
        return { rates: [], error: e.message || 'Erro ao carregar cotações.' };
    }
}
