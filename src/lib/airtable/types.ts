export interface Product {
    id: string;
    destination: string;
    tourName: string;
    category: string;
    basePrice: number; // For calculations (using Adulto)
    priceAdulto: number;
    priceMenor: number;
    priceBebe: number;
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

export interface Agency {
    id: string;
    name: string;
    email: string; // Linked to Clerk User Email
    commissionRate: number; // e.g., 0.10 for 10%
    skills?: string[]; // Allowed destinations
    canReserve?: boolean; // Access to reservation page
    isInternal?: boolean; // Internal vendor (no commission display, see sale price)
}
