import { getProductBase, getAgencyBase } from './client';
import { Product, Agency, MuralItem, NoticeReadLog, Reservation, ExchangeRate } from './types';
import { FieldSet } from 'airtable';

// Helper to map record to Product
const mapToProduct = (record: any): Product => {
    const fields = record.fields;

    // Duration formatting helper (Airtable returns seconds)
    const formatDuration = (seconds?: number) => {
        if (typeof seconds !== 'number') return undefined;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    return {
        id: record.id,
        destination: fields['Destino'] as string || 'General',
        tourName: fields['Serviço'] as string || 'Unnamed Tour',
        category: fields['Categoria do Serviço'] as string || 'Other',
        subCategory: (fields['Tags'] || fields['Categoria']) ? (Array.isArray(fields['Tags'] || fields['Categoria']) ? (fields['Tags'] || fields['Categoria']).join(', ') : (fields['Tags'] || fields['Categoria']) as string) : '',
        // taxasExtras removed from here to avoid duplication with the robust check below
        // Default/Fallback prices (using Inverno as base for now, or could change logic)
        basePrice: fields['INV26 ADU'] as number || 0,
        priceAdulto: fields['INV26 ADU'] as number || 0,
        priceMenor: fields['INV26 CHD'] as number || 0,
        priceBebe: fields['INV26 INF'] as number || 0,

        // Verão 2026
        priceAdultoVer26: fields['VER26 ADU'] as number || 0,
        priceMenorVer26: fields['VER26 CHD'] as number || 0,
        priceBebeVer26: fields['VER26 INF'] as number || 0,

        // Inverno 2026
        priceAdultoInv26: fields['INV26 ADU'] as number || 0,
        priceMenorInv26: fields['INV26 CHD'] as number || 0,
        priceBebeInv26: fields['INV26 INF'] as number || 0,

        pickup: formatDuration(fields['Pickup']),
        retorno: formatDuration(fields['Retorno']),
        temporada: Array.isArray(fields['Temporada']) ? fields['Temporada'].join(', ') : fields['Temporada'] as string,
        diasElegiveis: fields['Dias elegíveis'] as string[],
        description: fields['Descrição'] as string,
        inclusions: fields['Incluso'] as string,
        exclusions: fields['Não Incluso'] as string,
        requirements: fields['Requisitos'] as string,
        imageUrl: fields['Mídia do Passeio']?.[0]?.url,

        // New fields mapping
        status: (Array.isArray(fields['Status']) ? fields['Status'][0] : (fields['Status'] || fields['STATUS'] || 'Ativo')) as string,
        whatToBring: fields['O que levar'] as string,
        provider: (
            fields['Operador_Nome'] ||
            fields['Operador Nome'] ||
            fields['OPERADOR_NOME'] ||
            fields['Operador (from Operadores)'] ||
            fields['Operador (from Operador)'] ||
            fields['OPERADOR'] ||
            fields['Operador'] ||
            fields['Fornecedor'] ||
            (fields['Operador'] as any)?.name ||
            (Array.isArray(fields['Operador']) && typeof fields['Operador'][0] === 'string' && !fields['Operador'][0].startsWith('rec') ? fields['Operador'][0] : null) ||
            '–'
        ) as string,
        duration: fields['Duração'] as string,   // New Duration field
        // Robust Taxas Extras check (with and without ?)
        taxasExtras: (fields['Taxas Extras?'] || fields['Taxas Extras']) as string,
        valorExtra: fields['Valor Extra'] as string,
        optionals: (fields['Opcionais disponíveis'] || fields['Opcionais']) as string,
        restrictions: fields['Restrições'] as string,
        observations: fields['Observações'] as string,
    };
};

export const getProducts = async (): Promise<Product[]> => {
    const base = getProductBase();
    if (!base) {
        console.error('Airtable product base not initialized.');
        return [];
    }

    try {
        // Using explicit Table ID provided by user: tbl4RRA0YiPk8DMjs
        const records = await base('tbl4RRA0YiPk8DMjs').select().all();

        return records.map(mapToProduct);
    } catch (err) {
        console.error('Error fetching from Product table ID, trying fallback name Passeios:', err);
        try {
            const records = await base('Passeios').select().all();
            return records.map(mapToProduct);
        } catch (innerErr) {
            console.error('Total failure fetching products:', innerErr);
            return [];
        }
    }
};

export const getAgencyByEmail = async (email: string): Promise<Agency | null> => {
    const base = getProductBase();
    if (!base) {
        console.error('Airtable Product base not initialized.');
        return null;
    }

    const records = await base('tbljUc8sptfa7QnAE').select({
        filterByFormula: `{mail} = '${email}'`,
        maxRecords: 1
    }).all();

    if (records.length === 0) return null;

    const record = records[0];
    const fields = record.fields;

    // Robust field mapping: try Portuguese names first, then fall back to English names
    const agencyNameField = fields['Agência'] || fields['Agency'];
    const emailField = fields['Email'] || fields['mail'];
    const commissionField = fields['Comissão Base'] || fields['Comision_base'];
    const userNameField = fields['Usuário'] || fields['User'];
    const skillsField = fields['Destinos'] || fields['Skill'];

    // Handle both string and lookup/array values
    const agencyName = (Array.isArray(agencyNameField) ? agencyNameField[0] : agencyNameField) as string;
    const userName = (Array.isArray(userNameField) ? userNameField[0] : userNameField) as string;

    return {
        id: record.id,
        agencyId: (Array.isArray(agencyNameField) ? agencyNameField[0] : '') as string,
        name: fields['Nome da Agência'] as string || agencyName || userName || 'Agente',
        agentName: userName, // This is the 'User' column value
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
    const base = getProductBase();
    if (!base) {
        throw new Error('Airtable Product base not initialized');
    }

    await base('tbljUc8sptfa7QnAE').create([
        {
            fields: {
                'Agency': agency.name,
                'mail': agency.email,
                'Comision_base': agency.commissionRate
            }
        }
    ]);
};

export async function getMuralItems(): Promise<MuralItem[]> {
    const base = getProductBase();
    if (!base) return [];

    try {
        // Fetch only active notices
        const records = await base('Mural').select({
            filterByFormula: '{Ativo} = 1',
            sort: [
                { field: 'Fixado', direction: 'desc' },
                { field: 'Prioridade', direction: 'desc' }, // Need to handle string sorting if priority isn't numeric
                { field: 'Publicado_em', direction: 'desc' }
            ]
        }).all();

        // Custom priority sorting since it's a select field (Crítica > Alta > Média > Baixa)
        const priorityScore: Record<string, number> = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };

        return records.map((record: any) => {
            const fields = record.fields;
            return {
                id: record.id,
                title: fields['Título'] as string || 'Sem título',
                summary: fields['Resumo'] as string || '',
                content: fields['Notes'] as string || '',
                category: fields['Categoria'] as string || 'Geral',
                priority: (fields['Prioridade'] || 'Média') as MuralItem['priority'],
                impact: fields['Impacto'] as string || '',
                destination: fields['Destino'] as string || '',
                startDate: fields['Validade'] as string || fields['Início'] as string || '',
                affectedScope: fields['Afeta'] as string || '',
                publishedAt: fields['Publicado_em'] as string || new Date().toISOString(),
                isPinned: !!fields['Fixado'],
                requiresConfirmation: !!fields['Requer_Confirmacao'],
                isActive: !!fields['Ativo'],
                attachments: fields['Attachments']?.map((a: any) => ({
                    url: a.url,
                    filename: a.filename
                }))
            };
        }).sort((a: MuralItem, b: MuralItem) => {
            // Re-sort to guarantee priority order if Airtable sort isn't enough
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            const scoreA = priorityScore[a.priority] || 0;
            const scoreB = priorityScore[b.priority] || 0;
            if (scoreA !== scoreB) return scoreB - scoreA;
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });
    } catch (err) {
        console.error('Error fetching from Mural table:', err);
        return [];
    }
}

export async function getNoticeReadLogs(userId: string): Promise<NoticeReadLog[]> {
    const base = getProductBase();
    if (!base) return [];

    try {
        const records = await base('Notice_Read_Log').select({
            filterByFormula: `{User} = '${userId}'`
        }).all();

        return records.map((record: any) => ({
            id: record.id,
            userId: (record.fields['User'] as string[])?.[0] || '',
            noticeId: (record.fields['Notice'] as string[])?.[0] || '',
            confirmedAt: record.fields['Confirmed_At'] as string,
            agencyId: record.fields['Agency_ID'] as string
        }));
    } catch (err) {
        console.error('Error fetching Notice_Read_Log:', err);
        return [];
    }
}

export async function confirmNoticeRead(userId: string, noticeId: string): Promise<void> {
    const base = getProductBase();
    if (!base) throw new Error('Product base not initialized');

    // 1. Uniqueness check
    const existing = await base('Notice_Read_Log').select({
        filterByFormula: `AND({User} = '${userId}', {Notice} = '${noticeId}')`,
        maxRecords: 1
    }).all();

    if (existing.length > 0) {
        console.log('User already confirmed this notice.');
        return;
    }

    // 2. Create record
    await base('Notice_Read_Log').create([
        {
            fields: {
                'User': [userId],
                'Notice': [noticeId]
            }
        }
    ]);
}

export async function getNoticeReaders(noticeId: string, agencyRecordId?: string, isAdmin?: boolean): Promise<{ userName: string, timestamp: string, agencyName?: string }[]> {
    const base = getProductBase();
    if (!base) return [];

    try {
        let filterFormula = `{Notice} = '${noticeId}'`;
        if (!isAdmin && agencyRecordId) {
            filterFormula = `AND({Notice} = '${noticeId}', {Agency_ID} = '${agencyRecordId}')`;
        }

        const records = await base('Notice_Read_Log').select({
            filterByFormula: filterFormula,
            sort: [{ field: 'Confirmed_At', direction: 'desc' }]
        }).all();

        // We need to fetch User details to show Name and Agency (for Admin)
        // Since confirmed reader names are usually in the User link name or lookup
        return records.map((record: any) => {
            const fields = record.fields;
            return {
                userName: (fields['User_Name'] || fields['User_mail'] || 'Usuário') as string,
                timestamp: fields['Confirmed_At'] as string,
                agencyName: isAdmin ? fields['Agency_Name'] as string : undefined
            };
        });
    } catch (err) {
        console.error('Error fetching Notice readers:', err);
        return [];
    }
}

export async function createReservation(reservation: Reservation): Promise<string> {
    const base = getAgencyBase();
    if (!base) throw new Error('Agency base not initialized');

    try {
        const record = await base('Reservas').create({
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
        });
        return record.id;
    } catch (e: any) {
        console.error('Error creating reservation in Airtable:', e.message);
        throw new Error(`Failed to create reservation: ${e.message}`);
    }
}

/**
 * Get exchange rates from the Cambio table
 */
export async function getExchangeRates(): Promise<ExchangeRate[]> {
    const base = getProductBase();
    if (!base) {
        console.error('Product base not available for Exchange Rates');
        return [];
    }

    // Helper to process horizontal records (one record = multiple rates)
    const processRecords = (records: any[]) => {
        const processedRates: ExchangeRate[] = [];

        records.forEach(record => {
            const fields = record.fields;
            const timestamp = (fields['Data do registro'] || fields['Created'] || new Date().toISOString()) as string;
            // Get observations from the record
            const observations = (fields['Observações'] || fields['Notes'] || fields['Obs']) as string | undefined;

            // 1. USD
            if (fields['USD → BRL']) {
                // User requirement: RAW integer value, no conversion/division
                const val = Number(fields['USD → BRL']);

                processedRates.push({
                    id: `${record.id}-USD`,
                    currency: 'USD',
                    value: val,
                    symbol: 'US$',
                    lastUpdated: timestamp,
                    observations
                });
            }

            // 2. CLP
            if (fields['CLP → BRL']) {
                processedRates.push({
                    id: `${record.id}-CLP`,
                    currency: 'CLP',
                    value: Number(fields['CLP → BRL']),
                    symbol: '$',
                    lastUpdated: timestamp,
                    observations
                });
            }

            // 3. ARS
            if (fields['ARS → BRL']) {
                processedRates.push({
                    id: `${record.id}-ARS`,
                    currency: 'ARS',
                    value: Number(fields['ARS → BRL']),
                    symbol: '$',
                    lastUpdated: timestamp,
                    observations
                });
            }
        });

        return processedRates;
    };

    try {
        // Try ID first with 'Data do registro' sort
        const records = await base('tbleUkvNsOBje1yUx').select({
            view: 'Grid view',
            sort: [{ field: 'Data do registro', direction: 'desc' }]
        }).all();

        return processRecords(records);
    } catch (err: any) {
        console.warn(`Failed to fetch from table ID (tbleUkvNsOBje1yUx): ${err.message}. Trying fallback 'Cambio' without sort...`);

        try {
            // Fallback to Name 'Cambio', try unsorted first to be safe
            const records = await base('Cambio').select().all();
            return processRecords(records);
        } catch (innerError: any) {
            console.error(`Failed to fetch from fallback 'Cambio': ${innerError.message}`);
            return [];
        }
    }
}
