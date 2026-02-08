'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AgencyProduct, Reservation } from '@/lib/airtable/types';
import { AgencyInfo } from '@/app/actions';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, MessageCircle, Calendar, User, CheckCircle2, Copy, Loader2, ArrowRight, Trash2, Plus, ShoppingCart, Users } from 'lucide-react';
import { useCart } from './CartContext';
import { calculateCartTotals, formatCurrency } from '@/lib/calculations';

interface SalesSimulatorProps {
    isOpen: boolean;
    onClose: () => void;
    agencyInfo?: AgencyInfo;
}

export function SalesSimulator({ isOpen, onClose, agencyInfo }: SalesSimulatorProps) {
    const router = useRouter();
    const { selectedProducts, removeFromCart, updatePax } = useCart();

    const commissionRate = agencyInfo?.commissionRate || 0;

    const totals = useMemo(() => calculateCartTotals(selectedProducts, commissionRate), [selectedProducts, commissionRate]);

    const handleCopySummary = () => {
        if (selectedProducts.length === 0) return;

        let productsList = selectedProducts.map((p, i) => {
            const paxStr = `${p.adults} Adulto${p.children > 0 ? `, ${p.children} Menor` : ''}${p.infants > 0 ? `, ${p.infants} Bebê` : ''}`;
            return `${i + 1}. ${p.tourName} [${paxStr}]`;
        }).join('\n');

        const summary = `*Resumo da Experiência - Fidu Viagens*\n\n` +
            `*Passeios Selecionados:*\n${productsList}\n\n` +
            `*Valor Total Consolidado:* ${formatCurrency(totals.total)}\n\n` +
            `_Reservas sujeitas a disponibilidade._`;

        navigator.clipboard.writeText(summary);
        alert('Resumo copiado para o WhatsApp!');
    };

    const handleProceedToReserve = () => {
        onClose();
        router.push('/portal/reservas');
    };

    if (!isOpen) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto px-8 focus:outline-none">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-[#3b5998] flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Simulador de Experiências
                    </SheetTitle>
                    <SheetDescription>
                        {selectedProducts.length === 0
                            ? 'Selecione passeios no tarifário para simular'
                            : `${selectedProducts.length} item(s) em sua solicitação de reserva`}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Selected Products List */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Itens e Quantidades</Label>
                        {selectedProducts.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm">
                                Nenhum passeio adicionado.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedProducts.map((p) => (
                                    <div key={p.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4 group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 leading-tight">{p.tourName}</span>
                                                <span className="text-[10px] text-gray-500 uppercase font-medium">{p.destination}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all focus:outline-none"
                                                onClick={() => removeFromCart(p.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* PAX Selectors for this specific product */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-gray-400 uppercase">Adulto</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={p.adults}
                                                    onChange={(e) => updatePax(p.id, 'adults', parseInt(e.target.value) || 0)}
                                                    className="h-8 text-xs border-gray-100 bg-gray-50/50"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-gray-400 uppercase">Menor</Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={p.children}
                                                    onChange={(e) => updatePax(p.id, 'children', parseInt(e.target.value) || 0)}
                                                    className="h-8 text-xs border-gray-100 bg-gray-50/50"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] text-gray-400 uppercase">Bebê</Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={p.infants}
                                                    onChange={(e) => updatePax(p.id, 'infants', parseInt(e.target.value) || 0)}
                                                    className="h-8 text-xs border-gray-100 bg-gray-50/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Calculation Summary */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 space-y-5">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm font-medium">Total Consolidado</span>
                            <span className="text-xl font-bold text-gray-900">{formatCurrency(totals.total)}</span>
                        </div>

                        {!agencyInfo?.isInternal && (
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Comissão Total</span>
                                    <span className="text-blue-600 text-[10px] font-medium">Base: {(commissionRate * 100).toFixed(0)}%</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600 font-mono">{formatCurrency(totals.commission)}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-6">
                        <Button
                            variant="outline"
                            className="w-full h-12 gap-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all font-bold"
                            onClick={handleCopySummary}
                            disabled={selectedProducts.length === 0}
                        >
                            <MessageCircle className="h-4 w-4" />
                            Copiar Orçamento WhatsApp
                        </Button>

                        {agencyInfo?.canReserve && (
                            <Button
                                className="w-full h-12 gap-2 bg-[#3b5998] hover:bg-[#2d4373] text-white font-bold"
                                onClick={handleProceedToReserve}
                                disabled={selectedProducts.length === 0}
                            >
                                Prosseguir com Solicitação
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
