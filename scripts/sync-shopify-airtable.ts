import { prisma } from '../src/lib/db/prisma';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appcWpZWCEnxrN99F');
const TABLE_ID = 'tbl4sVMFSr6xRKOQ0';

// Manual overrides: Airtable title → DB title
const MANUAL_MAP: Record<string, string> = {
    'Trafessia Diurna - La Cueva Catedral': 'La Cueva Catedral Circuito Diurno',
    'Nieve al Límite - Fronteira Chile': 'Neve ao Limite',
    'Villa La Angostura e Cerro Bayo': 'Villa la Angostura y Cerro Bayo',
    'Cerro Tronador': 'Cerro Tronador e Geleira Negra',
    'Caminhada à Laguna Congelada': 'Refúgio Neumeyer - Laguna Congelada',
    'Batismo de Snowboard Cerro Catedral': 'Batismo de SNOW Cerro Catedral - Com Transfer',
    'Catedral Full Day - Transfer Ski Catedral': 'Transfer Cerro Catedral Full Day',
    'Batismo Ski Cerro Perito Moreno': 'Batismo de SNOW Cerro Perito Moreno',
    'Navegação Puerto Blest e Cascata de los Cántaros com Traslado': 'Pueto Blest e Cascada de Los Cántaros',
    'Aula de Ski no Winter Park com translado': 'Winter Park - Clase SKI Grupal',
    'Piedras Blancas': 'Piedras Blancas - Passe Skibunda',
    'Roca Negra': 'Roca Negra Chocolate',
    'Aulas Privadas de Ski Cerro Catedral': 'Aula de Ski - Cerro Catedral',
    'Batismo de Ski Cerro Catedral': 'Batismo de SKI Cerro Catedral - Com Transfer',
    'Skibunda Fun Day - Cerro Perito Moreno': 'Perito Moreno - Skibunda Fun Day',
    'Aulas Privadas de Snowboard Cerro Catedral': 'Aula de Snowboard - Cerro Catedral',
    'Ski Nórdico com moto de neve + translado': 'Combo Ski Nordico + Snowmobile 2 pessoas',
    'Noite Nordica': 'Noche Nordica',
    'Isla Victoria e Bosque de Arrayanes com Traslado': 'Isla Victoria y Bosque de Arrayanes ',
    'Caminhada com Raquetes Winter Park': 'Winter Park - Caminhada com Raquetes',
};

function normalize(s: string): string {
    return s.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function main() {
    const records = await base(TABLE_ID).select().all();
    console.log('Airtable records:', records.length);

    const tours = await prisma.tour.findMany({
        select: { id: true, title: true, productId: true }
    });
    console.log('DB tours:', tours.length);
    console.log();

    // Build title lookup
    const toursByTitle = new Map<string, any>();
    for (const t of tours) {
        if (t.title) toursByTitle.set(t.title, t);
    }

    // Build normalized lookup
    const toursByNorm = new Map<string, any>();
    for (const t of tours) {
        const norm = normalize(t.title || '');
        if (!toursByNorm.has(norm)) toursByNorm.set(norm, t);
    }

    let matched = 0;
    let unmatched = 0;

    for (const rec of records) {
        const f = rec.fields as any;
        const aTitle = f['Title'] || '';

        // 1. Check manual map
        let target: any = null;
        if (MANUAL_MAP[aTitle]) {
            target = toursByTitle.get(MANUAL_MAP[aTitle]);
        }

        // 2. Try exact title match
        if (!target) {
            target = toursByTitle.get(aTitle);
        }

        // 3. Try normalized exact match
        if (!target) {
            target = toursByNorm.get(normalize(aTitle));
        }

        // 4. Try contains match
        if (!target) {
            const aNorm = normalize(aTitle);
            for (const t of tours) {
                const tNorm = normalize(t.title || '');
                if (tNorm === aNorm || tNorm.includes(aNorm) || aNorm.includes(tNorm)) {
                    target = t;
                    break;
                }
            }
        }

        if (target) {
            const updateData: any = {};
            if (f['Product ID']) updateData.productId = String(f['Product ID']);
            if (f['Status']) updateData.status = f['Status'].toLowerCase();
            if (f['Handle']) updateData.handle = f['Handle'];
            if (f['Vendor']) updateData.vendor = f['Vendor'];
            if (f['Product Type']) updateData.productType = f['Product Type'];
            if (f['Featured Image']) updateData.featuredImage = f['Featured Image'];
            if (f['Price'] !== undefined) updateData.price = Number(f['Price']);
            if (f['Compare At Price'] !== undefined) updateData.compareAtPrice = Number(f['Compare At Price']);
            if (f['Inventory Quantity'] !== undefined) updateData.inventoryQuantity = Number(f['Inventory Quantity']);
            if (f['Inventory Policy']) updateData.inventoryPolicy = f['Inventory Policy'].toLowerCase();
            if (f['Requires Shipping']) updateData.requiresShipping = f['Requires Shipping'] === 'YES';
            if (f['Taxable']) updateData.taxable = f['Taxable'] === 'YES';
            if (f['Options']) updateData.options = typeof f['Options'] === 'string' ? f['Options'] : JSON.stringify(f['Options']);
            if (f['Image Alt Text']) updateData.imageAltText = f['Image Alt Text'];
            if (f['Admin GraphQL API ID']) updateData.adminGraphqlApiId = f['Admin GraphQL API ID'];
            if (f['Inventory Item ID']) updateData.inventoryItemId = String(f['Inventory Item ID']);
            if (f['Published At']) updateData.publishedAt = new Date(f['Published At']);
            if (f['Variants Count'] !== undefined) updateData.variantsCount = Number(f['Variants Count']);
            if (f['Images Count'] !== undefined) updateData.imagesCount = Number(f['Images Count']);

            await prisma.tour.update({ where: { id: target.id }, data: updateData });
            console.log('✅', aTitle, '→', target.title);
            matched++;
        } else {
            console.log('❌ NO MATCH:', aTitle);
            unmatched++;
        }
    }

    console.log();
    console.log(`Matched: ${matched} | Unmatched: ${unmatched}`);
}

main().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
