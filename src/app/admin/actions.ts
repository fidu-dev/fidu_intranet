'use server'

import { getProducts } from '@/lib/services/productService';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

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
            tourName: p.title || '',
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
        responsiblePhone: record.responsiblePhone,
        instagram: record.instagram,
        bankDetails: record.bankDetails,
        commissionRate: record.commissionRate,
        status: record.status,
        requestedUsers: record.requestedUsers,
    }));
}

export async function updateAgency(agencyId: string, data: any) {
    try {
        const existingAgency = await prisma.agency.findUnique({
            where: { id: agencyId }
        });

        if (!existingAgency) {
            throw new Error('Agência não encontrada');
        }

        const updatedAgency = await prisma.agency.update({
            where: { id: agencyId },
            data: {
                name: data.name,
                legalName: data.legalName,
                cnpj: data.cnpj,
                cadastur: data.cadastur,
                address: data.address,
                responsibleName: data.responsibleName,
                responsiblePhone: data.responsiblePhone,
                instagram: data.instagram,
                bankDetails: data.bankDetails,
                commissionRate: data.commissionRate !== undefined ? Number(data.commissionRate) : undefined,
                status: data.status,
                requestedUsers: data.requestedUsers
            }
        });

        // Auto-create initial users upon agency approval
        if (data.status === 'APPROVED' && existingAgency.status !== 'APPROVED') {
            const reqUsers = updatedAgency.requestedUsers as any;
            if (Array.isArray(reqUsers) && reqUsers.length > 0) {
                for (const reqUser of reqUsers) {
                    if (!reqUser.email || !reqUser.name) continue;

                    // Avoid duplicating existing users
                    const existingUser = await prisma.user.findUnique({
                        where: { email: String(reqUser.email).trim().toLowerCase() }
                    });

                    if (!existingUser) {
                        await prisma.user.create({
                            data: {
                                email: String(reqUser.email).trim().toLowerCase(),
                                name: String(reqUser.name),
                                agencyId: updatedAgency.id,
                                role: 'AGENCIA_PARCEIRA',
                                status: 'ACTIVE'
                            }
                        });
                    }
                }
            }
        }

        return { success: true };
    } catch (e: any) {
        console.error('Update Agency Action Error:', e);
        throw new Error(`Erro no servidor ao atualizar: ${e.message}`);
    }
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
            responsiblePhone: data.responsiblePhone,
            instagram: data.instagram,
            bankDetails: data.bankDetails,
            commissionRate: data.commissionRate !== undefined ? Number(data.commissionRate) : 0,
            status: data.status || 'PENDING',
            requestedUsers: data.requestedUsers || []
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
            tourName: p.title || '',
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
        select: { id: true, email: true, name: true, agencyId: true, role: true, status: true, flagMural: true, flagExchange: true, flagReserva: true, allowedDestinations: true }
    });
    return users;
}

export async function updateUserAccess(userId: string, data: { email?: string, name?: string, agencyId?: string, role?: string, status?: string, flagMural?: boolean, flagExchange?: boolean, flagReserva?: boolean, allowedDestinations?: string[] }) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            email: data.email,
            name: data.name,
            agencyId: data.agencyId || null,
            role: data.role as any,
            status: data.status as any,
            flagMural: data.flagMural,
            flagExchange: data.flagExchange,
            flagReserva: data.flagReserva,
            allowedDestinations: data.allowedDestinations,
        }
    });
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function createNewUser(data: { email: string, name: string, agencyId?: string, role: string, status?: string, flagMural: boolean, flagExchange: boolean, flagReserva: boolean, allowedDestinations?: string[] }) {
    const user = await prisma.user.create({
        data: {
            email: data.email,
            name: data.name,
            agencyId: data.agencyId || null,
            role: data.role as any,
            status: data.status as any ?? 'ACTIVE',
            flagMural: data.flagMural,
            flagExchange: data.flagExchange,
            flagReserva: data.flagReserva,
            allowedDestinations: data.allowedDestinations || [],
        }
    });
    return { success: true, user };
}

