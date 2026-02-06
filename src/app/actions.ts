'use server'

import { currentUser } from '@clerk/nextjs/server';
import { getProducts, getAgencyByEmail } from '@/lib/airtable/service';

export interface AgencyProduct {
    id: string;
    destination: string;
    tourName: string;
    category: string;
    basePrice: number; // Value Neto (Fidu) - Now exposed
    consumerPrice: number; // Calculated Price
    imageUrl?: string;
}

export async function getAgencyProducts(): Promise<{ products: AgencyProduct[], error?: string }> {
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

        // Fetch Agency Commission
        const agency = await getAgencyByEmail(email);
        const commissionRate = agency ? agency.commissionRate : 0;

        // Fetch Base Products
        const products = await getProducts();

        if (!products || products.length === 0) {
            return { products: [] };
        }

        // Calculate Final Price
        const agencyProducts = products.map(product => {
            const finalPrice = product.basePrice + (product.basePrice * commissionRate);

            return {
                id: product.id,
                destination: product.destination,
                tourName: product.tourName,
                category: product.category,
                basePrice: product.basePrice,
                consumerPrice: Math.round(finalPrice * 100) / 100,
                imageUrl: product.imageUrl
            };
        });

        return { products: agencyProducts };
    } catch (err: any) {
        console.error('Error in getAgencyProducts:', err);
        return {
            products: [],
            error: `Failed to load products: ${err.message || 'Unknown error'}. Check your connection and credentials.`
        };
    }
}
