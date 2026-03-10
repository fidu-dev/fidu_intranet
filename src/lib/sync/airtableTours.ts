import Airtable from 'airtable'
import { prisma } from '../db/prisma'

const apiKey = process.env.AIRTABLE_API_KEY
const baseId = process.env.AIRTABLE_PRODUCT_BASE_ID || 'appcWpZWCEnxrN99F'

if (!apiKey || !baseId) {
    console.warn('Airtable credentials not fully configured in environment variables.')
}

const base = new Airtable({ apiKey }).base(baseId)
const TABLE_ID = 'tbl4RRA0YiPk8DMjs'

// ── Helpers ──

const formatDuration = (seconds?: number) => {
    if (typeof seconds !== 'number') return ''
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function parseDurationToSeconds(dur: string | null): number | undefined {
    if (!dur) return undefined
    const parts = dur.split(':')
    if (parts.length === 2) {
        const h = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10)
        if (!isNaN(h) && !isNaN(m)) return h * 3600 + m * 60
    }
    return undefined
}

function toFloat(val: string | null | undefined): number | undefined {
    if (!val) return undefined
    const n = parseFloat(val)
    return isNaN(n) ? undefined : n
}

function toArray(val: string | null | undefined): string[] | undefined {
    if (!val) return undefined
    const arr = val.split(',').map(s => s.trim()).filter(Boolean)
    return arr.length ? arr : undefined
}

// ── Sync Reverso: Supabase → Airtable ──

function buildAirtableFields(tour: any) {
    const fields: Record<string, any> = {}

    if (tour.title) fields['Serviço'] = tour.title
    if (tour.categoria) fields['Categoria do Serviço'] = tour.categoria
    if (tour.destino) fields['Destino'] = tour.destino
    if (tour.operador) fields['Operador'] = tour.operador
    fields['Status'] = tour.statusOperativo === 'Ativo'

    const temporadaArr = toArray(tour.temporada)
    if (temporadaArr) fields['Temporada'] = temporadaArr

    const pickup = parseDurationToSeconds(tour.pickup)
    if (pickup !== undefined) fields['Pickup'] = pickup
    const retorno = parseDurationToSeconds(tour.retorno)
    if (retorno !== undefined) fields['Retorno'] = retorno

    if (tour.ver26Adu) fields['VER26 ADU'] = toFloat(tour.ver26Adu)
    if (tour.ver26Chd) fields['VER26 CHD'] = toFloat(tour.ver26Chd)
    if (tour.ver26Inf) fields['VER26 INF'] = toFloat(tour.ver26Inf)
    if (tour.inv26Adu) fields['INV26 ADU'] = toFloat(tour.inv26Adu)
    if (tour.inv26Chd) fields['INV26 CHD'] = toFloat(tour.inv26Chd)
    if (tour.inv26Inf) fields['INV26 INF'] = toFloat(tour.inv26Inf)

    const diasArr = toArray(tour.diasElegiveis)
    if (diasArr) fields['Dias elegíveis'] = diasArr

    if (tour.valorExtra) fields['Valor Extra'] = toFloat(tour.valorExtra)
    if (tour.taxasExtras) fields['Taxas Extras'] = tour.taxasExtras
    if (tour.duracao) fields['Duração'] = tour.duracao

    const tagsArr = toArray(tour.tags)
    if (tagsArr) fields['Tags'] = tagsArr

    if (tour.restricoes) fields['Restrições'] = tour.restricoes
    if (tour.opcionais) fields['Opcionais disponíveis'] = tour.opcionais
    if (tour.variantes) fields['Variantes'] = tour.variantes
    if (tour.description) fields['Resumo do Passeio'] = tour.description
    if (tour.observacoes) fields['Observações'] = tour.observacoes
    if (tour.oQueLevar) fields['O que levar'] = tour.oQueLevar

    return fields
}

export async function syncToursToAirtable(): Promise<{ count: number; success: boolean; error?: string }> {
    try {
        const tours = await prisma.tour.findMany({ where: { ativo: true } })
        let count = 0

        const toUpdate = tours.filter(t => t.airtableRecordId)
        const toCreate = tours.filter(t => !t.airtableRecordId)

        // Batch update (max 10 per request)
        for (let i = 0; i < toUpdate.length; i += 10) {
            const batch = toUpdate.slice(i, i + 10)
            await base(TABLE_ID).update(
                batch.map(tour => ({
                    id: tour.airtableRecordId!,
                    fields: buildAirtableFields(tour),
                }))
            )
            count += batch.length
        }

        // Batch create (max 10 per request)
        for (let i = 0; i < toCreate.length; i += 10) {
            const batch = toCreate.slice(i, i + 10)
            const created = await base(TABLE_ID).create(
                batch.map(tour => ({ fields: buildAirtableFields(tour) }))
            )
            for (let j = 0; j < created.length; j++) {
                await prisma.tour.update({
                    where: { id: batch[j].id },
                    data: { airtableRecordId: created[j].id },
                })
            }
            count += batch.length
        }

        return { count, success: true }
    } catch (error: any) {
        console.error('Error syncing tours to Airtable:', error)
        return { count: 0, success: false, error: error.message }
    }
}

// ── Sync Original: Airtable → Supabase (mantido para referência) ──

