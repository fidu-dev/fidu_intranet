import { getProductBase, getAccessBase } from './client';
import { Product, Agency, MuralItem, NoticeReadLog, Reservation, ExchangeRate } from './types';
import { AIRTABLE_TABLES } from './config';

// Helper to map record to Product
const mapToProduct = (record: any): Product => {
    const fields = record.fields;

    return {
        id: record.id,
        destination: fields['Destino'] as string || 'General',
        tourName: fields['Serviço'] as string || 'Unnamed Tour',
        category: fields['Categoria do Serviço'] as string || 'Other',
        basePrice: fields['INV26 ADU'] as number || 0,

        // Prices
        priceAdulto: fields['INV26 ADU'] as number || 0,
        priceMenor: fields['INV26 MEN'] as number || 0,
        priceBebe: fields['INV26 BEBE'] as number || 0,

        // Seasonal Prices - Verão 2026
        priceAdultoVer26: fields['VER26 ADU'] as number || 0,
        priceMenorVer26: fields['VER26 MEN'] as number || 0,
        priceBebeVer26: fields['VER26 BEBE'] as number || 0,

        // Seasonal Prices - Inverno 2026
        priceAdultoInv26: fields['INV26 ADU'] as number || 0,
        priceMenorInv26: fields['INV26 MEN'] as number || 0,
        priceBebeInv26: fields['INV26 BEBE'] as number || 0,

        pickup: fields['Pickup'] as string,
        retorno: fields['Retorno'] as string,
        temporada: fields['Temporada'] as string,
        diasElegiveis: fields['Dias Elegíveis'] as string[],
        subCategory: (fields['Tags'] || fields['Categoria']) ? (Array.isArray(fields['Tags'] || fields['Categoria']) ? (fields['Tags'] || fields['Categoria']).join(', ') : (fields['Tags'] || fields['Categoria']) as string) : '',
        taxasExtras: (fields['Taxas Extras?'] || fields['Taxas Extras']) as string,
        description: fields['Descrição'] as string,
        inclusions: fields['Incluso'] as string,
        exclusions: fields['Não Incluso'] as string,
        requirements: fields['Requisitos'] as string,
        imageUrl: Array.isArray(fields['Fotos']) ? (fields['Fotos'] as any[])[0]?.url : undefined,

        status: fields['Status'] as string,
        whatToBring: fields['O que levar'] as string,
        provider: fields['Fornecedor'] as string,
        duration: fields['Duração'] as string,
        valorExtra: fields['Valor Extra'] as string,
        optionals: (fields['Opcionais disponíveis'] || fields['Opcionais']) as string,
        restrictions: fields['Restrições'] as string,
        observations: fields['Observações'] as string,
    };
};

export const getProducts = async (): Promise<Product[]> => {
    const base = getProductBase();
    if (!base) return [];
    try {
        const records = await base(AIRTABLE_TABLES.PRODUCTS).select().all();
        return records.map(mapToProduct);
    } catch (err) {
        console.error('Error fetching Products:', err);
        return [];
    }
};

