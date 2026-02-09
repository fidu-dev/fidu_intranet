'use client';

import { MuralItem } from '@/lib/airtable/types';
import { useState, useEffect } from 'react';
import { X, CheckCircle2, Megaphone, Clock, User, MessageCircle, Paperclip, AlertCircle, MapPin, Calendar, Users, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { confirmNoticeReadAction, fetchMuralReaders } from '@/app/actions';
import { Button } from '@/components/ui/button';

interface MuralModalProps {
    item: MuralItem;
    initiallyRead: boolean;
    isAdmin: boolean;
    userName: string;
    onClose: () => void;
}

export function MuralModal({ item, initiallyRead, isAdmin, userName, onClose }: MuralModalProps) {
    const router = useRouter();
    const [isReadingConfirmed, setIsReadingConfirmed] = useState(initiallyRead);
    const [readers, setReaders] = useState<{ userName: string, timestamp: string, agencyName?: string }[]>([]);
    const [isLoadingReaders, setIsLoadingReaders] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsReadingConfirmed(initiallyRead);
        loadReaders();
    }, [item.id, initiallyRead]);

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
        // Optimistic UI update
        setIsReadingConfirmed(true);
        const optimisticReader = {
            userName: userName,
            timestamp: new Date().toISOString(),
            agencyName: 'Sua Agência' // Placeholder for UI, will be refreshed later
        };

        setReaders(prev => [optimisticReader, ...prev]);

        setIsSubmitting(true);
        try {
            const result = await confirmNoticeReadAction(item.id);
            if (result.success) {
                // Refresh readers list to get accurate data from server
                try {
                    const { readers: readersData } = await fetchMuralReaders(item.id);
                    if (readersData) setReaders(readersData);
                } catch (readErr) {
                    console.error('[MuralModal] Error refreshing readers list:', readErr);
                }
                // Refresh server side state for unread indicators
                router.refresh();
            } else {
                // Rollback on error
                setIsReadingConfirmed(false);
                setReaders(prev => prev.filter(r => r !== optimisticReader));
                console.warn(result.error || 'Erro ao confirmar leitura.');
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

    const renderFormattedText = (text: string) => {
        if (!text) return null;

        // Split text by markdown bold pattern **text** or escaped \*\*text\*\*
        // Airtable rich text fields often include backslashes for escaping
        const parts = text.split(/(\\?\*\*.*?\\?\*\*)/g);

        return parts.map((part, i) => {
            // Check for **text** or \*\*text\*\*
            const isBold = (part.startsWith('**') && part.endsWith('**')) ||
                (part.startsWith('\\**') && part.endsWith('\\**'));

            if (isBold) {
                // Remove the asterisks (and backslashes) and render as strong
                const cleanText = part.replace(/^(\\?\*\*)|(\\?\*\*)$/g, '');
                return <strong key={i} className="font-black text-gray-900">{cleanText}</strong>;
            }
            return part;
        });
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
                                    <Clock className="h-3 w-3" /> {formatDate(item.publishedAt)}
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
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 2) Bloco de Impacto (Novo Componente) */}
                    <div className={`p-4 rounded-xl border ${item.priority === 'Crítica'
                        ? 'bg-red-50 border-red-100'
                        : 'bg-gray-50 border-gray-100'
                        }`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className={`h-4 w-4 ${item.priority === 'Crítica' ? 'text-red-500' : 'text-amber-500'}`} />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Impacto</span>
                                    <span className="text-[13px] font-bold text-gray-900">{item.impact || 'Informativo'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destino</span>
                                    <span className="text-[13px] font-bold text-gray-900">{item.destination || 'Geral'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-green-500" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Validade</span>
                                    <span className="text-[13px] font-bold text-gray-900">{item.startDate ? formatDate(item.startDate) : formatDate(item.publishedAt)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-purple-500" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Afeta</span>
                                    <span className="text-[13px] font-bold text-gray-900">{item.affectedScope || 'Todos os atendimentos'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3) Dados objetivos (valores/horários/regras) */}
                    {item.summary && (
                        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                            <h3 className="text-xs font-bold text-[#3b5998] uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlertCircle className="h-3 w-3" /> Resumo Operacional
                            </h3>
                            <div className="text-gray-800 text-[14px] font-medium leading-relaxed whitespace-pre-wrap">
                                {renderFormattedText(item.summary)}
                            </div>
                        </div>
                    )}

                    {/* 4) Explicação detalhada (texto longo) */}
                    <div className="prose prose-blue max-w-none">
                        <div className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap">
                            {renderFormattedText(item.content)}
                        </div>
                    </div>

                    {/* Attachments */}
                    {item.attachments && item.attachments.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                                <Paperclip className="h-4 w-4" /> Anexos:
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {item.attachments.map((file, idx) => (
                                    <a
                                        key={idx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-[#3b5998] rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors text-sm font-medium"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                        {file.filename}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 5) Ação do usuário */}
                    {item.requiresConfirmation && (
                        <div className="bg-gray-50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    {isReadingConfirmed
                                        ? 'Sua leitura foi confirmada.'
                                        : 'A confirmação de leitura é obrigatória para este aviso.'}
                                </span>
                            </div>
                            <Button
                                onClick={handleConfirmRead}
                                disabled={isReadingConfirmed || isSubmitting}
                                className={`rounded-lg px-6 font-bold flex items-center gap-2 transition-all ${isReadingConfirmed
                                    ? 'bg-green-500 hover:bg-green-500 cursor-default text-white'
                                    : 'bg-[#3b5998] hover:bg-[#2d4373]'
                                    }`}
                            >
                                {isReadingConfirmed ? (
                                    <><CheckCircle2 className="h-4 w-4" /> Ciência Confirmada</>
                                ) : (
                                    isSubmitting ? 'Confirmando...' : 'Confirmar Ciência'
                                )}
                            </Button>
                        </div>
                    )}

                    {/* 6) Confirmações de leitura */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                            <User className="h-4 w-4" /> Lido por:
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {isLoadingReaders ? (
                                <div className="col-span-2 text-center py-4 text-gray-400 text-sm">Carregando lista...</div>
                            ) : readers.length > 0 ? (
                                readers.map((reader, idx) => (
                                    <div key={idx} className="flex flex-col p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold text-gray-700">{reader.userName}</span>
                                            {isAdmin && reader.agencyName && (
                                                <span className="text-[10px] font-bold text-[#3b5998] uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                                                    {reader.agencyName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(reader.timestamp)} {formatTime(reader.timestamp)}
                                        </div>
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
