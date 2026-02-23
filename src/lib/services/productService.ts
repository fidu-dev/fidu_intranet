import { prisma } from '../db/prisma'
import { Product } from '../domain/types'

export async function getProducts(): Promise<Product[]> {
    const tours = await prisma.tour.findMany({
        orderBy: { destino: 'asc' },
    })

    return tours.map((tour) => ({
        id: tour.airtableRecordId,
        servico: tour.servico || '',
        categoria: tour.categoria || '',
        destino: tour.destino || '',
        atualizadoEm: tour.atualizadoEm || '',
        operador: tour.operador || '',
        status: tour.status || '',
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
        resumo: tour.resumo || '',
        observacoes: tour.observacoes || '',
        oQueLevar: tour.oQueLevar || '',
        midia: tour.midia || '',
    }))
}
