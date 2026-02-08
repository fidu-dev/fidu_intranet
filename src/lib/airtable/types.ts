export interface Product {
    id: string;
    destination: string;
    tourName: string;
    category: string;
    // Base prices (Legacy field, now used as default/fallback)
    basePrice: number;
    priceAdulto: number;
    priceMenor: number;
    priceBebe: number;

    // Seasonal Prices - Verão 2026
    priceAdultoVer26: number;
    priceMenorVer26: number;
    priceBebeVer26: number;

    // Seasonal Prices - Inverno 2026
    priceAdultoInv26: number;
    priceMenorInv26: number;
    priceBebeInv26: number;

    pickup?: string;
    retorno?: string;
    temporada?: string;
    diasElegiveis?: string[];
    subCategory?: string; // Column 'Categoria' in Airtable
    taxasExtras?: string; // Column 'Taxas Extras?' in Airtable
    description?: string; // Column 'Descrição'
    inclusions?: string; // Column 'Incluso'
    exclusions?: string; // Column 'Não Incluso'
    requirements?: string; // Column 'Requisitos'
    imageUrl?: string;
}

export interface AgencyProduct extends Product {
    // Calculated NET and SALE prices for current context (defaults/fallback)
    salePriceAdulto: number;
    netoPriceAdulto: number;
    salePriceMenor: number;
    netoPriceMenor: number;
    salePriceBebe: number;
    netoPriceBebe: number;

    // Calculated Seasonal Prices
    // Verão
    salePriceAdultoVer26: number;
    netoPriceAdultoVer26: number;
    salePriceMenorVer26: number;
    netoPriceMenorVer26: number;
    salePriceBebeVer26: number;
    netoPriceBebeVer26: number;

    // Inverno
    salePriceAdultoInv26: number;
    netoPriceAdultoInv26: number;
    salePriceMenorInv26: number;
    netoPriceMenorInv26: number;
    salePriceBebeInv26: number;
    netoPriceBebeInv26: number;
}

export interface Agency {
    id: string;
    name: string; // Company/Agency name
    agentName?: string; // Individual agent name
    email: string; // Linked to Clerk User Email
    commissionRate: number; // e.g., 0.10 for 10%
    skills?: string[]; // Allowed destinations
    canReserve: boolean; // Access to reservation page
    canAccessMural: boolean;
    isInternal: boolean; // Internal vendor (no commission display, see sale price)
}

export interface MuralItem {
    id: string;
    date: string;
    category: 'Atualização de Valores' | 'Atualização de funcionamento' | string;
    title: string;
    details: string;
    isNew: boolean;
    isRead: boolean;
}

export interface MuralReadLog {
    id: string;
    muralId: string;
    userEmail: string;
    userName: string;
    agencyId: string;
    timestamp: string;
}
export interface Reservation {
    id?: string;
    productName: string;
    destination: string;
    agentName: string;
    agentEmail: string;
    date: string;
    adults: number;
    children: number;
    infants: number;
    paxNames: string;
    totalAmount: number;
    commissionAmount: number;
    status: 'Pré-reserva' | 'Confirmada' | 'Cancelada';
    timestamp?: string;
}