export const getAgencyByEmail = async (email: string): Promise<Agency | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    const escapedEmail = normalizedEmail.replace(/'/g, "\\'");
    const base = getAccessBase() || getProductBase();

    if (!base) return null;

    const formula = `OR(LOWER(TRIM({mail})) = '${escapedEmail}', LOWER(TRIM({Email})) = '${escapedEmail}')`;
    let records: any[] = [];

    try {
        records = await base(AIRTABLE_TABLES.ACCESS).select({
            filterByFormula: formula,
            maxRecords: 1,
        }).all();
    } catch (error) {
        console.warn('Airtable formula lookup failed, trying scanning fallback.');
    }

    if (records.length === 0) {
        try {
            const fallbackRecords = await base(AIRTABLE_TABLES.ACCESS).select({ maxRecords: 200 }).all();
            records = fallbackRecords.filter((record: any) => {
                const candidates = [record.fields?.mail, record.fields?.Email, record.fields?.['E-mail']].flatMap(v => Array.isArray(v) ? v : [v]);
                return candidates.some(c => typeof c === 'string' && c.trim().toLowerCase() === normalizedEmail);
            }).slice(0, 1);
        } catch (e) {
            console.error('Fallback scan failed:', e);
        }
    }

    if (records.length === 0) return null;

    const record = records[0];
    const fields = record.fields;

    const agencyNameField = fields['Agência'] || fields['Agency'];
    const emailField = fields['Email'] || fields['mail'] || fields['E-mail'];
    const commissionField = fields['Comissão Base'] || fields['Comision_base'];
    const userNameField = fields['Usuário'] || fields['User'];
    const skillsField = fields['Destinos'] || fields['Skill'];

    const agencyName = (Array.isArray(agencyNameField) ? agencyNameField[0] : agencyNameField) as string;
    const userName = (Array.isArray(userNameField) ? userNameField[0] : userNameField) as string;

    return {
        id: record.id,
        agencyId: (Array.isArray(agencyNameField) ? agencyNameField[0] : '') as string,
        name: fields['Nome da Agência'] as string || agencyName || userName || 'Agente',
        agentName: userName,
        email: emailField as string,
        commissionRate: commissionField as number || 0,
        skills: skillsField as string[] || [],
        canReserve: fields['Reserva'] as boolean || false,
        canAccessMural: fields['Mural'] as boolean || false,
        isInternal: fields['Interno'] as boolean || false,
        canAccessExchange: fields['Exchange'] as boolean || false,
        isAdmin: fields['Admin'] as boolean || false,
    };
};

export const createAgency = async (agency: Omit<Agency, 'id'>) => {
    const base = getAccessBase() || getProductBase();
    if (!base) throw new Error('Airtable base not initialized');

    await base(AIRTABLE_TABLES.ACCESS).create([
        {
            fields: {
                'Agency': agency.name,
                'mail': agency.email,
                'Email': agency.email,
                'Comision_base': agency.commissionRate
            }
        }
    ]);
};

export async function getMuralItems(): Promise<MuralItem[]> {
    const base = getProductBase();
    if (!base) return [];

    try {
        const records = await base(AIRTABLE_TABLES.MURAL).select({
            filterByFormula: '{Ativo} = 1',
            sort: [{ field: 'Fixado', direction: 'desc' }, { field: 'Prioridade', direction: 'desc' }, { field: 'Publicado_em', direction: 'desc' }]
        }).all();

        return records.map((record: any) => ({
            id: record.id,
            title: record.fields['Título'] as string,
            summary: record.fields['Resumo'] as string,
            content: record.fields['Notes'] as string || record.fields['Conteúdo'] as string,
            category: record.fields['Categoria'] as string,
            priority: record.fields['Prioridade'] as MuralItem['priority'],
            publishedAt: record.fields['Publicado_em'] as string,
            isPinned: !!record.fields['Fixado'],
            requiresConfirmation: !!record.fields['Requer_Confirmacao'],
            isActive: !!record.fields['Ativo'],
            attachments: Array.isArray(record.fields['Attachments'])
                ? (record.fields['Attachments'] as any[]).map((a: any) => ({ filename: a.filename, url: a.url }))
                : []
        }));
    } catch (err) {
        console.error('Error fetching Mural:', err);
        return [];
    }
}

export async function confirmNoticeRead(agencyRecordId: string, muralId: string): Promise<void> {
    const base = getProductBase();
    if (!base) throw new Error('Airtable base not initialized');

    try {
        await base(AIRTABLE_TABLES.NOTICE_READ_LOG).create([{
            fields: {
                'Agencia': [agencyRecordId],
                'Comunicado': [muralId],
                'Data_leitura': new Date().toISOString()
            }
        }]);
    } catch (e: any) {
        console.error('[confirmNoticeRead] Failed:', e.message);
        throw e;
    }
}

