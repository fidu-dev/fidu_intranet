'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from 'lucide-react';

export interface PasseioFormData {
    // Bloco 1 — Dados Principais
    title: string;
    destino: string;
    categoria: string;
    operador: string;
    temporada: string;
    pickup: string;
    retorno: string;
    duracao: string;
    description: string;
    observacoes: string;
    oQueLevar: string;
    restricoes: string;
    opcionais: string;
    variantes: string;
    moeda: string;
    tags: string;
    statusOperativo: string;
    statusIntranet: string;
    // Bloco 2 — Preços e Regras Comerciais
    ver26Adu: string;
    ver26Chd: string;
    ver26Inf: string;
    inv26Adu: string;
    inv26Chd: string;
    inv26Inf: string;
    diasElegiveis: string;
    valorNeto: string;
    valorExtra: string;
    taxasExtras: string;
    precoConvertido: string;
    // Bloco 3 — E-commerce (será adicionado no Prompt 5)
    productId: string;
    status: string;
    handle: string;
    vendor: string;
    productType: string;
    featuredImage: string;
    price: string;
    compareAtPrice: string;
    inventoryQuantity: string;
    inventoryPolicy: string;
    requiresShipping: boolean;
    taxable: boolean;
    options: string;
    imageAltText: string;
    adminGraphqlApiId: string;
    inventoryItemId: string;
    publishedAt: string;
    variantsCount: string;
    imagesCount: string;
}

export const EMPTY_FORM: PasseioFormData = {
    title: '', destino: '', categoria: '', operador: '', temporada: '',
    pickup: '', retorno: '', duracao: '', description: '', observacoes: '',
    oQueLevar: '', restricoes: '', opcionais: '', variantes: '', moeda: 'BRL',
    tags: '', statusOperativo: 'Ativo', statusIntranet: 'Visível',
    ver26Adu: '', ver26Chd: '', ver26Inf: '',
    inv26Adu: '', inv26Chd: '', inv26Inf: '',
    diasElegiveis: '', valorNeto: '', valorExtra: '', taxasExtras: '', precoConvertido: '',
    productId: '', status: 'draft', handle: '', vendor: '', productType: '',
    featuredImage: '', price: '', compareAtPrice: '', inventoryQuantity: '',
    inventoryPolicy: 'deny', requiresShipping: false, taxable: false, options: '',
    imageAltText: '', adminGraphqlApiId: '', inventoryItemId: '', publishedAt: '',
    variantsCount: '', imagesCount: '',
};

interface PasseioFormProps {
    data: PasseioFormData;
    onChange: (data: PasseioFormData) => void;
    errors?: Record<string, string>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {children}
        </div>
    );
}

