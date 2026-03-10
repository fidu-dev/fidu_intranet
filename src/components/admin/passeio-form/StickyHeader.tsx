'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Save, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface StickyHeaderProps {
    title: string;
    statusOperativo: string;
    statusIntranet: string;
    onStatusChange: (field: 'statusOperativo' | 'statusIntranet', value: string) => void;
    onSave: () => void;
    backHref: string;
    isSaving: boolean;
    saveLabel?: string;
    message?: { type: 'success' | 'error'; text: string } | null;
}

export function StickyHeader({
    title, statusOperativo, statusIntranet, onStatusChange,
    onSave, backHref, isSaving, saveLabel = 'Salvar', message,
}: StickyHeaderProps) {
    const cycleStatus = () => {
        const next = statusOperativo === 'Ativo' ? 'Inativo' : statusOperativo === 'Inativo' ? 'Suspenso' : 'Ativo';
        onStatusChange('statusOperativo', next);
    };

    const toggleIntranet = () => {
        onStatusChange('statusIntranet', statusIntranet === 'Visível' ? 'Oculto' : 'Visível');
    };

    return (
        <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 -mx-8 -mt-8 px-8 pt-4 pb-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left side */}
                <div className="flex items-center gap-4 min-w-0">
                    <Link href={backHref} className="text-gray-400 hover:text-gray-600 shrink-0" title="Voltar">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                        {title || 'Sem título'}
                    </h1>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={cycleStatus}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors cursor-pointer ${
                                statusOperativo === 'Ativo'
                                    ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                                    : statusOperativo === 'Suspenso'
                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                                    : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                            }`}
                            title="Clique para alternar o status operativo"
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${
                                statusOperativo === 'Ativo' ? 'bg-green-500' : statusOperativo === 'Suspenso' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`} />
                            {statusOperativo || 'Ativo'}
                        </button>
                        <button
                            type="button"
                            onClick={toggleIntranet}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors cursor-pointer ${
                                statusIntranet === 'Visível'
                                    ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                    : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                            }`}
                            title="Clique para alternar visibilidade na intranet"
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${statusIntranet === 'Visível' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                            {statusIntranet === 'Visível' ? 'Visível' : 'Oculto'}
                        </button>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3 shrink-0">
                    {message && (
                        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                            message.type === 'success'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                        }`}>
                            {message.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            <span className="max-w-xs truncate">{message.text}</span>
                        </div>
                    )}
                    <Button variant="outline" size="sm" asChild className="text-gray-500">
                        <Link href={backHref}>Cancelar</Link>
                    </Button>
                    <Button onClick={onSave} disabled={isSaving} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {isSaving ? 'Salvando...' : saveLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