// ── SelectOption Actions ──

export async function getSelectOptionsMulti(groups: string[]): Promise<Record<string, string[]>> {
    const options = await prisma.selectOption.findMany({
        where: { group: { in: groups }, active: true },
        orderBy: { sortOrder: 'asc' },
    });
    const result: Record<string, string[]> = {};
    for (const g of groups) result[g] = [];
    for (const o of options) result[o.group].push(o.value);
    return result;
}

export async function createSelectOption(group: string, value: string): Promise<{ success: boolean; error?: string }> {
    try {
        const maxOrder = await prisma.selectOption.aggregate({ where: { group }, _max: { sortOrder: true } });
        await prisma.selectOption.create({
            data: { group, value, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
        });
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: 'Valor já existe neste grupo.' };
        return { success: false, error: e.message };
    }
}

export async function updateSelectOption(id: string, data: { value?: string; sortOrder?: number; active?: boolean }): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.selectOption.update({ where: { id }, data });
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: 'Valor já existe neste grupo.' };
        return { success: false, error: e.message };
    }
}

export async function deleteSelectOption(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.selectOption.delete({ where: { id } });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getSelectOptionsFull(group: string) {
    return prisma.selectOption.findMany({
        where: { group },
        orderBy: { sortOrder: 'asc' },
    });
}

// ── Season Actions ──

export interface SeasonItem {
    id: string;
    code: string;
    label: string;
    sortOrder: number;
    active: boolean;
    color: string | null;
}

export async function getSeasons(): Promise<SeasonItem[]> {
    return prisma.season.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
    });
}

export async function getAllSeasons(): Promise<SeasonItem[]> {
    return prisma.season.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function createSeason(code: string, label: string, color?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const maxOrder = await prisma.season.aggregate({ _max: { sortOrder: true } });
        await prisma.season.create({
            data: { code, label, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1, ...(color ? { color } : {}) },
        });
        return { success: true };
    } catch (e: any) {
        if (e.code === 'P2002') return { success: false, error: 'Código de temporada já existe.' };
        return { success: false, error: e.message };
    }
}

export async function updateSeason(id: string, data: { code?: string; label?: string; active?: boolean; sortOrder?: number; color?: string }): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.season.update({ where: { id }, data });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteSeason(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.season.delete({ where: { id } });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// ── Passeios Actions ──

export interface PasseioListItem {
    id: string;
    title: string;
    destino: string;
    categoria: string;
    statusOperativo: string;
    statusIntranet: string;
    price: number | null;
    updatedAt: string;
    featuredImage: string;
}

export async function getPasseios(): Promise<PasseioListItem[]> {
    const tours = await prisma.tour.findMany({
        where: { ativo: true },
        orderBy: { title: 'asc' },
        select: {
            id: true,
            title: true,
            destino: true,
            categoria: true,
            statusOperativo: true,
            statusIntranet: true,
            price: true,
            updatedAt: true,
            featuredImage: true,
        }
    });

    return tours.map(t => ({
        id: t.id,
        title: t.title || '',
        destino: t.destino || '',
        categoria: t.categoria || '',
        statusOperativo: t.statusOperativo || '',
        statusIntranet: t.statusIntranet || 'Visível',
        price: t.price,
        updatedAt: t.updatedAt.toISOString(),
        featuredImage: t.featuredImage || '',
    }));
}

export async function getPasseiosDestinos(): Promise<string[]> {
    const tours = await prisma.tour.findMany({
        where: { ativo: true, destino: { not: null } },
        select: { destino: true },
        distinct: ['destino'],
        orderBy: { destino: 'asc' },
    });
    return tours.map(t => t.destino!).filter(Boolean);
}

export async function updatePasseioStatus(id: string, statusOperativo: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.tour.update({
            where: { id },
            data: { statusOperativo },
        });
        revalidatePath('/admin/settings/passeios');
        return { success: true };
    } catch (e: any) {
        console.error('Update Passeio Status Error:', e);
        return { success: false, error: e.message };
    }
}

