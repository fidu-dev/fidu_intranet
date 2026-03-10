'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { deactivatePasseio, updatePasseioStatus, type PasseioListItem } from '@/app/admin/actions';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
    DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus, Search, MoreHorizontal, Pencil, Copy, Map, Loader2,
} from 'lucide-react';

interface PasseiosClientProps {
    initialPasseios: PasseioListItem[];
    destinos: string[];
}

const STATUS_OPTIONS = ['Ativo', 'Inativo', 'Suspenso'];

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
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
    const [filterDestino, setFilterDestino] = useState('__all__');
    const [filterStatus, setFilterStatus] = useState('__all__');
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return passeios.filter(p => {
            const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
            const matchDestino = filterDestino === '__all__' || p.destino === filterDestino;
            const matchStatus = filterStatus === '__all__' || p.statusOperativo.toLowerCase() === filterStatus.toLowerCase();
            return matchSearch && matchDestino && matchStatus;
        });
    }, [passeios, search, filterDestino, filterStatus]);

    const handleDeactivate = async (id: string, title: string) => {
        if (!confirm(`Deseja realmente desativar o passeio "${title}"?`)) return;
        setLoadingId(id);
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
            setLoadingId(null);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        setLoadingId(id);
        try {
            const result = await updatePasseioStatus(id, newStatus);
            if (result.success) {
                setPasseios(prev => prev.map(p =>
                    p.id === id ? { ...p, statusOperativo: newStatus } : p
                ));
            } else {
                alert(`Erro ao alterar status: ${result.error}`);
            }
        } catch (e: any) {
            alert(`Erro: ${e.message}`);
        } finally {
            setLoadingId(null);
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
                    <Select value={filterDestino} onValueChange={setFilterDestino}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Todos os destinos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Todos os destinos</SelectItem>
                            {destinos.map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[160px] h-9">
                            <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Todos os status</SelectItem>
                            {STATUS_OPTIONS.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={() => router.push('/admin/settings/passeios/novo')}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0"
                >
                    <Plus className="h-4 w-4" /> Novo Passeio
                </Button>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Search className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">Nenhum passeio encontrado</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Tente ajustar os filtros ou criar um novo passeio.
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                <TableHead className="min-w-[280px] pl-4">Passeio</TableHead>
                                <TableHead className="w-[140px]">Destino</TableHead>
                                <TableHead className="w-[130px]">Status</TableHead>
                                <TableHead className="w-[120px] text-right">Preço</TableHead>
                                <TableHead className="w-[140px] text-right">Atualização</TableHead>
                                <TableHead className="w-[60px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(p => (
                                <TableRow
                                    key={p.id}
                                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                                    onClick={() => router.push(`/admin/settings/passeios/${p.id}/editar`)}
                                >
                                    {/* Info Principal */}
                                    <TableCell className="py-4 pl-4">
                                        <div className="flex items-center gap-3">
                                            {p.featuredImage ? (
                                                <img
                                                    src={p.featuredImage}
                                                    alt=""
                                                    className="h-10 w-10 rounded-lg object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                    <Map className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {p.title || 'Sem título'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {p.categoria || `ID: ${p.id.slice(0, 8)}`}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Destino */}
                                    <TableCell className="py-4 text-gray-600">
                                        {p.destino || '—'}
                                    </TableCell>

                                    {/* Status (stacked) */}
                                    <TableCell className="py-4">
                                        <div className="flex flex-col gap-1">
                                            {statusBadge(p.statusOperativo)}
                                            {intranetBadge(p.statusIntranet)}
                                        </div>
                                    </TableCell>

                                    {/* Preço */}
                                    <TableCell className="py-4 text-right font-medium tabular-nums text-gray-900">
                                        {formatPrice(p.price)}
                                    </TableCell>

                                    {/* Última Atualização */}
                                    <TableCell className="py-4 text-right text-sm text-gray-500">
                                        {formatDate(p.updatedAt)}
                                    </TableCell>

                                    {/* Ações Dropdown */}
                                    <TableCell className="py-4 pr-4" onClick={e => e.stopPropagation()}>
                                        {loadingId === p.id ? (
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                            </div>
                                        ) : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/admin/settings/passeios/${p.id}/editar`)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled>
                                                        <Copy className="h-4 w-4" />
                                                        Duplicar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            Alterar Status
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent>
                                                            {STATUS_OPTIONS.map(s => (
                                                                <DropdownMenuItem
                                                                    key={s}
                                                                    onClick={() => handleStatusChange(p.id, s)}
                                                                    disabled={p.statusOperativo === s}
                                                                >
                                                                    <span className={`h-2 w-2 rounded-full ${
                                                                        s === 'Ativo' ? 'bg-green-500'
                                                                            : s === 'Suspenso' ? 'bg-yellow-500'
                                                                            : 'bg-gray-400'
                                                                    }`} />
                                                                    {s}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleDeactivate(p.id, p.title)}
                                                    >
                                                        Desativar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <p className="text-xs text-gray-400">{filtered.length} de {passeios.length} passeios exibidos</p>
        </div>
    );
}
