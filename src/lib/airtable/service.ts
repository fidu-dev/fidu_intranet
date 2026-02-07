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
    const agencyNameField = record.fields['Agency'];
    const userNameField = record.fields['User']; // Key field for read log

    // Handle both string and lookup/array values
    const agencyName = (Array.isArray(agencyNameField) ? agencyNameField[0] : agencyNameField) as string;
    const userName = (Array.isArray(userNameField) ? userNameField[0] : userNameField) as string;

    return {
        id: record.id,
        name: agencyName || userName || 'Agente',
        agentName: userName, // This is the 'User' column value
        email: record.fields['mail'] as string,
        commissionRate: record.fields['Comision_base'] as number || 0,
        skills: record.fields['Skill'] as string[] || [],
        canReserve: record.fields['Reserva'] as boolean || false,
        canAccessMural: record.fields['Mural'] as boolean || false,
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

    const now = new Date();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    const itemsToUpdateStatus: { id: string, fields: any }[] = [];

    const mappedItems = records.map((record: any) => {
        const fields = record.fields;

        // User mentioned 'Last update', falling back to 'Data' or 'Date'
        const rawDate = fields['Last update'] || fields['Data'] || fields['Date'];
        const itemDate = rawDate ? new Date(rawDate) : now;

        // Condition: Less than 7 days ago
        const isActuallyNew = (now.getTime() - itemDate.getTime()) < SEVEN_DAYS_MS;

        // Sync Airtable 'New' column if requested (assuming it's a select or string field)
        const currentNewValue = fields['New'];
        const targetNewValue = isActuallyNew ? 'New' : null;

        if (currentNewValue !== targetNewValue) {
            itemsToUpdateStatus.push({
                id: record.id,
                fields: { 'New': targetNewValue }
            });
        }

        // Use the calculated status for the UI
        const isNew = isActuallyNew;

        // Flexible field mapping based on common names and screenshot
        const title = fields['Título'] || fields['Aviso'] || fields['Title'] || 'Sem título';
        const details = fields['Notes'] || fields['Detalhes'] || fields['Details'] || '';
        const date = rawDate || now.toISOString();
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

    // Proactively update Airtable 'New' tag if it changed (batch update)
    if (itemsToUpdateStatus.length > 0) {
        try {
            const table = records[0]._table.name; // Get table name from record
            await base(table).update(itemsToUpdateStatus.slice(0, 10)); // Max 10 per call
            console.log(`Synced 'New' status for ${itemsToUpdateStatus.length} items in ${table}`);
        } catch (e) {
            console.warn('Failed to sync New status in Airtable:', e);
        }
    }

    return mappedItems;
}

export async function markAsRead(muralId: string, userEmail: string, userName: string, agencyId: string): Promise<void> {
    const base = getProductBase();
    if (!base) return;

    // Skip MuralReadLog - focus on the primary Lido field in Mural table

    // Update the "Lido" field in 'Mural' table with USERNAME as simple text
    const tablesToTry = ['Mural', '◉ No ar!'];

    for (const tableName of tablesToTry) {
        try {
            const record = await base(tableName).find(muralId);
            if (!record) continue;

            const fields = record.fields;
            // Lido is a text/select field - store usernames as text values
            let currentLido = fields['Lido'] as any;

            // Handle different field types
            let newValue: any;

            if (Array.isArray(currentLido)) {
                // Multi-select or Linked Records - check if userName already exists
                const lidoStrings = currentLido.map((item: any) =>
                    typeof item === 'string' ? item : (item?.name || item?.email || '')
                );

                if (!lidoStrings.includes(userName)) {
                    // For linked records, we need to append the agencyId (record ID)
                    // For multi-select/text, we append the userName string
                    if (typeof currentLido[0] === 'string' && currentLido[0].startsWith('rec')) {
                        // Linked records - append agencyId
                        newValue = [...currentLido, agencyId];
                    } else {
                        // Text array - append userName
                        newValue = [...lidoStrings.filter(Boolean), userName];
                    }
                }
            } else if (typeof currentLido === 'string') {
                // Single text field - append comma-separated
                if (!currentLido.includes(userName)) {
                    newValue = currentLido ? `${currentLido}, ${userName}` : userName;
                }
            } else {
                // Empty or null - set as single value (try as array first for multi-select)
                newValue = [userName];
            }

            if (newValue !== undefined) {
                try {
                    await base(tableName).update(muralId, {
                        'Lido': newValue
                    });
                    console.log(`✅ Successfully updated Lido field in ${tableName} with: ${JSON.stringify(newValue)}`);
                } catch (updateError: any) {
                    // If array fails, try as single string
                    console.warn('Array update failed, trying as string:', updateError.message);
                    await base(tableName).update(muralId, {
                        'Lido': userName
                    });
                    console.log(`✅ Successfully updated Lido field as string in ${tableName}`);
                }
            } else {
                console.log(`ℹ️ User ${userName} already in Lido field`);
            }

            return;
        } catch (e: any) {
            console.error(`Error updating ${tableName}:`, e.message);
            continue;
        }
    }

    console.error('❌ Failed to update Lido field in any table');
}

export async function getMuralReaders(muralId: string, agencyId?: string, corporationName?: string): Promise<{ userName: string, timestamp: string }[]> {
    const base = getProductBase();
    const agencyBase = getAgencyBase();
    if (!base || !agencyBase) return [];

    try {
        // 1. Fetch the Mural item to get its 'Lido' field values
        let muralRecord;
        try {
            muralRecord = await base('Mural').find(muralId);
        } catch (e) {
            muralRecord = await base('◉ No ar!').find(muralId);
        }

        if (!muralRecord) {
            console.log('Mural record not found:', muralId);
            return [];
        }

        const lidoField = muralRecord.fields['Lido'];
        console.log('📋 Lido field raw value:', JSON.stringify(lidoField));

        if (!lidoField) return [];

        // Handle different Lido field formats
        let lidoValues: string[] = [];

        if (Array.isArray(lidoField)) {
            // Could be linked records (IDs) or multi-select (strings)
            lidoValues = lidoField.map((item: any) => {
                if (typeof item === 'string') return item;
                if (item?.name) return item.name;
                if (item?.email) return item.email;
                return '';
            }).filter(Boolean);
        } else if (typeof lidoField === 'string') {
            // Comma-separated string
            lidoValues = lidoField.split(',').map(s => s.trim()).filter(Boolean);
        }

        console.log('📋 Parsed Lido values:', lidoValues);

        if (lidoValues.length === 0) return [];

        // 2. Check if these are record IDs (start with 'rec') or usernames
        const isRecordIds = lidoValues.every(v => v.startsWith('rec'));

        let matchingRecords: any[] = [];

        if (isRecordIds) {
            // Linked records - fetch from Access table by record ID
            const records = await agencyBase('tblkVI2PX3jPgYKXF').select({
                filterByFormula: `OR(${lidoValues.map(id => `RECORD_ID() = '${id}'`).join(', ')})`
            }).all();
            matchingRecords = records;
        } else {
            // Text usernames - fetch from Access table where User matches any of these values
            // and Agency matches the corporation name
            const records = await agencyBase('tblkVI2PX3jPgYKXF').select({
                filterByFormula: corporationName
                    ? `{Agency} = '${corporationName}'`
                    : ''
            }).all();

            // Filter by User column matching any Lido value
            matchingRecords = records.filter((record: any) => {
                const userValue = record.fields['User'];
                const userName = (Array.isArray(userValue) ? userValue[0] : userValue) as string;
                return lidoValues.includes(userName);
            });
        }

        console.log(`📋 Found ${matchingRecords.length} matching readers from agency ${corporationName}`);

        // 3. Filter by agency if needed and return
        return matchingRecords
            .filter((record: any) => {
                const agencyValue = record.fields['Agency'];
                const recordAgencyName = (Array.isArray(agencyValue) ? agencyValue[0] : agencyValue) as string;
                return !corporationName || recordAgencyName === corporationName;
            })
            .map((record: any) => {
                const userValue = record.fields['User'];
                const agencyValue = record.fields['Agency'];
                return {
                    userName: (Array.isArray(userValue) ? userValue[0] : userValue) as string ||
                        (Array.isArray(agencyValue) ? agencyValue[0] : agencyValue) as string ||
                        'Usuário',
                    timestamp: new Date().toISOString()
                };
            });
    } catch (e: any) {
        console.error('❌ Error fetching Mural readers:', e.message);
        return [];
    }
}
