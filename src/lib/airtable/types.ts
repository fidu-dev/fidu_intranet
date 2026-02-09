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

    // New fields for Column Visibility
    status?: string; // Column 'Status'
    whatToBring?: string; // Column 'O que levar'
    provider?: string; // Column 'Fornecedor' (restricted)
    duration?: string; // Column 'Duração'
    valorExtra?: string; // Column 'Valor Extra'
    optionals?: string; // Column 'Opcionais disponíveis'
    restrictions?: string; // Column 'Restrições'
    observations?: string; // Column 'Observações'
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
    agencyId: string;
    name: string; // Company/Agency name
    agentName?: string; // Individual agent name
    email: string; // Linked to Clerk User Email
    commissionRate: number; // e.g., 0.10 for 10%
    skills?: string[]; // Allowed destinations
    canReserve: boolean; // Access to reservation page
    canAccessMural: boolean;
    isInternal: boolean; // Internal vendor (no commission display, see sale price)
    canAccessExchange: boolean;
    isAdmin: boolean; // Column 'Admin'
}

export interface ExchangeRate {
    id: string;
    currency: string;
    value: number;
    symbol: string;
    lastUpdated?: string;
    observations?: string;
}

export interface MuralItem {
    id: string;
    title: string;
    summary?: string; // Column 'Resumo'
    content: string; // Column 'Notes'
    category: string; // Column 'Categoria'
    priority: 'Crítica' | 'Alta' | 'Média' | 'Baixa'; // Column 'Prioridade'
    impact?: string; // Column 'Impacto'
    destination?: string; // Column 'Destino'
    startDate?: string; // Column 'Validade' or 'Início'
    affectedScope?: string; // Column 'Afeta'
    publishedAt: string; // Column 'Publicado_em'
    isPinned: boolean; // Column 'Fixado'
    requiresConfirmation: boolean; // Column 'Requer_Confirmacao'
    isActive: boolean; // Column 'Ativo'
    attachments?: { url: string; filename: string }[]; // Column 'Attachments'
}

export interface NoticeReadLog {
    id: string;
    userId: string; // Link to Acessos
    noticeId: string; // Link to Mural
    confirmedAt: string;
    agencyId: string; // Lookup via User
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
