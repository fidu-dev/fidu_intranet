import { getProductBase, getAgencyBase } from './client';
import { Product, Agency } from './types';
import { FieldSet } from 'airtable';

// Helper to map record to Product
const mapToProduct = (record: any): Product => ({
    id: record.id,
    destination: record.fields['Destination'] as string || 'General',
    tourName: record.fields['Tour Name'] as string || 'Unnamed Tour',
    category: record.fields['Category'] as string || 'Other',
    basePrice: record.fields['Base Price'] as number || 0,
    imageUrl: record.fields['Image']?.[0]?.url,
});

export const getProducts = async (): Promise<Product[]> => {
    const base = getProductBase();
    if (!base) {
        console.error('Airtable base not initialized. Check your environment variables.');
        return [];
    }
    const records = await base('Products').select({
        view: 'Grid view'
    }).all();

    return records.map(mapToProduct);
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