export async function syncToursFromAirtable(): Promise<{ count: number; success: boolean; error?: string }> {
    try {
        const records = await base(TABLE_ID).select().all()

        const ver26Season = await prisma.season.findUnique({ where: { code: 'VER26' } })
        const inv26Season = await prisma.season.findUnique({ where: { code: 'INV26' } })

        let count = 0

        for (const record of records) {
            const fields: any = record.fields

            const title = (fields['Serviço'] as string) || ''
            const categoria = (fields['Categoria do Serviço'] as string) || ''
            const destino = (fields['Destino'] as string) || ''

            let operador = ''
            if (fields['Operador_Nome'] || fields['Operador Nome'] || fields['OPERADOR_NOME'] || fields['Operador (from Operadores)'] || fields['Operador (from Operador)'] || fields['OPERADOR'] || fields['Operador'] || fields['Fornecedor']) {
                operador = (
                    fields['Operador_Nome'] || fields['Operador Nome'] || fields['OPERADOR_NOME'] ||
                    fields['Operador (from Operadores)'] || fields['Operador (from Operador)'] ||
                    fields['OPERADOR'] || fields['Operador'] || fields['Fornecedor'] ||
                    (fields['Operador'] as any)?.name ||
                    (Array.isArray(fields['Operador']) && typeof fields['Operador'][0] === 'string' && !fields['Operador'][0].startsWith('rec') ? fields['Operador'][0] : null) ||
                    '–'
                ) as string
            }

            const statusOperativo = fields['Status'] === true ? 'Ativo' : 'Inativo'
            const temporada = Array.isArray(fields['Temporada']) ? fields['Temporada'].join(', ') : (fields['Temporada'] as string) || ''
            const pickup = formatDuration(fields['Pickup'] as number)
            const retorno = formatDuration(fields['Retorno'] as number)

            const ver26Adu = fields['VER26 ADU'] ? String(fields['VER26 ADU']) : ''
            const ver26Chd = fields['VER26 CHD'] ? String(fields['VER26 CHD']) : ''
            const ver26Inf = fields['VER26 INF'] ? String(fields['VER26 INF']) : ''
            const inv26Adu = fields['INV26 ADU'] ? String(fields['INV26 ADU']) : ''
            const inv26Chd = fields['INV26 CHD'] ? String(fields['INV26 CHD']) : ''
            const inv26Inf = fields['INV26 INF'] ? String(fields['INV26 INF']) : ''

            const diasElegiveis = Array.isArray(fields['Dias elegíveis']) ? fields['Dias elegíveis'].join(', ') : (fields['Dias elegíveis'] as string) || ''
            const valorExtra = fields['Valor Extra'] ? String(fields['Valor Extra']) : ''
            const taxasExtras = (fields['Taxas Extras?'] || fields['Taxas Extras']) ? String(fields['Taxas Extras?'] || fields['Taxas Extras']) : ''
            const duracao = fields['Duração'] ? String(fields['Duração']) : ''
            const tags = Array.isArray(fields['Tags']) ? fields['Tags'].join(', ') : (fields['Tags'] as string) || ''
            const restricoes = fields['Restrições'] ? String(fields['Restrições']) : ''
            const opcionais = (fields['Opcionais disponíveis'] || fields['Opcionais']) ? String(fields['Opcionais disponíveis'] || fields['Opcionais']) : ''
            const variantes = fields['Variantes'] ? String(fields['Variantes']) : ''
            const description = fields['Resumo do Passeio'] || fields['Resumo'] ? String(fields['Resumo do Passeio'] || fields['Resumo']) : ''
            const observacoes = fields['Observações'] ? String(fields['Observações']) : ''
            const oQueLevar = fields['O que levar'] ? String(fields['O que levar']) : ''
            const midia = fields['Mídia do Passeio']?.[0]?.url || ''

            const tour = await prisma.tour.upsert({
                where: { airtableRecordId: record.id },
                update: {
                    title, categoria, destino, operador, statusOperativo, temporada, pickup, retorno,
                    ver26Adu, ver26Chd, ver26Inf, inv26Adu, inv26Chd, inv26Inf,
                    diasElegiveis, valorExtra, taxasExtras, duracao, tags, restricoes, opcionais, variantes,
                    description, observacoes, oQueLevar, midia
                },
                create: {
                    airtableRecordId: record.id,
                    title, categoria, destino, operador, statusOperativo, temporada, pickup, retorno,
                    ver26Adu, ver26Chd, ver26Inf, inv26Adu, inv26Chd, inv26Inf,
                    diasElegiveis, valorExtra, taxasExtras, duracao, tags, restricoes, opcionais, variantes,
                    description, observacoes, oQueLevar, midia
                }
            })

            if (ver26Season) {
                await prisma.tourPrice.upsert({
                    where: { tourId_seasonId: { tourId: tour.id, seasonId: ver26Season.id } },
                    update: { adu: ver26Adu, chd: ver26Chd, inf: ver26Inf },
                    create: { tourId: tour.id, seasonId: ver26Season.id, adu: ver26Adu, chd: ver26Chd, inf: ver26Inf },
                })
            }
            if (inv26Season) {
                await prisma.tourPrice.upsert({
                    where: { tourId_seasonId: { tourId: tour.id, seasonId: inv26Season.id } },
                    update: { adu: inv26Adu, chd: inv26Chd, inf: inv26Inf },
                    create: { tourId: tour.id, seasonId: inv26Season.id, adu: inv26Adu, chd: inv26Chd, inf: inv26Inf },
                })
            }

            count++
        }

        return { count, success: true }
    } catch (error: any) {
        console.error('Error syncing tours from Airtable:', error)
        return { count: 0, success: false, error: error.message }
    }
}
