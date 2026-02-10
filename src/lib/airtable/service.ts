-import { getProductBase, getAgencyBase, getBaseId } from './client';
+import { getProductBase, getAccessBase } from './client';
import { Product, Agency, MuralItem, NoticeReadLog, Reservation, ExchangeRate } from './types';
import { FieldSet } from 'airtable';
import { AIRTABLE_TABLES } from './config';

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
        subCategory: (fields['Tags'] || fields['Categoria']) ? (Array.isArray(fields['Tags'] || fields['Categoria']) ? (fields['Tags'] || fields['Categoria']).join(', ') : (fields['Tags'] || fields['Categoria']) as string) : '',
        // taxasExtras removed from here to avoid duplication with the robust check below
        // Default/Fallback prices (using Inverno as base for now, or could change logic)
        basePrice: fields['INV26 ADU'] as number || 0,
@@ -69, 104 + 69, 128 @@ const mapToProduct = (record: any): Product => {
        taxasExtras: (fields['Taxas Extras?'] || fields['Taxas Extras']) as string,
            valorExtra: fields['Valor Extra'] as string,
                optionals: (fields['Opcionais disponíveis'] || fields['Opcionais']) as string,
                    restrictions: fields['Restrições'] as string,
                        observations: fields['Observações'] as string,
     };
};

export const getProducts = async (): Promise<Product[]> => {
    const base = getProductBase();
    if (!base) {
        console.error('Airtable product base not initialized.');
        return [];
    }

    try {
        const records = await base(AIRTABLE_TABLES.PRODUCTS).select().all();
        return records.map(mapToProduct);
    } catch (err) {
        console.error('Error fetching from Product table:', err);
        return [];
    }
};

export const getAgencyByEmail = async (email: string): Promise<Agency | null> => {
    -    const base = getProductBase();
    +    const normalizedEmail = email.trim().toLowerCase();
    +    const escapedEmail = normalizedEmail.replace(/'/g, "\\'");
    +    const base = getAccessBase() || getProductBase();
    if (!base) {
        -        console.error('Airtable Product base not initialized.');
        +        console.error('Airtable base not initialized for access lookup.');
        return null;
    }

    -    const records = await base('tbljUc8sptfa7QnAE').select({
- filterByFormula: `{mail} = '${email}'`,
        -        maxRecords: 1
    -    }).all();
+    const formula = `OR(LOWER(TRIM({mail})) = '${escapedEmail}', LOWER(TRIM({Email})) = '${escapedEmail}')`;
+    let records: any[] = [];
+
    +    try {
        +        records = await base(AIRTABLE_TABLES.ACCESS).select({
+ filterByFormula: formula,
            +            maxRecords: 1,
            +        }).all();
+    } catch (error) {
    +        console.warn('[AIRTABLE_ACCESS_LOOKUP] Formula lookup failed, using fallback scan:', error);
    +    }
+
    +    // Fallback: in case formula parsing fails or no match is returned, filter in-memory.
    +    if (records.length === 0) {
        +        const fallbackRecords = await base(AIRTABLE_TABLES.ACCESS).select({ maxRecords: 200 }).all();
        +        records = fallbackRecords.filter((record: any) => {
            +            const mail = record.fields?.mail;
            +            const emailField = record.fields?.Email;
            +            const emailPtField = record.fields?.['E-mail'];
            +            const candidates = [mail, emailField, emailPtField].flatMap(value => Array.isArray(value) ? value : [value]);
            +            return candidates.some((candidate: unknown) =>
                +                typeof candidate === 'string' && candidate.trim().toLowerCase() === normalizedEmail
                +            );
            +        }).slice(0, 1);
        +    }

if (records.length === 0) return null;

const record = records[0];
const fields = record.fields;

// Robust field mapping: try Portuguese names first, then fall back to English names
const agencyNameField = fields['Agência'] || fields['Agency'];
-    const emailField = fields['Email'] || fields['mail'];
+    const emailField = fields['Email'] || fields['mail'] || fields['E-mail'];
const commissionField = fields['Comissão Base'] || fields['Comision_base'];
const userNameField = fields['Usuário'] || fields['User'];
const skillsField = fields['Destinos'] || fields['Skill'];

// Handle both string and lookup/array values
const agencyName = (Array.isArray(agencyNameField) ? agencyNameField[0] : agencyNameField) as string;
const userName = (Array.isArray(userNameField) ? userNameField[0] : userNameField) as string;

return {
    id: record.id,
    agencyId: (Array.isArray(agencyNameField) ? agencyNameField[0] : '') as string,
    name: fields['Nome da Agência'] as string || agencyName || userName || 'Agente',
    agentName: userName, // This is the 'User' column value
    email: emailField as string,
    commissionRate: commissionField as number || 0,
    skills: skillsField as string[] || [],
    canReserve: fields['Reserva'] as boolean || false,
    canAccessMural: fields['Mural'] as boolean || false,
    isInternal: fields['Interno'] as boolean || false,
    canAccessExchange: fields['Exchange'] as boolean || false,
    isAdmin: fields['Admin'] as boolean || false,
};
 };

export const createAgency = async (agency: Omit<Agency, 'id'>) => {
    -    const base = getProductBase();
    +    const base = getAccessBase() || getProductBase();
    if (!base) {
        -        throw new Error('Airtable Product base not initialized');
        +        throw new Error('Airtable base not initialized');
    }

    -    await base('tbljUc8sptfa7QnAE').create([
        +    await base(AIRTABLE_TABLES.ACCESS).create([
            {
                fields: {
                    'Agency': agency.name,
                    'mail': agency.email,
+ 'Email': agency.email,
                'Comision_base': agency.commissionRate
            }
         }
     ]);
 };

export async function getMuralItems(): Promise<MuralItem[]> {
    const base = getProductBase();
    if (!base) return [];

    try {
        // Fetch only active notices
        const records = await base(AIRTABLE_TABLES.MURAL).select({
            filterByFormula: '{Ativo} = 1',
            sort: [
                { field: 'Fixado', direction: 'desc' },
                { field: 'Prioridade', direction: 'desc' }, // Need to handle string sorting if priority isn't numeric
                { field: 'Publicado_em', direction: 'desc' }
            ]
        }).all();

        // Custom priority sorting since it's a select field (Crítica > Alta > Média > Baixa)
        const priorityScore: Record<string, number> = { 'Crítica': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 };

        return records.map((record: any) => {
