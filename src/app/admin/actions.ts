'use server'

import { getProducts } from '@/lib/services/productService';
import { prisma } from '@/lib/db/prisma';

// Admin routes are now publicly accessible - consider adding IP whitelist or password protection
export async function getAdminProducts() {
    const products = await getProducts();
    return products.map(p => {
        const parsePrice = (priceStr: string) => {
            const cleaned = priceStr.replace(/[^0-9,.]/g, '').replace(',', '.');
            return parseFloat(cleaned) || 0;
        };
        return {
            id: p.id,
            tourName: p.servico || '',
            destination: p.destino || '',
            category: p.categoria || '',
            basePrice: parsePrice(p.inv26Adu)
        };
    });
}

export async function getAgencies(): Promise<any[]> {
    const agencies = await prisma.agency.findMany({
        orderBy: { name: 'asc' }
    });

    return agencies.map((record) => ({
        id: record.id,
        name: record.name,
        legalName: record.legalName,
        cnpj: record.cnpj,
        cadastur: record.cadastur,
        address: record.address,
        responsibleName: record.responsibleName,
        commissionRate: record.commissionRate,
    }));
}

export async function updateAgency(agencyId: string, data: any) {
    await prisma.agency.update({
        where: { id: agencyId },
        data: {
            name: data.name,
            legalName: data.legalName,
            cnpj: data.cnpj,
            cadastur: data.cadastur,
            address: data.address,
            responsibleName: data.responsibleName,
            commissionRate: data.commissionRate !== undefined ? Number(data.commissionRate) : undefined
        }
    });

    return { success: true };
}

export async function createNewAgency(data: any) {
    await prisma.agency.create({
        data: {
            name: data.name,
            legalName: data.legalName,
            cnpj: data.cnpj,
            cadastur: data.cadastur,
            address: data.address,
            responsibleName: data.responsibleName,
            commissionRate: data.commissionRate !== undefined ? Number(data.commissionRate) : 0
        }
    });

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
    // 1. Get Agency Commission
    const agencyRecord = await prisma.agency.findUnique({
        where: { id: agencyId }
    });

    if (!agencyRecord) throw new Error('Agency not found');

    const rate = agencyRecord.commissionRate || 0;

    // 2. Get All Products
    const products = await getProducts();

    // 3. Compute
    return products.map(p => {
        const parsePrice = (priceStr: string) => {
            const cleaned = priceStr.replace(/[^0-9,.]/g, '').replace(',', '.');
            return parseFloat(cleaned) || 0;
        };

        const basePrice = parsePrice(p.inv26Adu);
        const final = basePrice + (basePrice * rate);

        return {
            id: p.id,
            tourName: p.servico || '',
            category: p.categoria || '',
            basePrice: basePrice,
            commissionPercent: rate * 100,
            finalPrice: Math.round(final * 100) / 100
        };
    });
}

// Access Control Actions
export async function getUsers() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, agencyId: true, role: true, flagMural: true, flagExchange: true, flagReserva: true }
    });
    return users;
}

export async function updateUserAccess(userId: string, data: { email?: string, name?: string, agencyId?: string, role?: string, flagMural?: boolean, flagExchange?: boolean, flagReserva?: boolean }) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            email: data.email,
            name: data.name,
            agencyId: data.agencyId || null,
            role: data.role as any,
            flagMural: data.flagMural,
            flagExchange: data.flagExchange,
            flagReserva: data.flagReserva,
        }
    });
    return { success: true };
}
