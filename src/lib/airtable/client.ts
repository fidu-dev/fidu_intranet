import Airtable from 'airtable';

const cachedBases = new Map<string, any>();

// Standardized configuration sources
// Standardized configuration sources
export const getBaseApiKey = () => {
    const key = process.env.AIRTABLE_API_KEY;
    if (!key) {
        console.error('[AIRTABLE_CONFIG_ERROR] AIRTABLE_API_KEY is not defined in environment variables');
        throw new Error('AIRTABLE_API_KEY is missing. Please check your environment configuration.');
    }
    return key;
};

export const getBaseId = () => {
    const id = process.env.AIRTABLE_PRODUCT_BASE_ID || process.env.AIRTABLE_BASE_ID;
    if (!id) {
        console.error('[AIRTABLE_CONFIG_ERROR] AIRTABLE_BASE_ID/AIRTABLE_PRODUCT_BASE_ID is not defined');
        throw new Error('AIRTABLE_BASE_ID is missing. The application requires an Airtable Base ID to function.');
    }
    return id;
};

export const getAirtableBase = (baseId?: string) => {
    // Strict: If baseId is passed, it must be valid. If not, use default.
    // However, to ensure strictly server-side Env usage as requested:
    // We will prefer the passed baseId if it matches an ENV variable source, 
    // but here we just ensure a valid ID is available.

    // Default to the Product Base ID if none provided
    const id = baseId || getBaseId();
    const apiKey = getBaseApiKey();

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
        throw new Error(`Failed to initialize Airtable base: ${err}`);
    }
};

// Convenience helpers
export const getProductBase = () => getAirtableBase(getBaseId());
export const getAgencyBase = () => {
    const agencyBaseId = process.env.AIRTABLE_AGENCY_BASE_ID;
    if (!agencyBaseId) {
        console.warn('[AIRTABLE_WARNING] AIRTABLE_AGENCY_BASE_ID not defined. Reservation features may be limited.');
        // Return null instead of throwing to allow partial functionality
        return null;
    }
    return getAirtableBase(agencyBaseId);
};
