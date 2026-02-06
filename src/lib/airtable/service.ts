import { base } from './client';
import { Product, Agency } from './types';
import { FieldSet } from 'airtable';

// Helper to map record to Product
const mapToProduct = (record: any): Product => ({
    id: record.id,
    destination: record.fields['Destination'] as string,
    tourName: record.fields['Tour Name'] as string,
    category: record.fields['Category'] as string,
    basePrice: record.fields['Base Price'] as number,
    imageUrl: record.fields['Image']?.[0]?.url,
});

export const getProducts = async (): Promise<Product[]> => {
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
    if (!base) {
        console.error('Airtable base not initialized. Check your environment variables.');
        return null;
    }
    const records = await base('Agencies').select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
    }).firstPage();

    if (records.length === 0) return null;

    const fields = records[0].fields;
    return {
        id: records[0].id,
        name: fields['Name'] as string,
        email: fields['Email'] as string,
        commissionRate: fields['Commission Rate'] as number || 0,
    };
};

export const createAgency = async (agency: Omit<Agency, 'id'>) => {
    if (!base) {
        throw new Error('Airtable base not initialized');
    }
    return base('Agencies').create([
        {
            fields: {
                'Name': agency.name,
                'Email': agency.email,
                'Commission Rate': agency.commissionRate,
            }
        }
    ]);
};
