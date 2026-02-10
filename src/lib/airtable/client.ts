import Airtable from 'airtable';

// Cache bases to avoid re-initializing on every call (efficiency in Serverless)
const cachedBases = new Map<string, any>();

export const getBaseId = () => {
    return process.env.AIRTABLE_PRODUCT_BASE_ID || process.env.AIRTABLE_BASE_ID;
};

export const getAirtableBase = (baseId?: string) => {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const id = baseId || getBaseId();

    if (!apiKey || !id) {
        console.error('[AIRTABLE_ERROR] Missing AIRTABLE_API_KEY or BASE_ID');
        return null;
    }

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
export const getProductBase = () => getAirtableBase(getBaseId());

export const getAgencyBase = () => {
    const agencyBaseId = process.env.AIRTABLE_AGENCY_BASE_ID;
    if (!agencyBaseId) {
        console.warn('[AIRTABLE_WARNING] AIRTABLE_AGENCY_BASE_ID not defined. Reservation features may be limited.');
        return null;
    }
    return getAirtableBase(agencyBaseId);
};

export const getAccessBaseId = () => {
    return process.env.AIRTABLE_ACCESS_BASE_ID || process.env.AIRTABLE_AGENCY_BASE_ID || getBaseId();
};

export const getAccessBase = () => {
    const accessBaseId = getAccessBaseId();
    if (!accessBaseId) {
        console.warn('[AIRTABLE_WARNING] AIRTABLE_ACCESS_BASE_ID/AIRTABLE_AGENCY_BASE_ID not defined. Access lookup may fail.');
        return null;
    }
    return getAirtableBase(accessBaseId);
};
