'use server'

import { auth, currentUser } from '@clerk/nextjs/server';
import { getProductBase, getAgencyBase } from '@/lib/airtable/client';
import { getProducts } from '@/lib/airtable/service';
import { Agency } from '@/lib/airtable/types';

// Middleware should handle role checks, but we add a safety check here
async function isAdmin() {
    const user = await currentUser();
    const metadata = user?.publicMetadata;
    // Check for admin role in metadata OR specific admin email for bootstrap
    return metadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === 'admin@fidu.com';
}

export async function getAdminProducts() {
    if (!(await isAdmin())) throw new Error('Unauthorized');
    return getProducts(); // Returns raw products with basePrice
}

export async function getAgencies(): Promise<Agency[]> {
    if (!(await isAdmin())) throw new Error('Unauthorized');
    const base = getAgencyBase();
    if (!base) return [];

    const records = await base('Table 1').select({
        view: 'viwmCj8ZefKY7lqP6' // Grid view ID from URL if possible, or fallback to name
    }).all().catch(() => base('Table 1').select().all());

    return records.map((record: any) => ({
        id: record.id,
        name: record.fields['Agency'] as string || record.fields['Name'] as string,
        email: record.fields['mail'] as string,
        commissionRate: record.fields['Comision_base'] as number || 0,
    }));
}

export async function updateAgencyCommission(agencyId: string, newRate: number) {
    if (!(await isAdmin())) throw new Error('Unauthorized');
    const base = getAgencyBase();
    if (!base) throw new Error('Airtable Agency base not initialized');

    await base('Table 1').update([
        {
            id: agencyId,
            fields: {
                'Comision_base': newRate
            }
        }
    ]);

    return { success: true };
}

export async function createNewAgency(name: string, email: string, commissionRate: number) {
    if (!(await isAdmin())) throw new Error('Unauthorized');
    const base = getAgencyBase();
    if (!base) throw new Error('Airtable Agency base not initialized');

    await base('Table 1').create([
        {
            fields: {
                'Agency': name,
                'mail': email,
                'Comision_base': commissionRate
            }
        }
    ]);

    return { success: true };
}

// SIMULATOR ACTION
export interface SimulatedProduct {
    id: string;
    tourName: string;
    category: string;
    basePrice: number;
    commissionPercent: number;
    finalPrice: number;
}

export async function getSimulatorProducts(agencyId: string): Promise<SimulatedProduct[]> {
    // Basic Admin Check (can be refined for "Sales" role later)
    if (!(await isAdmin())) throw new Error('Unauthorized');
    const base = getAgencyBase();
    if (!base) return [];

    // 1. Get Agency Commission
    const agencyRecord = await base('Table 1').find(agencyId);
    if (!agencyRecord) throw new Error('Agency not found');

    // Safety check: ensure rate is a number
    const rate = (agencyRecord.fields['Comision_base'] as number) || 0;

    // 2. Get All Products
    const products = await getProducts(); // This returns base prices

    // 3. Compute
    return products.map(p => {
        const final = p.basePrice + (p.basePrice * rate);
        return {
            id: p.id,
            tourName: p.tourName,
            category: p.category,
            basePrice: p.basePrice,
            commissionPercent: rate * 100,
            finalPrice: Math.round(final * 100) / 100
        };
    });
}
