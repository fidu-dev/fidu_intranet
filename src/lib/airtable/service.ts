import { getProductBase, getAgencyBase } from './client';
import { Product, Agency, MuralItem, MuralReadLog } from './types';
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
        subCategory: Array.isArray(fields['Categoria']) ? fields['Categoria'].join(', ') : fields['Categoria'] as string,
        taxasExtras: fields['Taxas Extras?'] as string,
        basePrice: fields['INV26 ADU'] as number || 0,
        priceAdulto: fields['INV26 ADU'] as number || 0,
        priceMenor: fields['INV26 CHD'] as number || 0,
        priceBebe: fields['INV26 INF'] as number || 0,
        pickup: formatDuration(fields['Pickup']),
        retorno: formatDuration(fields['Retorno']),
        temporada: Array.isArray(fields['Temporada']) ? fields['Temporada'].join(', ') : fields['Temporada'] as string,
        diasElegiveis: fields['Dias elegíveis'] as string[],
        description: fields['Descrição'] as string,
        inclusions: fields['Incluso'] as string,
        exclusions: fields['Não Incluso'] as string,
        requirements: fields['Requisitos'] as string,
        imageUrl: fields['Mídia do Passeio']?.[0]?.url,
    };
};

export const getProducts = async (): Promise<Product[]> => {
    const base = getProductBase();
    if (!base) {
        console.error('Airtable product base not initialized.');
        return [];
    }

    try {
        // Using 'Passeios' table which contains the detailed tarifário
        const records = await base('Passeios').select().all();
        return records.map(mapToProduct);
    } catch (err) {
        console.error('Error fetching from Passeios, trying fallback Products:', err);
        try {
            const records = await base('Products').select().all();
            return records.map(mapToProduct);
        } catch (innerErr) {
            console.error('Total failure fetching products:', innerErr);
            return [];
        }
    }
};

export const getAgencyByEmail = async (email: string): Promise<Agency | null> => {
    const base = getAgencyBase();
    if (!base) {
        console.error('Airtable Agency base not initialized. Check AIRTABLE_AGENCY_BASE_ID.');
        return null;
    }

    const records = await base('tblkVI2PX3jPgYKXF').select({
        filterByFormula: `{mail} = '${email}'`,
        maxRecords: 1
    }).all();

    if (records.length === 0) return null;

    const record = records[0];
    return {
        id: record.id,
        name: record.fields['Agency'] as string,
        agentName: record.fields['Name'] as string,
        email: record.fields['mail'] as string,
        commissionRate: record.fields['Comision_base'] as number || 0,
        skills: record.fields['Skill'] as string[] || [],
        canReserve: record.fields['Reserva'] as boolean || false,
        isInternal: record.fields['Interno'] as boolean || false,
    };
};

export const createAgency = async (agency: Omit<Agency, 'id'>) => {
    const base = getAgencyBase();
    if (!base) {
        throw new Error('Airtable Agency base not initialized');
    }

    await base('tblkVI2PX3jPgYKXF').create([
        {
            fields: {
                'Agency': agency.name,
                'mail': agency.email,
                'Comision_base': agency.commissionRate
            }
        }
    ]);
};

export async function getMuralItems(userEmail?: string, userName?: string, agencyId?: string): Promise<MuralItem[]> {
    const base = getProductBase();
    if (!base) return [];

    let records;
    try {
        // Try '◉ No ar!' first as requested by user previously
        records = await base('◉ No ar!').select({
            sort: [{ field: 'Data', direction: 'desc' }]
        }).all();
    } catch (e) {
        console.warn("'◉ No ar!' table not found or error, trying 'Mural' table...", e);
        try {
            // Fallback to 'Mural' table which is visible in the screenshot
            records = await base('Mural').select({
                sort: [{ field: 'Data', direction: 'desc' }]
            }).all();
        } catch (e2: any) {
            // Try Mural without specific sort if 'Data' field is also missing
            try {
                records = await base('Mural').select().all();
            } catch (e3: any) {
                throw new Error(`Tabela de Mural não encontrada. Verifique se existe a aba 'Mural' ou '◉ No ar!' no Airtable. Erro: ${e2.message}`);
            }
        }
    }

    return records.map((record: any) => {
        const fields = record.fields;

        // Use 'Select' field for IsNew if 'IsNew' is missing, matching screenshot
        const isNew = fields['Select'] === 'Novo!' || fields['IsNew'] === true;

        // Flexible field mapping based on common names and screenshot
        const title = fields['Título'] || fields['Aviso'] || fields['Title'] || 'Sem título';
        const details = fields['Notes'] || fields['Detalhes'] || fields['Details'] || '';
        const date = fields['Data'] || fields['Date'] || new Date().toISOString();
        const category = fields['Categoria'] || fields['Category'] || 'Geral';

        // Check if read by current user (check both email/name and linked record ID)
        const lidoField = fields['Lido'] as any[] || [];
        const isRead = lidoField.some(reader => {
            // Check by ID (Linked Record)
            if (typeof reader === 'string') {
                return reader === agencyId || reader === userName || reader === userEmail;
            }
            // Check by object (Collaborator)
            if (typeof reader === 'object' && reader.email) {
                return reader.email === userEmail;
            }
            return false;
        });

        return {
            id: record.id,
            date: date as string,
            category: category as string,
            title: title as string,
            details: details as string,
            isNew: !!isNew,
            isRead: !!isRead
        };
    });
}

