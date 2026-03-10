'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { deactivatePasseio, type PasseioListItem } from '@/app/admin/actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Power, Search, Loader2 } from 'lucide-react';

interface PasseiosClientProps {
    initialPasseios: PasseioListItem[];
    destinos: string[];
}

const STATUS_OPTIONS = ['Ativo', 'Inativo', 'Suspenso'];

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatPrice(price: number | null) {
    if (price == null) return '—';
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusBadge(status: string) {
    const s = status.toLowerCase();
    if (s === 'ativo') return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>;
    if (s === 'inativo') return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Inativo</Badge>;
    if (s === 'suspenso') return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Suspenso</Badge>;
    return <Badge variant="outline">{status || '—'}</Badge>;
}

function intranetBadge(status: string) {
    if (status === 'Visível') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Visível</Badge>;
    return <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">Oculto</Badge>;
}

export function PasseiosClient({ initialPasseios, destinos }: PasseiosClientProps) {
    const router = useRouter();
    const [passeios, setPasseios] = useState(initialPasseios);
    const [search, setSearch] = useState('');
    const [filterDestino, setFilterDestino] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return passeios.filter(p => {
            const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
            const matchDestino = !filterDestino || p.destino === filterDestino;
            const matchStatus = !filterStatus || p.statusOperativo.toLowerCase() === filterStatus.toLowerCase();
            return matchSearch && matchDestino && matchStatus;
        });
    }, [passeios, search, filterDestino, filterStatus]);

    const handleDeactivate = async (id: string, title: string) => {
        if (!confirm(`Deseja realmente desativar o passeio "${title}"?`)) return;
        setDeactivatingId(id);
        try {
            const result = await deactivatePasseio(id);
            if (result.success) {
                setPasseios(prev => prev.filter(p => p.id !== id));
            } else {
                alert(`Erro ao desativar: ${result.error}`);
            }
        } catch (e: any) {
            alert(`Erro ao desativar: ${e.message}`);
        } finally {
            setDeactivatingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por título..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    <select
                        value={filterDestino}
                        onChange={e => setFilterDestino(e.target.value)}
                        className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white min-w-[160px]"
                    >
                        <option value="">Todos os destinos</option>
                        {destinos.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="h-9 text-sm border border-gray-200 rounded-md px-3 bg-white min-w-[160px]"
                    >
                        <option value="">Todos os status</option>
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <Button
                    onClick={() => router.push('/admin/settings/passeios/novo')}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0"
                >
                    <Plus className="h-4 w-4" /> Novo Passeio
                </Button>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="min-w-[250px]">Título</TableHead>
                            <TableHead className="w-[140px]">Destino</TableHead>
                            <TableHead className="w-[130px]">Categoria</TableHead>
                            <TableHead className="w-[120px]">St. Operativo</TableHead>
                            <TableHead className="w-[100px]">St. Intranet</TableHead>
                            <TableHead className="w-[110px]">Preço</TableHead>
                            <TableHead className="w-[160px]">Última Atualização</TableHead>
                            <TableHead className="text-right w-[90px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.title || '—'}</TableCell>
                                <TableCell>{p.destino || '—'}</TableCell>
                                <TableCell>{p.categoria || '—'}</TableCell>
                                <TableCell>{statusBadge(p.statusOperativo)}</TableCell>
                                <TableCell>{intranetBadge(p.statusIntranet)}</TableCell>
                                <TableCell>{formatPrice(p.price)}</TableCell>
                                <TableCell className="text-sm text-gray-500">{formatDate(p.updatedAt)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            title="Editar"
                                            onClick={() => router.push(`/admin/settings/passeios/${p.id}/editar`)}
                                        >
                                            <Pencil className="h-4 w-4 text-gray-500" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            title="Desativar"
                                            onClick={() => handleDeactivate(p.id, p.title)}
                                            disabled={deactivatingId === p.id}
                                        >
                                            {deactivatingId === p.id
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <Power className="h-4 w-4" />
                                            }
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                    Nenhum passeio encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <p className="text-xs text-gray-400">{filtered.length} de {passeios.length} passeios exibidos</p>
        </div>
    );
}
