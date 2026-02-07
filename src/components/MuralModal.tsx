'use client';

import { MuralItem } from '@/lib/airtable/types';
import { useState, useEffect } from 'react';
import { X, CheckCircle2, Megaphone, Clock, User, MessageCircle } from 'lucide-react';
import { markMuralAsReadAction, fetchMuralReaders } from '@/app/actions';
import { Button } from '@/components/ui/button';

interface MuralModalProps {
    item: MuralItem;
    onClose: () => void;
}

export function MuralModal({ item, onClose }: MuralModalProps) {
    const [isReadingConfirmed, setIsReadingConfirmed] = useState(false);
    const [readers, setReaders] = useState<{ userName: string, timestamp: string }[]>([]);
    const [isLoadingReaders, setIsLoadingReaders] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadReaders();
    }, [item.id]);

    const loadReaders = async () => {
        setIsLoadingReaders(true);
        try {
            const { readers: readersData } = await fetchMuralReaders(item.id);
            setReaders(readersData || []);
        } finally {
            setIsLoadingReaders(false);
        }
    };

    const handleConfirmRead = async () => {
        setIsSubmitting(true);
        try {
            const result = await markMuralAsReadAction(item.id);
            if (result.success) {
                setIsReadingConfirmed(true);
                // toast.success('Leitura confirmada com sucesso!');
                loadReaders();
            } else {
                alert(result.error || 'Erro ao confirmar leitura.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Megaphone className="h-5 w-5 text-[#3b5998]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">{item.title}</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                    <Clock className="h-3 w-3" /> {formatDate(item.date)}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.category === 'Atualização de Valores'
                                    ? 'bg-green-50 text-green-600'
                                    : 'bg-purple-50 text-purple-600'
                                    }`}>
                                    {item.category}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="prose prose-blue max-w-none">
                        <div className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                            {item.details}
                        </div>
                    </div>

                    {/* Status / Confirm Button */}
                    <div className="bg-gray-50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" /> Deixe uma confirmação após a leitura.
                            </span>
                        </div>
                        <Button
                            onClick={handleConfirmRead}
                            disabled={isReadingConfirmed || isSubmitting}
                            className={`rounded-lg px-6 font-bold flex items-center gap-2 transition-all ${isReadingConfirmed
                                ? 'bg-green-500 hover:bg-green-500 cursor-default'
                                : 'bg-[#3b5998] hover:bg-[#2d4373]'
                                }`}
                        >
                            {isReadingConfirmed ? (
                                <><CheckCircle2 className="h-4 w-4" /> Lido</>
                            ) : (
                                isSubmitting ? 'Confirmando...' : 'Confirmar Leitura'
                            )}
                        </Button>
                    </div>

                    {/* Readers Log */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                            <User className="h-4 w-4" /> Lido por:
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {isLoadingReaders ? (
                                <div className="col-span-2 text-center py-4 text-gray-400 text-sm">Carregando lista...</div>
                            ) : readers.length > 0 ? (
                                readers.map((reader, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                        <span className="text-sm font-semibold text-gray-700">{reader.userName}</span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {formatDate(reader.timestamp)} às {formatTime(reader.timestamp)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center py-4 text-gray-400 text-sm italic">Nenhuma leitura confirmada na sua agência ainda.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-blue-600 text-[13px] font-bold">Bons atendimentos e boas vendas a todos! 🚀</p>
                </div>
            </div>
        </div>
    );
}
