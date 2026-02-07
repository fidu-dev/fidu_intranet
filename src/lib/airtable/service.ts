import { getProductBase, getAgencyBase } from './client';
import { Product, Agency } from './types';
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
        name: record.fields['Agency'] as string || record.fields['Name'] as string,
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