export async function deactivatePasseio(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.tour.update({
            where: { id },
            data: { ativo: false },
        });
        revalidatePath('/admin/settings/passeios');
        return { success: true };
    } catch (e: any) {
        console.error('Deactivate Passeio Error:', e);
        return { success: false, error: e.message };
    }
}

export async function getPasseioById(id: string) {
    const tour = await prisma.tour.findUnique({
        where: { id },
        include: { prices: { include: { season: true } } },
    });
    if (!tour) return null;

    // Montar mapa de preços dinâmicos: { "VER26": { adu, chd, inf }, ... }
    const prices: Record<string, { adu: string; chd: string; inf: string }> = {};
    for (const tp of tour.prices) {
        prices[tp.season.code] = { adu: tp.adu || '', chd: tp.chd || '', inf: tp.inf || '' };
    }

    return {
        id: tour.id,
        title: tour.title || '',
        destino: tour.destino || '',
        categoria: tour.categoria || '',
        operador: tour.operador || '',
        temporada: tour.temporada || '',
        pickup: tour.pickup || '',
        retorno: tour.retorno || '',
        duracao: tour.duracao || '',
        description: tour.description || '',
        observacoes: tour.observacoes || '',
        oQueLevar: tour.oQueLevar || '',
        restricoes: tour.restricoes || '',
        opcionais: tour.opcionais || '',
        variantes: tour.variantes || '',
        moeda: tour.moeda || 'BRL',
        tags: tour.tags || '',
        statusOperativo: tour.statusOperativo || 'Ativo',
        statusIntranet: tour.statusIntranet || 'Visível',
        // Campos legados mantidos para compat
        ver26Adu: tour.ver26Adu || '',
        ver26Chd: tour.ver26Chd || '',
        ver26Inf: tour.ver26Inf || '',
        inv26Adu: tour.inv26Adu || '',
        inv26Chd: tour.inv26Chd || '',
        inv26Inf: tour.inv26Inf || '',
        // Preços dinâmicos
        prices,
        diasElegiveis: tour.diasElegiveis || '',
        valorNeto: tour.valorNeto || '',
        valorExtra: tour.valorExtra || '',
        taxasExtras: tour.taxasExtras || '',
        precoConvertido: tour.precoConvertido || '',
        productId: tour.productId || '',
        status: tour.status || 'draft',
        handle: tour.handle || '',
        vendor: tour.vendor || '',
        productType: tour.productType || '',
        featuredImage: tour.featuredImage || '',
        price: tour.price != null ? String(tour.price) : '',
        compareAtPrice: tour.compareAtPrice != null ? String(tour.compareAtPrice) : '',
        inventoryQuantity: tour.inventoryQuantity != null ? String(tour.inventoryQuantity) : '',
        inventoryPolicy: tour.inventoryPolicy || 'deny',
        requiresShipping: tour.requiresShipping ?? false,
        taxable: tour.taxable ?? false,
        options: tour.options ? JSON.stringify(tour.options, null, 2) : '',
        imageAltText: tour.imageAltText || '',
        adminGraphqlApiId: tour.adminGraphqlApiId || '',
        inventoryItemId: tour.inventoryItemId || '',
        publishedAt: tour.publishedAt ? tour.publishedAt.toISOString().slice(0, 16) : '',
        variantsCount: tour.variantsCount != null ? String(tour.variantsCount) : '',
        imagesCount: tour.imagesCount != null ? String(tour.imagesCount) : '',
    };
}

