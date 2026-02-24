'use client';

import { MuralItem } from '@/lib/airtable/types';
import { useState, useMemo } from 'react';
import { Search, Megaphone, Info, Clock, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MuralModal } from './MuralModal';

interface MuralGridProps {
    items: MuralItem[];
    readLogs: string[];
    isAdmin: boolean;
}

export function MuralGrid({ items, readLogs, isAdmin }: MuralGridProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<MuralItem | null>(null);

    const filteredItems = useMemo(() => {
        const priorityScore: Record<string, number> = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };

        const filtered = items.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            // 1. Pinned first
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

            // 2. Priority
            const scoreA = priorityScore[a.priority] || 0;
            const scoreB = priorityScore[b.priority] || 0;
            if (scoreA !== scoreB) return scoreB - scoreA;

            // 3. Date
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });
    }, [items, searchTerm]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Pesquisar aviso ou categoria..."
                        className="pl-10 border-gray-200 focus:ring-blue-500 rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Mural Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight w-24">Data</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight w-32">Categoria</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight w-1/4 min-w-[200px]">Aviso</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight w-1/2">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredItems.map((item) => {
                                const isRead = readLogs.includes(item.id);
                                return (
                                    <tr
                                        key={item.id}
                                        className={`hover:bg-gray-100/80 transition-colors cursor-pointer group ${!isRead ? 'bg-blue-50/50' : 'bg-white'
                                            }`}
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {!isRead && (
                                                        <div className="w-2 h-2 rounded-full bg-[#3b5998] animate-pulse" title="Não lido" />
                                                    )}
                                                    {['Crítica', 'Alta'].includes(item.priority) && (
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase w-fit border ${item.priority === 'Crítica'
                                                            ? 'bg-red-600 text-white border-red-700'
                                                            : 'bg-red-100 text-red-600 border-red-200'
                                                            }`}>
                                                            {item.priority === 'Crítica' ? 'Crítica' : 'Urgente'}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-gray-600 text-[13px] font-medium">{formatDate(item.publishedAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${['Atualização de Valores', 'Valores'].includes(item.category)
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <Megaphone className="h-4 w-4 text-gray-400 group-hover:text-[#3b5998]" />
                                                <span className="text-gray-900 font-semibold text-[13px]">{item.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-gray-500 text-[13px] line-clamp-1">
                                                {item.summary || item.content}
                                            </p>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-20 text-gray-500 bg-gray-50/50">
                        Nenhuma atualização encontrada.
                    </div>
                )}
            </div>

            {selectedItem && (
                <MuralModal
                    item={selectedItem}
                    initiallyRead={readLogs.includes(selectedItem.id)}
                    isAdmin={isAdmin}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
}
