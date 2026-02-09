'use server'

import { currentUser } from '@clerk/nextjs/server';
import { getProducts, getAgencyByEmail, getMuralItems, getNoticeReadLogs, confirmNoticeRead, getNoticeReaders, createReservation, getExchangeRates } from '@/lib/airtable/service';
import { revalidatePath } from 'next/cache';

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

export async function getAgencyProducts(): Promise<{ products: AgencyProduct[], agency?: AgencyInfo, hasUnreadMural?: boolean, error?: string }> {
    try {
        const user = await currentUser();

        if (!user) {
            return { products: [], error: 'Unauthorized' };
        }

        // Get Primary Email
        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) {
            return { products: [], error: 'No email found for this user.' };
        }

        // Fetch Agency Details
        const agency = await getAgencyByEmail(email);

        // STRICT ACCESS CONTROL: Only allow agencies in the list
        if (!agency) {
            return {
                products: [],
                error: 'ACESSO NEGADO: Seu e-mail não está na lista de agentes autorizados. Por favor, entre em contato com a Fidu para habilitar seu acesso.'
            };
        }

        const commissionRate = agency.commissionRate;

        const role = user.publicMetadata?.role;
        const isAdmin = role === 'admin' || email === 'rafael@fidu.com' || email === 'admin@fidu.com';

        const agencyInfo: AgencyInfo = {
            agentName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Agente',
            agencyName: agency.name,
            commissionRate: commissionRate,
            canReserve: isAdmin || !!agency.canReserve,
            canAccessMural: isAdmin || !!agency.canAccessMural,
            isInternal: !!agency.isInternal,
            canAccessExchange: isAdmin || !!agency.canAccessExchange
        };

        // Fetch Mural items to check for unread
        let hasUnreadMural = false;
        try {
            const [muralItems, readLogs] = await Promise.all([
                getMuralItems(),
                getNoticeReadLogs(agency.id)
            ]);
            const readNoticeIds = new Set(readLogs.map(log => log.noticeId));
            hasUnreadMural = muralItems.some(item => !readNoticeIds.has(item.id));
        } catch (e) {
            console.error('Error checking unread mural in Layout:', e);
        }

        // Fetch Base Products
        const products = await getProducts();

        if (!products || products.length === 0) {
            return { products: [], agency: agencyInfo, hasUnreadMural };
        }

        // Calculate Prices and Filter by Skill (Destination)
        const authorizedSkills = (agency.skills || []).map(s => s.toLowerCase().trim());

        const agencyProducts = products
            .filter(product => {
                // Admins see everything
                if (isAdmin) return true;

                // If there are skills defined, the user must have the skill for that destination
                // If no skills are defined, we return NO products (strict whitelist)
                if (authorizedSkills.length === 0) return false;

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
        console.error('Error in getAgencyProducts full details:', {
            message: err.message,
            stack: err.stack,
            error: err
        });
        return {
            products: [],
            error: `Failed to load products: ${err.message || 'Unknown error'}. Check your connection and credentials.`
        };
    }
}

export async function fetchMural(): Promise<{ items: MuralItem[], readLogs: string[], isAdmin: boolean, userName: string, error?: string }> {
    try {
        const user = await currentUser();
        const email = user?.emailAddresses[0]?.emailAddress;
        if (!email) throw new Error('No email found');

        const agency = await getAgencyByEmail(email);
        if (!agency) throw new Error('Agency not found');

        if (!agency.canAccessMural) {
            throw new Error('ACESSO NEGADO: Você não tem permissão para acessar o Mural.');
        }

        const [items, logs] = await Promise.all([
            getMuralItems(),
            getNoticeReadLogs(agency.id)
        ]);

        const userName = agency.agentName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Agente';

        return {
            items,
            readLogs: logs.map(l => l.noticeId),
            isAdmin: !!agency.isAdmin,
            userName
        };
    } catch (e: any) {
        console.error('Error fetching mural:', e);
        return { items: [], readLogs: [], isAdmin: false, userName: 'Agente', error: `Erro ao carregar o mural: ${e.message || 'Unknown error'}` };
    }
}

export async function confirmNoticeReadAction(noticeId: string): Promise<{ success: boolean, error?: string }> {
    try {
        const user = await currentUser();
        if (!user) throw new Error('Not authenticated');

        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) throw new Error('No email found');

        const agency = await getAgencyByEmail(email);
        if (!agency) throw new Error('Agency not found');

        await confirmNoticeRead(agency.id, noticeId);

        return { success: true };
    } catch (e: any) {
        console.error('Error confirming notice read:', e);
        return { success: false, error: e.message || 'Erro ao confirmar leitura.' };
    }
}

export async function fetchMuralReaders(noticeId: string): Promise<{ readers: { userName: string, timestamp: string, agencyName?: string }[], error?: string }> {
    try {
        const user = await currentUser();
        if (!user) throw new Error('Not authenticated');

        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) throw new Error('No email found');

        const agency = await getAgencyByEmail(email);
        if (!agency) throw new Error('Agency not found');

        const readers = await getNoticeReaders(noticeId, agency.id, !!agency.isAdmin);
        return { readers };
    } catch (e) {
        console.error('Error fetching mural readers:', e);
        return { readers: [], error: 'Erro ao carregar lista de leitura.' };
    }
}

export async function createReservationAction(data: Omit<Reservation, 'agentName' | 'agentEmail' | 'status'>): Promise<{ success: boolean, id?: string, error?: string }> {
    try {
        const user = await currentUser();
        if (!user) throw new Error('Not authenticated');

        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) throw new Error('No email found');

        const agency = await getAgencyByEmail(email);
        if (!agency) throw new Error('Agency not found');

        const agentName = agency.agentName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Agente';

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
        const user = await currentUser();
        if (!user) throw new Error('Not authenticated');

        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) throw new Error('No email found');

        const agency = await getAgencyByEmail(email);
        if (!agency) throw new Error('Agency not found');

        if (!agency.canAccessExchange) {
            return { rates: [] };
        }

        const rates = await getExchangeRates();
        return { rates };
    } catch (e: any) {
        console.error('Error in getExchangeRatesAction:', e);
        return { rates: [], error: e.message || 'Erro ao carregar cotações.' };
    }
}
