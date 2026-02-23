import Airtable from 'airtable'
import { prisma } from '../db/prisma'

const apiKey = process.env.AIRTABLE_API_KEY
const baseId = process.env.AIRTABLE_PRODUCT_BASE_ID || 'appcWpZWCEnxrN99F' // fallback as per env.local

if (!apiKey || !baseId) {
    console.warn('Airtable credentials not fully configured in environment variables.')
}

const base = new Airtable({ apiKey }).base(baseId)

// Helper to safely convert Airtable duration field
const formatDuration = (seconds?: number) => {
    if (typeof seconds !== 'number') return ''
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export async function syncToursFromAirtable(): Promise<{ count: number; success: boolean; error?: string }> {
    try {
        const tableId = 'tbl4RRA0YiPk8DMjs' // the table used for products
        const records = await base(tableId).select().all()

        let count = 0

        for (const record of records) {
            const fields: any = record.fields

            const servico = (fields['Serviço'] as string) || ''
            const categoria = (fields['Categoria do Serviço'] as string) || ''
            const destino = (fields['Destino'] as string) || ''
            const atualizadoEm = fields['Atualizado em'] ? String(fields['Atualizado em']) : ''

            let operador = ''
            if (fields['Operador_Nome'] || fields['Operador Nome'] || fields['OPERADOR_NOME'] || fields['Operador (from Operadores)'] || fields['Operador (from Operador)'] || fields['OPERADOR'] || fields['Operador'] || fields['Fornecedor']) {
                operador = (
                    fields['Operador_Nome'] ||
                    fields['Operador Nome'] ||
                    fields['OPERADOR_NOME'] ||
                    fields['Operador (from Operadores)'] ||
                    fields['Operador (from Operador)'] ||
                    fields['OPERADOR'] ||
                    fields['Operador'] ||
                    fields['Fornecedor'] ||
                    (fields['Operador'] as any)?.name ||
                    (Array.isArray(fields['Operador']) && typeof fields['Operador'][0] === 'string' && !fields['Operador'][0].startsWith('rec') ? fields['Operador'][0] : null) ||
                    '–'
                ) as string
            }

            const status = fields['Status'] === true ? 'Ativo' : 'Inativo'
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

            const resumo = fields['Resumo do Passeio'] || fields['Resumo'] ? String(fields['Resumo do Passeio'] || fields['Resumo']) : ''
            const observacoes = fields['Observações'] ? String(fields['Observações']) : ''
            const oQueLevar = fields['O que levar'] ? String(fields['O que levar']) : ''
            const midia = fields['Mídia do Passeio']?.[0]?.url || ''

            await prisma.tour.upsert({
                where: { airtableRecordId: record.id },
                update: {
                    servico, categoria, destino, atualizadoEm, operador, status, temporada, pickup, retorno,
                    ver26Adu, ver26Chd, ver26Inf, inv26Adu, inv26Chd, inv26Inf,
                    diasElegiveis, valorExtra, taxasExtras, duracao, tags, restricoes, opcionais, variantes,
                    resumo, observacoes, oQueLevar, midia
                },
                create: {
                    airtableRecordId: record.id,
                    servico, categoria, destino, atualizadoEm, operador, status, temporada, pickup, retorno,
                    ver26Adu, ver26Chd, ver26Inf, inv26Adu, inv26Chd, inv26Inf,
                    diasElegiveis, valorExtra, taxasExtras, duracao, tags, restricoes, opcionais, variantes,
                    resumo, observacoes, oQueLevar, midia
                }
            })
            count++
        }

        return { count, success: true }
    } catch (error: any) {
        console.error('Error syncing tours from Airtable:', error)
        return { count: 0, success: false, error: error.message }
    }
}