function buildTourData(data: any) {
    return {
        title: data.title || null,
        destino: data.destino || null,
        categoria: data.categoria || null,
        operador: data.operador || null,
        temporada: data.temporada || null,
        pickup: data.pickup || null,
        retorno: data.retorno || null,
        duracao: data.duracao || null,
        description: data.description || null,
        observacoes: data.observacoes || null,
        oQueLevar: data.oQueLevar || null,
        restricoes: data.restricoes || null,
        opcionais: data.opcionais || null,
        variantes: data.variantes || null,
        moeda: data.moeda || 'BRL',
        tags: data.tags || null,
        statusOperativo: data.statusOperativo || null,
        statusIntranet: data.statusIntranet || 'Visível',
        ver26Adu: data.ver26Adu || null,
        ver26Chd: data.ver26Chd || null,
        ver26Inf: data.ver26Inf || null,
        inv26Adu: data.inv26Adu || null,
        inv26Chd: data.inv26Chd || null,
        inv26Inf: data.inv26Inf || null,
        diasElegiveis: data.diasElegiveis || null,
        valorNeto: data.valorNeto || null,
        valorExtra: data.valorExtra || null,
        taxasExtras: data.taxasExtras || null,
        precoConvertido: data.precoConvertido || null,
        productId: data.productId || null,
        status: data.status || 'draft',
        handle: data.handle || null,
        vendor: data.vendor || null,
        productType: data.productType || null,
        featuredImage: data.featuredImage || null,
        price: data.price ? parseFloat(data.price) : null,
        compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
        inventoryQuantity: data.inventoryQuantity ? parseInt(data.inventoryQuantity, 10) : 0,
        inventoryPolicy: data.inventoryPolicy || 'deny',
        requiresShipping: data.requiresShipping ?? false,
        taxable: data.taxable ?? false,
        options: data.options ? (() => { try { return JSON.parse(data.options); } catch { return null; } })() : null,
        imageAltText: data.imageAltText || null,
        adminGraphqlApiId: data.adminGraphqlApiId || null,
        inventoryItemId: data.inventoryItemId || null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        variantsCount: data.variantsCount ? parseInt(data.variantsCount, 10) : 0,
        imagesCount: data.imagesCount ? parseInt(data.imagesCount, 10) : 0,
    };
}

async function saveTourPrices(tourId: string, prices: Record<string, { adu: string; chd: string; inf: string }>) {
    if (!prices || typeof prices !== 'object') return;
    const seasons = await prisma.season.findMany();
    const seasonMap = new Map(seasons.map(s => [s.code, s.id]));

    for (const [code, vals] of Object.entries(prices)) {
        const seasonId = seasonMap.get(code);
        if (!seasonId) continue;
        await prisma.tourPrice.upsert({
            where: { tourId_seasonId: { tourId, seasonId } },
            update: { adu: vals.adu || null, chd: vals.chd || null, inf: vals.inf || null },
            create: { tourId, seasonId, adu: vals.adu || null, chd: vals.chd || null, inf: vals.inf || null },
        });
    }
}

export async function createPasseio(data: any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const tourData = buildTourData(data);
        const tour = await prisma.tour.create({
            data: {
                ...tourData,
                airtableRecordId: `manual_${Date.now()}`,
                ativo: true,
            },
        });
        // Salvar preços dinâmicos
        if (data.prices) {
            await saveTourPrices(tour.id, data.prices);
        }
        revalidatePath('/admin/settings/passeios');
        return { success: true, id: tour.id };
    } catch (e: any) {
        console.error('Create Passeio Error:', e);
        return { success: false, error: e.message };
    }
}

export async function updatePasseio(id: string, data: any): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.tour.update({
            where: { id },
            data: buildTourData(data),
        });
        // Salvar preços dinâmicos
        if (data.prices) {
            await saveTourPrices(id, data.prices);
        }
        revalidatePath('/admin/settings/passeios');
        return { success: true };
    } catch (e: any) {
        console.error('Update Passeio Error:', e);
        return { success: false, error: e.message };
    }
}

export async function getTourImages(tourId: string) {
    const images = await prisma.tourImage.findMany({
        where: { tourId },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, url: true, altText: true, sortOrder: true },
    });
    return images;
}
