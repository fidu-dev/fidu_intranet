'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { createReservationAction, getAgencyProducts } from '@/app/actions';
import { AgencyInfo } from '@/app/actions';
import {
    Calendar,
    User,
    CheckCircle2,
    Loader2,
    ArrowLeft,
    ShoppingCart,
    ClipboardList,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ReservasPage() {
    const router = useRouter();
    const { selectedProducts, removeFromCart, clearCart, updatePax } = useCart();
    const [agencyInfo, setAgencyInfo] = useState<AgencyInfo | null>(null);
    const [loading, setLoading] = useState(true);

    // Form fields
    const [clientName, setClientName] = useState('');
    const [tourDate, setTourDate] = useState('');
    const [paxNames, setPaxNames] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadAgency() {
            const { agency } = await getAgencyProducts();
            if (agency) {
                if (!agency.canReserve) {
                    router.push('/portal');
                    return;
                }
                setAgencyInfo(agency as any);
            }
            setLoading(false);
        }
        loadAgency();
    }, [router]);

    const commissionRate = agencyInfo?.commissionRate || 0;

    const totals = useMemo(() => {
        if (selectedProducts.length === 0) return { total: 0, commission: 0 };

        let total = 0;
        selectedProducts.forEach(product => {
            total += (product.adults * product.salePriceAdulto) +
                (product.children * product.salePriceMenor) +
                (product.infants * product.salePriceBebe);
        });

        const commission = total * commissionRate;

        return { total, commission };
    }, [selectedProducts, commissionRate]);

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleCreateReservation = async () => {
        if (selectedProducts.length === 0 || !clientName || !tourDate) {
            alert('Preencha os campos obrigatórios (Passeios, Nome e Data)');
            return;
        }

        setIsSubmitting(true);
        try {
            const details = selectedProducts.map(p => {
                const paxStr = `${p.adults} ADU${p.children > 0 ? `, ${p.children} CHD` : ''}${p.infants > 0 ? `, ${p.infants} INF` : ''}`;
                return `${p.tourName} (${paxStr})`;
            }).join(' | ');

            const mainDestination = selectedProducts[0].destination;

            const result = await createReservationAction({
                productName: details,
                destination: mainDestination,
                date: tourDate,
                adults: selectedProducts.reduce((sum, p) => sum + p.adults, 0),
                children: selectedProducts.reduce((sum, p) => sum + p.children, 0),
                infants: selectedProducts.reduce((sum, p) => sum + p.infants, 0),
                paxNames: `${clientName}${paxNames ? `\n\nOutros: ${paxNames}` : ''}`,
                totalAmount: totals.total,
                commissionAmount: totals.commission
            });

            if (result.success) {
                alert('Solicitação de reserva enviada com sucesso!');
                clearCart();
                router.push('/portal');
            } else {
                alert(result.error || 'Erro ao criar reserva');
            }
        } catch (error) {
            alert('Falha na comunicação com o servidor');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <main className="container mx-auto px-6 py-10 animate-in fade-in duration-500">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4 -ml-2 text-gray-400 hover:text-blue-600"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#3b5998' }}>Finalizar Reserva</h1>
                    <p className="text-gray-500 text-lg">
                        Revise os itens e preencha os dados do cliente para processar a reserva.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Form */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Dados da Reserva</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Cliente Principal *</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                        <Input
                                            placeholder="Ex: João da Silva"
                                            className="pl-12 h-14 border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-blue-500 transition-all text-base"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Data de Início *</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                                        <Input
                                            type="date"
                                            className="pl-12 h-14 border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-blue-500 transition-all text-base"
                                            value={tourDate}
                                            onChange={(e) => setTourDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Passageiros e Observações</Label>
                                <Textarea
                                    placeholder="Liste o nome completo dos demais passageiros e quaisquer requisitos especiais..."
                                    className="min-h-[150px] border-gray-100 bg-gray-50/30 rounded-2xl focus:ring-blue-500 transition-all text-base p-4"
                                    value={paxNames}
                                    onChange={(e) => setPaxNames(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-10 border-t border-gray-100 mt-10">
                            <Button
                                className="w-full h-16 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
                                onClick={handleCreateReservation}
                                disabled={isSubmitting || selectedProducts.length === 0}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-6 w-6 animate-spin mr-3" />
                                ) : (
                                    <CheckCircle2 className="h-6 w-6 mr-3" />
                                )}
                                Confirmar Solicitação de Reserva
                            </Button>
                            <p className="text-center text-sm text-gray-400 mt-6 max-w-sm mx-auto leading-relaxed">
                                Ao confirmar, nossa central será notificada e entrará em contato para finalização.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Items Summary */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2.5 rounded-xl text-blue-600 shadow-sm">
                                    <ShoppingCart className="h-5 w-5" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Resumo da Cesta</h2>
                            </div>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                {selectedProducts.length} itens
                            </span>
                        </div>

                        <div className="space-y-4 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedProducts.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 italic">
                                    Nenhum passeio selecionado.
                                </div>
                            ) : (
                                selectedProducts.map((p) => (
                                    <div key={p.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 leading-tight">{p.tourName}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{p.destination}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-300 hover:text-red-500 -mt-1 -mr-2"
                                                onClick={() => removeFromCart(p.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 border-t border-gray-50 pt-4">
                                            <div className="text-center">
                                                <Label className="text-[9px] text-gray-400 uppercase mb-1 block">Adu</Label>
                                                <Input
                                                    type="number"
                                                    value={p.adults}
                                                    onChange={(e) => updatePax(p.id, 'adults', Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="h-8 text-xs text-center border-none bg-gray-50 focus:ring-1 focus:ring-blue-100 rounded-lg p-0"
                                                />
                                            </div>
                                            <div className="text-center">
                                                <Label className="text-[9px] text-gray-400 uppercase mb-1 block">Chd</Label>
                                                <Input
                                                    type="number"
                                                    value={p.children}
                                                    onChange={(e) => updatePax(p.id, 'children', Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="h-8 text-xs text-center border-none bg-gray-50 focus:ring-1 focus:ring-blue-100 rounded-lg p-0"
                                                />
                                            </div>
                                            <div className="text-center">
                                                <Label className="text-[9px] text-gray-400 uppercase mb-1 block">Inf</Label>
                                                <Input
                                                    type="number"
                                                    value={p.infants}
                                                    onChange={(e) => updatePax(p.id, 'infants', Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="h-8 text-xs text-center border-none bg-gray-50 focus:ring-1 focus:ring-blue-100 rounded-lg p-0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="space-y-4 pt-8 border-t border-gray-200/60">
                            <div className="flex justify-between items-center text-gray-500 text-sm font-medium">
                                <span>Subtotal Sugerido</span>
                                <span className="font-bold text-gray-900">{formatPrice(totals.total)}</span>
                            </div>

                            {!agencyInfo?.isInternal && (
                                <div className="flex justify-between items-center bg-blue-600/5 p-4 rounded-2xl border border-blue-600/10">
                                    <div className="flex flex-col">
                                        <span className="text-blue-600 text-[10px] uppercase font-black tracking-widest">Sua Comissão</span>
                                        <span className="text-blue-400 text-[9px] font-medium leading-tight">{(commissionRate * 100).toFixed(0)}% de rentabilidade</span>
                                    </div>
                                    <span className="text-xl font-bold text-blue-600 font-mono tracking-tight">{formatPrice(totals.commission)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-base font-bold text-gray-900">Total à Pagar (NETO)</span>
                                <span className="text-2xl font-black text-gray-900 tracking-tight">
                                    {formatPrice(totals.total - totals.commission)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
