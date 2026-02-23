export type UserCapabilities = {
    id: string
    email: string
    commissionRate: number
    canReserve: boolean
    canAccessMural: boolean
    canAccessExchange: boolean
    isInternal: boolean
    isAdmin: boolean
}

export type Product = {
    id: string
    servico: string
    categoria: string
    destino: string
    atualizadoEm: string
    operador: string
    status: string
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
    resumo: string
    observacoes: string
    oQueLevar: string
    midia: string
}