export async function getNoticeReadLogs(agencyRecordId: string): Promise<NoticeReadLog[]> {
    const base = getProductBase();
    if (!base) return [];

    try {
        const records = await base(AIRTABLE_TABLES.NOTICE_READ_LOG).select({
            filterByFormula: `SEARCH('${agencyRecordId}', ARRAYJOIN({Agencia}))`
        }).all();

        return records.map((record: any) => ({
            id: record.id,
            userId: (record.fields['Agencia'] as string[])?.[0] || '',
            agencyId: (record.fields['Agencia'] as string[])?.[0] || '',
            noticeId: (record.fields['Comunicado'] as string[])?.[0] || '',
            confirmedAt: record.fields['Data_leitura'] as string
        }));
    } catch (err) {
        console.error('Error fetching read logs:', err);
        return [];
    }
}

export async function getNoticeReaders(noticeId: string, agencyRecordId?: string, isAdmin?: boolean): Promise<{ userName: string, timestamp: string, agencyName?: string }[]> {
    const base = getProductBase();
    if (!base) return [];

    try {
        const records = await base(AIRTABLE_TABLES.NOTICE_READ_LOG).select({
            filterByFormula: `SEARCH('${noticeId}', ARRAYJOIN({Comunicado}))`
        }).all();

        const allReaders = records.map((record: any) => {
            const fields = record.fields;
            const userNameRaw = fields['Usuário (from Agencia)'] || fields['Agent Name (from Agencia)'] || fields['User (from Agencia)'];
            const agencyNameRaw = fields['Nome da Agência (from Agencia)'] || fields['Agency Name (from Agencia)'];
            const recAgencyId = (fields['Agencia'] as string[])?.[0];

            return {
                userName: (Array.isArray(userNameRaw) ? userNameRaw[0] : userNameRaw) as string || 'Usuário',
                timestamp: (fields['Data_leitura'] || record.createdTime) as string,
                agencyName: (Array.isArray(agencyNameRaw) ? agencyNameRaw[0] : agencyNameRaw) as string || 'Agência',
                _agencyId: recAgencyId
            };
        });

        if (isAdmin) {
            return allReaders.map(({ _agencyId, ...rest }: any) => rest);
        }

        return allReaders
            .filter((reader: any) => reader._agencyId === agencyRecordId)
            .map(({ _agencyId, ...rest }: any) => rest);
    } catch (err) {
        console.error('Error fetching notice readers:', err);
        return [];
    }
}

export async function createReservation(reservation: Reservation): Promise<string> {
    const base = getProductBase();
    if (!base) throw new Error('Airtable base not initialized');

    try {
        const records = await base(AIRTABLE_TABLES.RESERVATIONS).create([{
            fields: {
                'Passeio': reservation.productName,
                'Destino': reservation.destination,
                'Agente': reservation.agentName,
                'Email': reservation.agentEmail,
                'Data': reservation.date,
                'Adultos': reservation.adults,
                'Crianças': reservation.children,
                'Bebês': reservation.infants,
                'Nomes Pax': reservation.paxNames,
                'Valor Total': reservation.totalAmount,
                'Comissão': reservation.commissionAmount,
                'Status': reservation.status
            }
        }]);
        return records[0].id;
    } catch (e: any) {
        console.error('Error creating reservation:', e.message);
        throw e;
    }
}

export async function getExchangeRates(): Promise<ExchangeRate[]> {
    const base = getProductBase();
    if (!base) return [];

    try {
        const records = await base(AIRTABLE_TABLES.EXCHANGE).select({
            view: 'Grid view',
            sort: [{ field: 'Data do registro', direction: 'desc' }]
        }).all();

        const rates: ExchangeRate[] = [];
        records.forEach((record: any) => {
            const f = record.fields;
            const ts = f['Data do registro'] as string;
            const obs = f['Observações'] as string;

            if (f['USD → BRL']) rates.push({ id: `${record.id}-USD`, currency: 'USD', value: Number(f['USD → BRL']), symbol: 'U$D', lastUpdated: ts, observations: obs });
            if (f['ARS → BRL']) rates.push({ id: `${record.id}-ARS`, currency: 'ARS', value: Number(f['ARS → BRL']), symbol: '$', lastUpdated: ts, observations: obs });
        });
        return rates;
    } catch (err) {
        console.error('Error fetching exchange rates:', err);
        return [];
    }
}
