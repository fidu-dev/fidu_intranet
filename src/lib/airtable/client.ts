import Airtable from 'airtable';

let cachedBase: any = null;

export const getAirtableBase = () => {
    // If we're already initialized and have a base, return it
    if (cachedBase) return cachedBase;

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
        return null;
    }

    try {
        const airtable = new Airtable({ apiKey });
        cachedBase = airtable.base(baseId);
        return cachedBase;
    } catch (err) {
        console.error('Failed to initialize Airtable client:', err);
        return null;
    }
};
