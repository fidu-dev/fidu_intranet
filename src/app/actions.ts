'use server'

import { currentUser } from '@clerk/nextjs/server';
import { getProducts, getAgencyByEmail, getMuralItems, markAsRead, getMuralReaders } from '@/lib/airtable/service';

export interface AgencyInfo {
    agentName: string;
    agencyName: string;
    commissionRate: number;
    canReserve: boolean;
    canAccessMural: boolean;
    isInternal: boolean;
}

import { AgencyProduct, MuralItem } from '@/lib/airtable/types';

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
            isInternal: !!agency.isInternal
        };

        // Fetch Mural items to check for unread
        let hasUnreadMural = false;
        try {
            const muralItems = await getMuralItems(email, agencyInfo.agentName, agency.id);
            hasUnreadMural = muralItems.some(item => !item.isRead);
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
                    imageUrl: product.imageUrl
                };
            });

        return { products: agencyProducts, agency: agencyInfo, hasUnreadMural };
    } catch (err: any) {
        console.error('Error in getAgencyProducts:', err);
        return {
            products: [],
            error: `Failed to load products: ${err.message || 'Unknown error'}. Check your connection and credentials.`
        };
    }
}

export async function fetchMural(): Promise<{ items: MuralItem[], error?: string }> {
    try {
        const user = await currentUser();
        const email = user?.emailAddresses[0]?.emailAddress;
        if (!email) throw new Error('No email found');

        const agency = await getAgencyByEmail(email);
        if (!agency) throw new Error('Agency not found');

        if (!agency.canAccessMural) {
            throw new Error('ACESSO NEGADO: Você não tem permissão para acessar o Mural.');
        }

        const userName = agency.agentName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

        const items = await getMuralItems(email, userName, agency.id);
        return { items };
    } catch (e: any) {
        console.error('Error fetching mural:', e);
        return { items: [], error: `Erro ao carregar o mural: ${e.message || 'Unknown error'}` };
    }
}

export async function markMuralAsReadAction(muralId: string): Promise<{ success: boolean, error?: string }> {
    console.log('🎯 markMuralAsReadAction called with muralId:', muralId);

    try {
        const user = await currentUser();
        if (!user) throw new Error('Not authenticated');

        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) throw new Error('No email found');

        console.log('👤 User email:', email);

        const agency = await getAgencyByEmail(email);
        if (!agency) throw new Error('Agency not found');

        console.log('🏢 Agency found:', { id: agency.id, name: agency.name, agentName: agency.agentName });

        const userName = agency.agentName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Agente';

        console.log('📝 Calling markAsRead with:', { muralId, email, userName, agencyId: agency.id });

        await markAsRead(muralId, email, userName, agency.id);

        console.log('✅ markAsRead completed successfully');
        return { success: true };
    } catch (e: any) {
        console.error('❌ Error marking mural as read:', e);
        return { success: false, error: e.message || 'Erro ao confirmar leitura.' };
    }
}

export async function fetchMuralReaders(muralId: string): Promise<{ readers: { userName: string, timestamp: string }[], error?: string }> {
    try {
        const user = await currentUser();
        if (!user) throw new Error('Not authenticated');

        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) throw new Error('No email found');

        const agency = await getAgencyByEmail(email);
        if (!agency) throw new Error('Agency not found');

        const readers = await getMuralReaders(muralId, agency.id, agency.name);
        return { readers };
    } catch (e) {
        console.error('Error fetching mural readers:', e);
        return { readers: [], error: 'Erro ao carregar lista de leitura.' };
    }
}
