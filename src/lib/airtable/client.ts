import Airtable from 'airtable';

const cachedBases = new Map<string, any>();

export const getAirtableBase = (baseId?: string) => {
    const apiKey = process.env.AIRTABLE_API_KEY;
    // Fallback to AIRTABLE_PRODUCT_BASE_ID for products if no specific ID is provided
    const id = baseId || process.env.AIRTABLE_PRODUCT_BASE_ID || process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !id) {
        return null;
    }

    // Return cached base if available
    if (cachedBases.has(id)) {
        return cachedBases.get(id);
    }

    try {
        const airtable = new Airtable({ apiKey });
        const base = airtable.base(id);
        cachedBases.set(id, base);
        return base;
    } catch (err) {
        console.error(`Failed to initialize Airtable base ${id}:`, err);
        return null;
    }
};

// Convenience helpers
export const getProductBase = () => getAirtableBase(process.env.AIRTABLE_PRODUCT_BASE_ID || process.env.AIRTABLE_BASE_ID);
export const getAgencyBase = () => getAirtableBase(process.env.AIRTABLE_AGENCY_BASE_ID);
