'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ShoppingCart, ChevronDown } from 'lucide-react';
import { FormField } from './FormField';

const selectClass = "flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950";

interface EcommerceSectionProps {
    data: any;
    set: (field: string, value: string | boolean) => void;
    errors?: Record<string, string>;
}

export function EcommerceSection({ data, set, errors = {} }: EcommerceSectionProps) {
    const [open, setOpen] = useState(false);

    return (
        <Card className="shadow-sm border-purple-200">
            <Collapsible open={open} onOpenChange={setOpen}>
                <CardHeader className="border-b border-purple-100 py-4">
                    <CollapsibleTrigger asChild>
                        <button type="button" className="flex items-center justify-between w-full text-left">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-lg font-semibold text-gray-800">Campos do E-commerce</CardTitle>
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 gap-1">
                                    <ShoppingCart className="h-3 w-3" /> E-commerce
                                </Badge>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                        </button>
                    </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                    <CardContent className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField label="Product ID">
                                <Input value={data.productId} onChange={e => set('productId', e.target.value)} />
                            </FormField>
                            <FormField label="Handle (slug)">
                                <Input value={data.handle} onChange={e => set('handle', e.target.value)} placeholder="ex: tour-vulcao" />
                            </FormField>
                            <FormField label="Status no E-commerce">
                                <select value={data.status} onChange={e => set('status', e.target.value)} className={selectClass}>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField label="Vendor">
                                <Input value={data.vendor} onChange={e => set('vendor', e.target.value)} />
                            </FormField>
                            <FormField label="Tipo de Produto">
                                <Input value={data.productType} onChange={e => set('productType', e.target.value)} />
                            </FormField>
                            <FormField label="Imagem Principal (URL)">
                                <Input value={data.featuredImage} onChange={e => set('featuredImage', e.target.value)} placeholder="https://..." />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Preço" error={errors.price}>
                                <Input type="text" value={data.price} onChange={e => set('price', e.target.value)} placeholder="0.00" className={errors.price ? 'border-red-300' : ''} />
                            </FormField>
                            <FormField label="Preço Comparativo">
                                <Input type="text" value={data.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value)} placeholder="0.00" />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField label="Quantidade em Estoque" error={errors.inventoryQuantity}>
                                <Input type="text" value={data.inventoryQuantity} onChange={e => set('inventoryQuantity', e.target.value)} placeholder="0" className={errors.inventoryQuantity ? 'border-red-300' : ''} />
                            </FormField>
                            <FormField label="Política de Estoque" tooltip="Deny: não permite venda sem estoque. Continue: permite overselling.">
                                <select value={data.inventoryPolicy} onChange={e => set('inventoryPolicy', e.target.value)} className={selectClass}>
                                    <option value="deny">Deny</option>
                                    <option value="continue">Continue</option>
                                </select>
                            </FormField>
                            <FormField label="Alt Text da Imagem">
                                <Input value={data.imageAltText} onChange={e => set('imageAltText', e.target.value)} />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 pt-2">
                                <input type="checkbox" checked={data.requiresShipping} onChange={e => set('requiresShipping', e.target.checked)} className="h-4 w-4 rounded border-gray-300" id="requiresShipping" />
                                <Label htmlFor="requiresShipping" className="text-sm font-medium text-gray-700 cursor-pointer">Requer Envio Físico?</Label>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input type="checkbox" checked={data.taxable} onChange={e => set('taxable', e.target.checked)} className="h-4 w-4 rounded border-gray-300" id="taxable" />
                                <Label htmlFor="taxable" className="text-sm font-medium text-gray-700 cursor-pointer">Tributável?</Label>
                            </div>
                        </div>

                        <FormField label="Opções (JSON)" tooltip="Formato JSON para variantes do produto no Shopify">
                            <Textarea value={data.options} onChange={e => set('options', e.target.value)} rows={3} placeholder='[{"name": "Tamanho", "values": ["P","M","G"]}]' />
                        </FormField>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Admin GraphQL API ID">
                                <Input value={data.adminGraphqlApiId} onChange={e => set('adminGraphqlApiId', e.target.value)} />
                            </FormField>
                            <FormField label="Inventory Item ID">
                                <Input value={data.inventoryItemId} onChange={e => set('inventoryItemId', e.target.value)} />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField label="Publicado em">
                                <Input type="datetime-local" value={data.publishedAt} onChange={e => set('publishedAt', e.target.value)} />
                            </FormField>
                            <FormField label="N.º de Variantes">
                                <Input type="text" value={data.variantsCount} onChange={e => set('variantsCount', e.target.value)} disabled className="bg-gray-50" />
                            </FormField>
                            <FormField label="N.º de Imagens">
                                <Input type="text" value={data.imagesCount} onChange={e => set('imagesCount', e.target.value)} disabled className="bg-gray-50" />
                            </FormField>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
