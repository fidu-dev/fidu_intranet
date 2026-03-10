import { prisma } from '../db/prisma'
import { Product } from '../domain/types'

export async function getProducts(): Promise<Product[]> {
    const tours = await prisma.tour.findMany({
        where: { ativo: true, statusIntranet: 'Visível' },
        orderBy: { destino: 'asc' },
    })

    return tours.map((tour) => ({
        id: tour.airtableRecordId,
        title: tour.title || '',
        description: tour.description || '',
        statusOperativo: tour.statusOperativo || '',
        categoria: tour.categoria || '',
        destino: tour.destino || '',
        operador: tour.operador || '',
        temporada: tour.temporada || '',
        pickup: tour.pickup || '',
        retorno: tour.retorno || '',
        ver26Adu: tour.ver26Adu || '',
        ver26Chd: tour.ver26Chd || '',
        ver26Inf: tour.ver26Inf || '',
        inv26Adu: tour.inv26Adu || '',
        inv26Chd: tour.inv26Chd || '',
        inv26Inf: tour.inv26Inf || '',
        diasElegiveis: tour.diasElegiveis ? tour.diasElegiveis.split(',').map((d) => d.trim()) : [],
        valorExtra: tour.valorExtra || '',
        taxasExtras: tour.taxasExtras || '',
        duracao: tour.duracao || '',
        tags: tour.tags ? tour.tags.split(',').map((t) => t.trim()) : [],
        restricoes: tour.restricoes || '',
        opcionais: tour.opcionais || '',
        variantes: tour.variantes || '',
        observacoes: tour.observacoes || '',
        oQueLevar: tour.oQueLevar || '',
        midia: tour.midia || '',
        updatedAt: tour.updatedAt.toISOString(),
    }))
}