export function PasseioForm({ data, onChange, errors = {} }: PasseioFormProps) {
    const set = (field: keyof PasseioFormData, value: string | boolean) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-8">
            {/* ─── BLOCO 1 — Dados Principais ─── */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Dados Principais</h2>
                </div>
                <div className="p-6 space-y-5">
                    {/* Linha 1: Título + Destino */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Título do Passeio" required>
                            <Input
                                value={data.title}
                                onChange={e => set('title', e.target.value)}
                                placeholder="Ex: Tour Vulcão Villarrica"
                                className={errors.title ? 'border-red-300' : ''}
                            />
                            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                        </Field>
                        <Field label="Destino" required>
                            <Input
                                value={data.destino}
                                onChange={e => set('destino', e.target.value)}
                                placeholder="Ex: Atacama"
                                className={errors.destino ? 'border-red-300' : ''}
                            />
                            {errors.destino && <p className="text-xs text-red-500">{errors.destino}</p>}
                        </Field>
                    </div>

                    {/* Linha 2: Categoria + Operador + Temporada */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Categoria">
                            <Input value={data.categoria} onChange={e => set('categoria', e.target.value)} placeholder="Ex: Aventura" />
                        </Field>
                        <Field label="Operador">
                            <Input value={data.operador} onChange={e => set('operador', e.target.value)} />
                        </Field>
                        <Field label="Temporada">
                            <Input value={data.temporada} onChange={e => set('temporada', e.target.value)} placeholder="Ex: Verão, Inverno" />
                        </Field>
                    </div>

                    {/* Linha 3: Pickup + Retorno + Duração */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Ponto de Embarque">
                            <Input value={data.pickup} onChange={e => set('pickup', e.target.value)} placeholder="HH:MM ou local" />
                        </Field>
                        <Field label="Ponto de Retorno">
                            <Input value={data.retorno} onChange={e => set('retorno', e.target.value)} />
                        </Field>
                        <Field label="Duração">
                            <Input value={data.duracao} onChange={e => set('duracao', e.target.value)} placeholder="Ex: 08:00" />
                        </Field>
                    </div>

                    {/* Descrição */}
                    <Field label="Descrição do Passeio" required>
                        <Textarea
                            value={data.description}
                            onChange={e => set('description', e.target.value)}
                            rows={4}
                            placeholder="Descreva o passeio..."
                            className={errors.description ? 'border-red-300' : ''}
                        />
                        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                    </Field>

                    {/* Observações + O que levar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Observações">
                            <Textarea value={data.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3} />
                        </Field>
                        <Field label="O que Levar">
                            <Textarea value={data.oQueLevar} onChange={e => set('oQueLevar', e.target.value)} rows={3} />
                        </Field>
                    </div>

                    {/* Restrições + Opcionais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Restrições">
                            <Textarea value={data.restricoes} onChange={e => set('restricoes', e.target.value)} rows={3} />
                        </Field>
                        <Field label="Opcionais Disponíveis">
                            <Textarea value={data.opcionais} onChange={e => set('opcionais', e.target.value)} rows={3} />
                        </Field>
                    </div>

                    {/* Variantes + Moeda + Tags */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Variantes">
                            <Input value={data.variantes} onChange={e => set('variantes', e.target.value)} />
                        </Field>
                        <Field label="Moeda">
                            <Input value={data.moeda} onChange={e => set('moeda', e.target.value)} />
                        </Field>
                        <Field label="Tags">
                            <Input value={data.tags} onChange={e => set('tags', e.target.value)} placeholder="Separar por vírgula" />
                        </Field>
                    </div>

                    {/* Status Operativo + Status Intranet */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Status Operativo">
                            <select
                                value={data.statusOperativo}
                                onChange={e => set('statusOperativo', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                            >
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                                <option value="Suspenso">Suspenso</option>
                            </select>
                        </Field>
                        <Field label="Status Intranet">
                            <select
                                value={data.statusIntranet}
                                onChange={e => set('statusIntranet', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                            >
                                <option value="Visível">Visível</option>
                                <option value="Oculto">Oculto</option>
                            </select>
                        </Field>
                    </div>
                </div>
            </section>

            {/* ─── BLOCO 2 — Preços e Regras Comerciais ─── */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Preços e Regras Comerciais</h2>
                </div>
                <div className="p-6 space-y-5">
                    {/* Verão 2026 */}
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-3">Verão 2026</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field label="VER26 Adulto">
                                <Input type="text" value={data.ver26Adu} onChange={e => set('ver26Adu', e.target.value)} placeholder="0.00" />
                            </Field>
                            <Field label="VER26 Criança">
                                <Input type="text" value={data.ver26Chd} onChange={e => set('ver26Chd', e.target.value)} placeholder="0.00" />
                            </Field>
                            <Field label="VER26 Infante">
                                <Input type="text" value={data.ver26Inf} onChange={e => set('ver26Inf', e.target.value)} placeholder="0.00" />
                            </Field>
                        </div>
                    </div>

                    {/* Inverno 2026 */}
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-3">Inverno 2026</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field label="INV26 Adulto">
                                <Input type="text" value={data.inv26Adu} onChange={e => set('inv26Adu', e.target.value)} placeholder="0.00" />
                            </Field>
                            <Field label="INV26 Criança">
                                <Input type="text" value={data.inv26Chd} onChange={e => set('inv26Chd', e.target.value)} placeholder="0.00" />
                            </Field>
                            <Field label="INV26 Infante">
                                <Input type="text" value={data.inv26Inf} onChange={e => set('inv26Inf', e.target.value)} placeholder="0.00" />
                            </Field>
                        </div>
                    </div>

                    {/* Regras Comerciais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Dias Elegíveis">
                            <Input value={data.diasElegiveis} onChange={e => set('diasElegiveis', e.target.value)} placeholder="Ex: Seg, Qua, Sex" />
                        </Field>
                        <Field label="Valor Neto">
                            <Input type="text" value={data.valorNeto} onChange={e => set('valorNeto', e.target.value)} placeholder="0.00" />
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Valor Extra">
                            <Input type="text" value={data.valorExtra} onChange={e => set('valorExtra', e.target.value)} placeholder="0.00" />
                        </Field>
                        <Field label="Taxas Extras">
                            <Input type="text" value={data.taxasExtras} onChange={e => set('taxasExtras', e.target.value)} placeholder="0.00" />
                        </Field>
                        <Field label="Preço Convertido">
                            <Input type="text" value={data.precoConvertido} onChange={e => set('precoConvertido', e.target.value)} placeholder="0.00" />
                        </Field>
                    </div>
                </div>
            </section>

            {/* ─── BLOCO 3 — Campos do E-commerce ─── */}
            <section className="bg-white rounded-xl border border-purple-200 shadow-sm">
                <div className="px-6 py-4 border-b border-purple-100 flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-800">Campos do E-commerce</h2>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1">
                        <ShoppingCart className="h-3 w-3" /> E-commerce
                    </Badge>
                </div>
                <div className="p-6 space-y-5">
                    {/* IDs e Identificação */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Product ID">
                            <Input value={data.productId} onChange={e => set('productId', e.target.value)} />
                        </Field>
                        <Field label="Handle (slug)">
                            <Input value={data.handle} onChange={e => set('handle', e.target.value)} placeholder="ex: tour-vulcao" />
                        </Field>
                        <Field label="Status no E-commerce">
                            <select
                                value={data.status}
                                onChange={e => set('status', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </Field>
                    </div>

                    {/* Vendor, Tipo, Imagem */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Vendor">
                            <Input value={data.vendor} onChange={e => set('vendor', e.target.value)} />
                        </Field>
                        <Field label="Tipo de Produto">
                            <Input value={data.productType} onChange={e => set('productType', e.target.value)} />
                        </Field>
                        <Field label="Imagem Principal (URL)">
                            <Input value={data.featuredImage} onChange={e => set('featuredImage', e.target.value)} placeholder="https://..." />
                        </Field>
                    </div>

                    {/* Preços e-commerce */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Preço">
                            <Input type="text" value={data.price} onChange={e => set('price', e.target.value)} placeholder="0.00" className={errors.price ? 'border-red-300' : ''} />
                            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                        </Field>
                        <Field label="Preço Comparativo">
                            <Input type="text" value={data.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} placeholder="0.00" />
                        </Field>
                    </div>

                    {/* Estoque */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Quantidade em Estoque">
                            <Input type="text" value={data.inventoryQuantity} onChange={e => set('inventoryQuantity', e.target.value)} placeholder="0" className={errors.inventoryQuantity ? 'border-red-300' : ''} />
                            {errors.inventoryQuantity && <p className="text-xs text-red-500">{errors.inventoryQuantity}</p>}
                        </Field>
                        <Field label="Política de Estoque">
                            <select
                                value={data.inventoryPolicy}
                                onChange={e => set('inventoryPolicy', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                            >
                                <option value="deny">Deny</option>
                                <option value="continue">Continue</option>
                            </select>
                        </Field>
                        <Field label="Alt Text da Imagem">
                            <Input value={data.imageAltText} onChange={e => set('imageAltText', e.target.value)} />
                        </Field>
                    </div>

                    {/* Booleanos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                checked={data.requiresShipping}
                                onChange={e => set('requiresShipping', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                                id="requiresShipping"
                            />
                            <Label htmlFor="requiresShipping" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Requer Envio Físico?
                            </Label>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <input
                                type="checkbox"
                                checked={data.taxable}
                                onChange={e => set('taxable', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                                id="taxable"
                            />
                            <Label htmlFor="taxable" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Tributável?
                            </Label>
                        </div>
                    </div>

                    {/* Opções JSON */}
                    <Field label="Opções (JSON)">
                        <Textarea value={data.options} onChange={e => set('options', e.target.value)} rows={3} placeholder='[{"name": "Tamanho", "values": ["P","M","G"]}]' />
                    </Field>

                    {/* IDs técnicos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Admin GraphQL API ID">
                            <Input value={data.adminGraphqlApiId} onChange={e => set('adminGraphqlApiId', e.target.value)} />
                        </Field>
                        <Field label="Inventory Item ID">
                            <Input value={data.inventoryItemId} onChange={e => set('inventoryItemId', e.target.value)} />
                        </Field>
                    </div>

                    {/* Publicação e contadores */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Publicado em">
                            <Input type="datetime-local" value={data.publishedAt} onChange={e => set('publishedAt', e.target.value)} />
                        </Field>
                        <Field label="N.º de Variantes">
                            <Input type="text" value={data.variantsCount} onChange={e => set('variantsCount', e.target.value)} disabled className="bg-gray-50" />
                        </Field>
                        <Field label="N.º de Imagens">
                            <Input type="text" value={data.imagesCount} onChange={e => set('imagesCount', e.target.value)} disabled className="bg-gray-50" />
                        </Field>
                    </div>
                </div>
            </section>
        </div>
    );
}
