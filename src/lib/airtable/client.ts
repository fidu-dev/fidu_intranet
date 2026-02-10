@@ -39, 25 + 39, 38 @@ export const getAirtableBase = (baseId?: string) => {
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
        // Return null instead of throwing to allow partial functionality
        return null;
    }
    return getAirtableBase(agencyBaseId);
};
+
    +export const getAccessBaseId = () => {
        +    return process.env.AIRTABLE_ACCESS_BASE_ID || process.env.AIRTABLE_AGENCY_BASE_ID || getBaseId();
        +};
+
    +export const getAccessBase = () => {
        +    const accessBaseId = getAccessBaseId();
        +    if (!accessBaseId) {
            +        console.warn('[AIRTABLE_WARNING] AIRTABLE_ACCESS_BASE_ID/AIRTABLE_AGENCY_BASE_ID not defined. Access lookup may fail.');
            +        return null;
            +    }
        +    return getAirtableBase(accessBaseId);
        +};
