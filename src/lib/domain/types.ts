export type UserCapabilities = {
    id: string
    email: string
    name?: string
    commissionRate: number
    canReserve: boolean
    canAccessMural: boolean
    canAccessExchange: boolean
    isInternal: boolean
    isAdmin: boolean
    agencyName?: string
    allowedDestinations: string[]
    preferences?: any
}

export type Product = {
    id: string
    title: string
    description: string
    statusOperativo: string
    categoria: string
    destino: string
    operador: string
    temporada: string
    pickup: string
    retorno: string
    ver26Adu: string
    ver26Chd: string
    ver26Inf: string
    inv26Adu: string
    inv26Chd: string
    inv26Inf: string
    diasElegiveis: string[]
    valorExtra: string
    taxasExtras: string
    duracao: string
    tags: string[]
    restricoes: string
    opcionais: string
    variantes: string
    observacoes: string
    oQueLevar: string
    midia: string
    updatedAt: string
}
