'use client';

import { useState, useMemo } from 'react';
import { AgencyProduct, Reservation } from '@/lib/airtable/types';
import { AgencyInfo, createReservationAction } from '@/app/actions';
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
import { Textarea } from '@/components/ui/textarea';
import { Calculator, MessageCircle, Calendar, User, CheckCircle2, Copy, Loader2, ArrowRight, Trash2, Plus, ShoppingCart } from 'lucide-react';

interface SalesSimulatorProps {
    selectedProducts: AgencyProduct[];
    onRemoveProduct: (productId: string) => void;
    isOpen: boolean;
    onClose: () => void;
    agencyInfo?: AgencyInfo;
}

export function SalesSimulator({ selectedProducts, onRemoveProduct, isOpen, onClose, agencyInfo }: SalesSimulatorProps) {
    const [step, setStep] = useState<'simulate' | 'reserve'>('simulate');
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);

    // Reservation fields
    const [clientName, setClientName] = useState('');
    const [tourDate, setTourDate] = useState('');
    const [paxNames, setPaxNames] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const commissionRate = agencyInfo?.commissionRate || 0;

    const totals = useMemo(() => {
        if (selectedProducts.length === 0) return { total: 0, commission: 0 };

        let total = 0;
        selectedProducts.forEach(product => {
            total += (adults * product.salePriceAdulto) +
                (children * product.salePriceMenor) +
                (infants * product.salePriceBebe);
        });

        const commission = total * commissionRate;

        return { total, commission };
    }, [selectedProducts, adults, children, infants, commissionRate]);

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleCopySummary = () => {
        if (selectedProducts.length === 0) return;

        let productsList = selectedProducts.map((p, i) => `${i + 1}. ${p.tourName} (${p.destination})`).join('\n');

        const summary = `*Resumo da Experiência - Fidu Viagens*\n\n` +
            `*Passeios Selecionados:*\n${productsList}\n\n` +
            `*Passageiros:* ${adults} Adulto(s)${children > 0 ? `, ${children} Criança(s)` : ''}${infants > 0 ? `, ${infants} Bebê(s)` : ''}\n\n` +
            `*Valor Total Consolidado:* ${formatPrice(totals.total)}\n\n` +
            `_Reservas sujeitas a disponibilidade._`;

        navigator.clipboard.writeText(summary);
        alert('Resumo copiado para o WhatsApp!');
    };

    const handleCreateReservation = async () => {
        if (selectedProducts.length === 0 || !clientName || !tourDate) {
            alert('Preencha os campos obrigatórios (Produtos, Nome e Data)');
            return;
        }

        setIsSubmitting(true);
        try {
            // Join all product names for the reservation record
            const productNames = selectedProducts.map(p => p.tourName).join(', ');
            const mainDestination = selectedProducts[0].destination;

            const result = await createReservationAction({
                productName: productNames,
                destination: mainDestination,
                date: tourDate,
                adults,
                children,
                infants,
                paxNames: `${clientName}${paxNames ? `\n\nOutros: ${paxNames}` : ''}`,
                totalAmount: totals.total,
                commissionAmount: totals.commission
            });

            if (result.success) {
                alert('Pré-reserva enviada com sucesso!');
                onClose();
            } else {
                alert(result.error || 'Erro ao criar reserva');
            }
        } catch (error) {
            alert('Falha na comunicação com o servidor');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-[#3b5998] flex items-center gap-2">
                        {step === 'simulate' ? <ShoppingCart className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                        {step === 'simulate' ? 'Simulador Multi-Produtos' : 'Finalizar Pré-reserva'}
                    </SheetTitle>
                    <SheetDescription>
                        {selectedProducts.length === 0
                            ? 'Selecione passeios no tarifário para simular'
                            : `${selectedProducts.length} passeio(s) selecionado(s)`}
                    </SheetDescription>
                </SheetHeader>

                {step === 'simulate' ? (
                    <div className="space-y-6">
                        {/* Selected Products List */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Itens na Simulação</Label>
                            {selectedProducts.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm">
                                    Nenhum passeio adicionado.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedProducts.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm group">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 leading-tight">{p.tourName}</span>
                                                <span className="text-[10px] text-gray-500 uppercase font-medium">{p.destination}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                onClick={() => onRemoveProduct(p.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* PAX Selectors */}
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label>Adultos</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={adults}
                                    onChange={(e) => setAdults(parseInt(e.target.value) || 0)}
                                    className="border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Crianças</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={children}
                                    onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                                    className="border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bebês</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={infants}
                                    onChange={(e) => setInfants(parseInt(e.target.value) || 0)}
                                    className="border-gray-200"
                                />
                            </div>
                        </div>

                        {/* Calculation Summary */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm font-medium">Total do Grupo</span>
                                <span className="text-xl font-bold text-gray-900">{formatPrice(totals.total)}</span>
                            </div>

                            {!agencyInfo?.isInternal && (
                                <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Sua Comissão Total</span>
                                        <span className="text-blue-600 text-[10px] font-medium">Base: {(commissionRate * 100).toFixed(0)}% sobre venda</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-600 font-mono">{formatPrice(totals.commission)}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 pt-2">
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
                                    onClick={() => setStep('reserve')}
                                    disabled={selectedProducts.length === 0}
                                >
                                    Prosseguir para Reserva
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            )}

                            <p className="text-[10px] text-gray-400 text-center italic">
                                Você pode adicionar mais itens clicando no tarifário com este painel aberto.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-4">
                            <p className="text-xs text-blue-700 font-medium">
                                Consolidação: {selectedProducts.length} itens | {adults} ADU, {children} CHD, {infants} INF | Total: {formatPrice(totals.total)}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Nome do Cliente Principal *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Ex: João da Silva"
                                        className="pl-10 h-12 border-gray-200"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Data da Experiência *</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="date"
                                        className="pl-10 h-12 border-gray-200"
                                        value={tourDate}
                                        onChange={(e) => setTourDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Outros Passageiros / Observações</Label>
                                <Textarea
                                    placeholder="Nomes dos demais passageiros ou detalhes específicos de cada passeio..."
                                    className="min-h-[100px] border-gray-200"
                                    value={paxNames}
                                    onChange={(e) => setPaxNames(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-6">
                            <Button
                                className="w-full h-14 text-white font-bold text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                                onClick={handleCreateReservation}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                )}
                                Confirmar Pré-reserva Consolidada
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full text-gray-500"
                                onClick={() => setStep('simulate')}
                                disabled={isSubmitting}
                            >
                                Voltar para o Simulador
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
