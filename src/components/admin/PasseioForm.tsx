'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ShoppingCart, X, Plus, Settings2 } from 'lucide-react';
import { ManageableSelect, ManageableChipSelect } from './ManageableSelect';
import { createSeason, getSeasons as fetchSeasons } from '@/app/admin/actions';
import { useState } from 'react';

// ── Constantes locais (dias não precisam de gerenciamento DB) ──

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DIAS_ESPECIAIS = ['Diário', 'Consultar'];

// ── Tipos ──

export interface SeasonPriceData {
    adu: string;
    chd: string;
    inf: string;
}

export interface SeasonInfo {
    id: string;
    code: string;
    label: string;
}

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
    // Bloco 2 — Preços dinâmicos + Regras Comerciais
    prices: Record<string, SeasonPriceData>;
    // Campos legados (mantidos para compat com Airtable)
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
    // Bloco 3 — E-commerce
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
    prices: {},
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
    options: Record<string, string[]>;
    seasons: SeasonInfo[];
    onOptionsChanged: () => void;
    onSeasonsChanged: () => void;
}

// ── Componentes auxiliares ──

const selectClass = "flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950";

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

function DaysSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
    const isSpecial = DIAS_ESPECIAIS.includes(value.trim());

    const toggleDay = (day: string) => {
        if (isSpecial) { onChange(day); return; }
        const next = selected.includes(day)
            ? selected.filter(s => s !== day)
            : [...selected, day];
        onChange(next.join(', '));
    };

    const setSpecial = (val: string) => {
        onChange(val === value.trim() ? '' : val);
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Dias Elegíveis</Label>
                {value && (
                    <button type="button" onClick={() => onChange('')} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                        <X className="h-3 w-3" /> Limpar
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {DIAS_ESPECIAIS.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => setSpecial(opt)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                            value.trim() === opt
                                ? 'bg-green-50 text-green-700 border-green-300'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        {opt}
                    </button>
                ))}
                <span className="text-gray-300 self-center">|</span>
                {DIAS_SEMANA.map(day => {
                    const active = !isSpecial && selected.includes(day);
                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                                active
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : isSpecial
                                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}
                            disabled={isSpecial}
                        >
                            {day.slice(0, 3)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function AddSeasonDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!code.trim() || !label.trim()) return;
        setSaving(true);
        setError('');
        const result = await createSeason(code.trim().toUpperCase(), label.trim());
        if (result.success) {
            setCode('');
            setLabel('');
            setOpen(false);
            onCreated();
        } else {
            setError(result.error || 'Erro ao criar temporada');
        }
        setSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                    <Plus className="h-3 w-3" /> Nova Temporada
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Nova Temporada de Preços</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <Field label="Código">
                        <Input
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder="Ex: VER27, INV27"
                        />
                    </Field>
                    <Field label="Nome">
                        <Input
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            placeholder="Ex: Verão 2027"
                        />
                    </Field>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="button" size="sm" onClick={handleCreate} disabled={saving || !code.trim() || !label.trim()}>
                            Criar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Formulário principal ──

export function PasseioForm({ data, onChange, errors = {}, options, seasons, onOptionsChanged, onSeasonsChanged }: PasseioFormProps) {
    const set = (field: keyof PasseioFormData, value: string | boolean) => {
        onChange({ ...data, [field]: value });
    };

    const setSeasonPrice = (seasonCode: string, field: keyof SeasonPriceData, value: string) => {
        const current = data.prices[seasonCode] || { adu: '', chd: '', inf: '' };
        const updated = { ...current, [field]: value };
        onChange({
            ...data,
            prices: { ...data.prices, [seasonCode]: updated },
        });
    };

    return (
        <div className="space-y-8">
            {/* ─── BLOCO 1 — Dados Principais ─── */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Dados Principais</h2>
                </div>
                <div className="p-6 space-y-5">
                    {/* Linha 1: Título + Toggles */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                            <div className="flex-1">
                                <Field label="Título do Passeio" required>
                                    <Input
                                        value={data.title}
                                        onChange={e => set('title', e.target.value)}
                                        placeholder="Ex: Tour Vulcão Villarrica"
                                        className={errors.title ? 'border-red-300' : ''}
                                    />
                                    {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                                </Field>
                            </div>
                            <div className="flex items-center gap-3 pb-0.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = data.statusOperativo === 'Ativo' ? 'Inativo' : data.statusOperativo === 'Inativo' ? 'Suspenso' : 'Ativo';
                                        set('statusOperativo', next);
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                                        data.statusOperativo === 'Ativo'
                                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                                            : data.statusOperativo === 'Suspenso'
                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                                            : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                                    }`}
                                    title="Clique para alternar o status operativo"
                                >
                                    <span className={`h-2 w-2 rounded-full ${
                                        data.statusOperativo === 'Ativo' ? 'bg-green-500' : data.statusOperativo === 'Suspenso' ? 'bg-yellow-500' : 'bg-gray-400'
                                    }`} />
                                    {data.statusOperativo || 'Ativo'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => set('statusIntranet', data.statusIntranet === 'Visível' ? 'Oculto' : 'Visível')}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                                        data.statusIntranet === 'Visível'
                                            ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                            : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                                    }`}
                                    title="Clique para alternar visibilidade na intranet"
                                >
                                    <span className={`h-2 w-2 rounded-full ${
                                        data.statusIntranet === 'Visível' ? 'bg-blue-500' : 'bg-gray-400'
                                    }`} />
                                    Intranet: {data.statusIntranet || 'Visível'}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ManageableSelect
                                label="Destino"
                                group="destino"
                                value={data.destino}
                                onChange={val => set('destino', val)}
                                options={options.destino || []}
                                onOptionsChanged={onOptionsChanged}
                                required
                                error={errors.destino}
                            />
                        </div>
                    </div>

                    {/* Linha 2: Categoria + Operador + Temporada */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ManageableSelect
                            label="Categoria"
                            group="categoria"
                            value={data.categoria}
                            onChange={val => set('categoria', val)}
                            options={options.categoria || []}
                            onOptionsChanged={onOptionsChanged}
                        />
                        <ManageableSelect
                            label="Operador"
                            group="operador"
                            value={data.operador}
                            onChange={val => set('operador', val)}
                            options={options.operador || []}
                            onOptionsChanged={onOptionsChanged}
                        />
                        <ManageableSelect
                            label="Temporada"
                            group="temporada"
                            value={data.temporada}
                            onChange={val => set('temporada', val)}
                            options={options.temporada || []}
                            onOptionsChanged={onOptionsChanged}
                        />
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

                    {/* Variantes + Moeda */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Variantes">
                            <Input value={data.variantes} onChange={e => set('variantes', e.target.value)} />
                        </Field>
                        <ManageableSelect
                            label="Moeda"
                            group="moeda"
                            value={data.moeda}
                            onChange={val => set('moeda', val)}
                            options={options.moeda || []}
                            onOptionsChanged={onOptionsChanged}
                        />
                    </div>

                    {/* Tags — multi-select chips com gerenciamento */}
                    <ManageableChipSelect
                        label="Tags"
                        group="tag"
                        value={data.tags}
                        onChange={val => set('tags', val)}
                        options={options.tag || []}
                        onOptionsChanged={onOptionsChanged}
                    />

                </div>
            </section>

            {/* ─── BLOCO 2 — Preços e Regras Comerciais ─── */}
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Preços e Regras Comerciais</h2>
                    <AddSeasonDialog onCreated={onSeasonsChanged} />
                </div>
                <div className="p-6 space-y-5">
                    {/* Temporadas dinâmicas */}
                    {seasons.map(season => {
                        const sp = data.prices[season.code] || { adu: '', chd: '', inf: '' };
                        return (
                            <div key={season.id}>
                                <p className="text-sm font-medium text-gray-500 mb-3">{season.label}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Field label={`${season.code} Adulto`}>
                                        <Input
                                            type="text"
                                            value={sp.adu}
                                            onChange={e => setSeasonPrice(season.code, 'adu', e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </Field>
                                    <Field label={`${season.code} Criança`}>
                                        <Input
                                            type="text"
                                            value={sp.chd}
                                            onChange={e => setSeasonPrice(season.code, 'chd', e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </Field>
                                    <Field label={`${season.code} Infante`}>
                                        <Input
                                            type="text"
                                            value={sp.inf}
                                            onChange={e => setSeasonPrice(season.code, 'inf', e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </Field>
                                </div>
                            </div>
                        );
                    })}

                    {seasons.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">
                            Nenhuma temporada cadastrada. Use &quot;Nova Temporada&quot; para adicionar.
                        </p>
                    )}

                    {/* Dias Elegíveis + Regras Comerciais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <DaysSelect
                            value={data.diasElegiveis}
                            onChange={val => set('diasElegiveis', val)}
                        />
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
                                className={selectClass}
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </Field>
                    </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Preço">
                            <Input type="text" value={data.price} onChange={e => set('price', e.target.value)} placeholder="0.00" className={errors.price ? 'border-red-300' : ''} />
                            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                        </Field>
                        <Field label="Preço Comparativo">
                            <Input type="text" value={data.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} placeholder="0.00" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Quantidade em Estoque">
                            <Input type="text" value={data.inventoryQuantity} onChange={e => set('inventoryQuantity', e.target.value)} placeholder="0" className={errors.inventoryQuantity ? 'border-red-300' : ''} />
                            {errors.inventoryQuantity && <p className="text-xs text-red-500">{errors.inventoryQuantity}</p>}
                        </Field>
                        <Field label="Política de Estoque">
                            <select
                                value={data.inventoryPolicy}
                                onChange={e => set('inventoryPolicy', e.target.value)}
                                className={selectClass}
                            >
                                <option value="deny">Deny</option>
                                <option value="continue">Continue</option>
                            </select>
                        </Field>
                        <Field label="Alt Text da Imagem">
                            <Input value={data.imageAltText} onChange={e => set('imageAltText', e.target.value)} />
                        </Field>
                    </div>

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

                    <Field label="Opções (JSON)">
                        <Textarea value={data.options} onChange={e => set('options', e.target.value)} rows={3} placeholder='[{"name": "Tamanho", "values": ["P","M","G"]}]' />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Admin GraphQL API ID">
                            <Input value={data.adminGraphqlApiId} onChange={e => set('adminGraphqlApiId', e.target.value)} />
                        </Field>
                        <Field label="Inventory Item ID">
                            <Input value={data.inventoryItemId} onChange={e => set('inventoryItemId', e.target.value)} />
                        </Field>
                    </div>

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
