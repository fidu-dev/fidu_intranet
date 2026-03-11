'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { X } from 'lucide-react';
import { ManageableSelect, ManageableChipSelect } from './ManageableSelect';
import { FormField } from './passeio-form/FormField';
import { PricingTable } from './passeio-form/PricingTable';
import { EcommerceSection } from './passeio-form/EcommerceSection';
import { TagsCombobox } from './passeio-form/TagsCombobox';
import { SectionAnchorNav } from './passeio-form/SectionAnchorNav';
import { ImageGallery, TourImageItem } from './passeio-form/ImageGallery';

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
    tourId?: string;
    images?: TourImageItem[];
    onImagesChanged?: () => void;
}

// ── DaysSelect ──

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

// ── Formulário principal ──

export function PasseioForm({ data, onChange, errors = {}, options, seasons, onOptionsChanged, tourId, images = [], onImagesChanged }: PasseioFormProps) {
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
        <div className="flex gap-6">
            {/* Left: Anchor Navigation */}
            <div className="hidden lg:block w-48 shrink-0">
                <SectionAnchorNav />
            </div>

            {/* Right: Form Content */}
            <div className="flex-1 min-w-0 space-y-6">

                {/* ─── SEÇÃO 1 — Dados Gerais ─── */}
                <Card id="dados-gerais" className="shadow-sm">
                    <CardHeader className="border-b border-gray-100 py-4">
                        <CardTitle className="text-lg font-semibold text-gray-800">Dados Gerais</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        {/* Título */}
                        <FormField label="Título do Passeio" required error={errors.title}>
                            <Input
                                value={data.title}
                                onChange={e => set('title', e.target.value)}
                                placeholder="Ex: Tour Vulcão Villarrica"
                                className={errors.title ? 'border-red-300' : ''}
                            />
                        </FormField>

                        {/* Imagens */}
                        <ImageGallery
                            tourId={tourId}
                            images={images}
                            onImagesChanged={onImagesChanged || (() => {})}
                        />

                        {/* Destino + Categoria + Operador */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        </div>

                        {/* Temporada + Moeda */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ManageableSelect
                                label="Temporada"
                                group="temporada"
                                value={data.temporada}
                                onChange={val => set('temporada', val)}
                                options={options.temporada || []}
                                onOptionsChanged={onOptionsChanged}
                            />
                            <ManageableSelect
                                label="Moeda"
                                group="moeda"
                                value={data.moeda}
                                onChange={val => set('moeda', val)}
                                options={options.moeda || []}
                                onOptionsChanged={onOptionsChanged}
                            />
                        </div>

                        {/* Pick up + Retorno */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Pick up">
                                <Input value={data.pickup} onChange={e => set('pickup', e.target.value)} placeholder="HH:MM ou local" />
                            </FormField>
                            <FormField label="Retorno">
                                <Input value={data.retorno} onChange={e => set('retorno', e.target.value)} />
                            </FormField>
                        </div>

                        {/* Duração (ManageableChipSelect) */}
                        <ManageableChipSelect
                            label="Duração"
                            group="duracao"
                            value={data.duracao}
                            onChange={val => set('duracao', val)}
                            options={options.duracao || []}
                            onOptionsChanged={onOptionsChanged}
                        />

                        {/* Descrição */}
                        <FormField label="Descrição do Passeio" required error={errors.description}>
                            <Textarea
                                value={data.description}
                                onChange={e => set('description', e.target.value)}
                                rows={4}
                                placeholder="Descreva o passeio..."
                                className={errors.description ? 'border-red-300' : ''}
                            />
                        </FormField>

                        {/* Observações */}
                        <FormField label="Observações">
                            <Textarea value={data.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3} />
                        </FormField>

                        {/* O que levar + Restrições (ManageableChipSelect) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ManageableChipSelect
                                label="O que Levar"
                                group="oqueLevar"
                                value={data.oQueLevar}
                                onChange={val => set('oQueLevar', val)}
                                options={options.oqueLevar || []}
                                onOptionsChanged={onOptionsChanged}
                            />
                            <ManageableChipSelect
                                label="Restrições"
                                group="restricao"
                                value={data.restricoes}
                                onChange={val => set('restricoes', val)}
                                options={options.restricao || []}
                                onOptionsChanged={onOptionsChanged}
                            />
                        </div>

                        {/* Tags */}
                        <TagsCombobox
                            value={data.tags}
                            onChange={val => set('tags', val)}
                            options={options.tag || []}
                            onOptionsChanged={onOptionsChanged}
                        />

                        {/* Opcionais + Variantes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Opcionais Disponíveis">
                                <Textarea value={data.opcionais} onChange={e => set('opcionais', e.target.value)} rows={3} />
                            </FormField>
                            <FormField label="Variantes">
                                <Input value={data.variantes} onChange={e => set('variantes', e.target.value)} />
                            </FormField>
                        </div>
                    </CardContent>
                </Card>

                {/* ─── SEÇÃO 2 — Preços ─── */}
                <Card id="precos" className="shadow-sm">
                    <CardHeader className="border-b border-gray-100 py-4">
                        <CardTitle className="text-lg font-semibold text-gray-800">Preços e Regras Comerciais</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <PricingTable
                            seasons={seasons}
                            prices={data.prices}
                            onPriceChange={setSeasonPrice}
                        />

                        {/* Dias Elegíveis */}
                        <DaysSelect
                            value={data.diasElegiveis}
                            onChange={val => set('diasElegiveis', val)}
                        />

                        {/* Regras Comerciais */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField label="Valor Neto" tooltip="Valor líquido após comissões">
                                <Input type="text" value={data.valorNeto} onChange={e => set('valorNeto', e.target.value)} placeholder="0.00" />
                            </FormField>
                            <FormField label="Valor Extra" tooltip="Custos adicionais não inclusos no preço base">
                                <Input type="text" value={data.valorExtra} onChange={e => set('valorExtra', e.target.value)} placeholder="0.00" />
                            </FormField>
                            <FormField label="Taxas Extras" tooltip="Taxas adicionais (ex: entrada em parques)">
                                <Input type="text" value={data.taxasExtras} onChange={e => set('taxasExtras', e.target.value)} placeholder="0.00" />
                            </FormField>
                        </div>
                    </CardContent>
                </Card>

                {/* ─── SEÇÃO 3 — E-commerce (Colapsável) ─── */}
                <div id="ecommerce">
                    <EcommerceSection
                        data={data}
                        set={(field, value) => set(field as keyof PasseioFormData, value)}
                        errors={errors}
                    />
                </div>

            </div>
        </div>
    );
}
