'use server'

import { currentUser } from '@clerk/nextjs/server';
import { getProducts, getAgencyByEmail } from '@/lib/airtable/service';

export interface AgencyInfo {
    agentName: string;
    agencyName: string;
    commissionRate: number;
}

export interface AgencyProduct {
    id: string;
    destination: string;
    tourName: string;
    category: string;
    // Adulto
    salePriceAdulto: number; // The retail price (Airtable value)
    netoPriceAdulto: number; // What agency pays Fidu (Airtable - Commission)
    // Menor
    salePriceMenor: number;
    netoPriceMenor: number;
    // Bebê
    salePriceBebe: number;
    netoPriceBebe: number;

    pickup?: string;
    retorno?: string;
    temporada?: string;
    diasElegiveis?: string[];
    subCategory?: string;
    taxasExtras?: string;
    description?: string;
    inclusions?: string;
    exclusions?: string;
    requirements?: string;
    imageUrl?: string;
}

export async function getAgencyProducts(): Promise<{ products: AgencyProduct[], agency?: AgencyInfo, error?: string }> {
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

        const agencyInfo: AgencyInfo = {
            agentName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Agente',
            agencyName: agency.name,
            commissionRate: commissionRate
        };

        // Fetch Base Products
        const products = await getProducts();

        if (!products || products.length === 0) {
            return { products: [], agency: agencyInfo };
        }

        // Calculate Prices (Airtable value is SALE price, we calculate NETO)
        const agencyProducts = products.map(product => {
            const calculateNeto = (venda: number) => Math.round(venda * (1 - commissionRate) * 100) / 100;

            return {
                id: product.id,
                destination: product.destination,
                tourName: product.tourName,
                category: product.category,
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

        return { products: agencyProducts, agency: agencyInfo };
    } catch (err: any) {
        console.error('Error in getAgencyProducts:', err);
        return {
            products: [],
            error: `Failed to load products: ${err.message || 'Unknown error'}. Check your connection and credentials.`
        };
    }
}
