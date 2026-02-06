import Airtable from 'airtable';

const getAirtableBase = () => {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
        // During build time, Next.js might import this. 
        // We only want to throw if we're actually trying to use it in a request.
        console.warn('Airtable credentials missing. This is expected during build if not provided.');
        return null as any;
    }

    return new Airtable({ apiKey }).base(baseId);
};

export const base = getAirtableBase();