export async function markAsRead(muralId: string, userEmail: string, userName: string, agencyId: string): Promise<void> {
    const base = getProductBase();
    if (!base) return;

    // 1. Try to record in MuralReadLog (detailed log) - Optional/Fallback
    try {
        await base('MuralReadLog').create([
            {
                fields: {
                    'Mural': [muralId],
                    'UserEmail': userEmail,
                    'UserName': userName,
                    'AgencyId': agencyId, // Use the provided agencyId (Access record ID)
                    'Timestamp': new Date().toISOString()
                }
            }
        ]);
    } catch (e) {
        // console.warn('MuralReadLog table may be missing or inaccessible:', e);
    }

    // 2. Update the "Lido" field in '◉ No ar!' or 'Mural' table
    // IMPORTANT: Treat this as a Linked Record field to the 'Access' table (agencyId)
    const tablesToTry = ['◉ No ar!', 'Mural'];

    for (const tableName of tablesToTry) {
        try {
            const record = await base(tableName).find(muralId);
            if (!record) continue;

            const fields = record.fields;
            // currentLido will be an array of record IDs if it's a linked record
            const currentLido = fields['Lido'] as string[] || [];

            // Add the current agencyId (the ID of the record in the 'Access' table)
            if (!currentLido.includes(agencyId)) {
                const newValue = [...currentLido, agencyId];

                await base(tableName).update(muralId, {
                    'Lido': newValue
                });
                console.log(`Successfully updated Lido field (linked record) in ${tableName}`);
            }

            return;
        } catch (e) {
            continue;
        }
    }
}

export async function getMuralReaders(muralId: string, agencyId?: string, corporationName?: string): Promise<{ userName: string, timestamp: string }[]> {
    const base = getProductBase();
    const agencyBase = getAgencyBase();
    if (!base || !agencyBase) return [];

    try {
        // 1. Fetch the Mural item to get its 'Lido' linked records
        let muralRecord;
        try {
            muralRecord = await base('◉ No ar!').find(muralId);
        } catch (e) {
            muralRecord = await base('Mural').find(muralId);
        }

        if (!muralRecord) return [];

        const lidoIds = muralRecord.fields['Lido'] as string[] || [];
        if (lidoIds.length === 0) return [];

        // 2. Fetch those users from the 'Access' table (tblkVI2PX3jPgYKXF)
        // Note: Filter by the list of IDs and by the corporation (Agency) name
        const records = await agencyBase('tblkVI2PX3jPgYKXF').select({
            filterByFormula: `AND(
                OR(${lidoIds.map(id => `RECORD_ID() = '${id}'`).join(', ')}),
                {Agency} = '${corporationName}'
            )`
        }).all();

        return records.map((record: any) => ({
            userName: record.fields['Name'] as string || record.fields['Agency'] as string,
            timestamp: new Date().toISOString() // We don't have per-user timestamp in the linked field, use now
        }));
    } catch (e) {
        console.warn('Error fetching Mural readers via linked records:', e);

        // Fallback to existing MuralReadLog approach if it exists
        try {
            let filter = `{Mural} = '${muralId}'`;
            if (agencyId) {
                filter = `AND({Mural} = '${muralId}', {AgencyId} = '${agencyId}')`;
            }

            const records = await base('MuralReadLog').select({
                filterByFormula: filter,
                sort: [{ field: 'Timestamp', direction: 'desc' }]
            }).all();

            return records.map((record: any) => ({
                userName: record.fields['UserName'] as string,
                timestamp: record.fields['Timestamp'] as string
            }));
        } catch (innerE) {
            return [];
        }
    }
}
