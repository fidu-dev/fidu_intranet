'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, RefreshCw, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { createSeason, updateSeason, deleteSeason, type SeasonItem } from '@/app/admin/actions';

// ── Season Manager ──

function SeasonManager({ initialSeasons }: { initialSeasons: SeasonItem[] }) {
    const [seasons, setSeasons] = useState(initialSeasons);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newColor, setNewColor] = useState('#3b82f6');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!newCode.trim() || !newLabel.trim()) return;
        setSaving(true);
        setError('');
        const result = await createSeason(newCode.trim().toUpperCase(), newLabel.trim(), newColor);
        if (result.success) {
            setNewCode('');
            setNewLabel('');
            setNewColor('#3b82f6');
            setDialogOpen(false);
            // Reload page to get fresh data
            window.location.reload();
        } else {
            setError(result.error || 'Erro ao criar temporada');
        }
        setSaving(false);
    };

    const handleToggleActive = async (season: SeasonItem) => {
        const result = await updateSeason(season.id, { active: !season.active });
        if (result.success) {
            setSeasons(prev => prev.map(s => s.id === season.id ? { ...s, active: !s.active } : s));
        }
    };

    const handleColorChange = async (season: SeasonItem, color: string) => {
        setSeasons(prev => prev.map(s => s.id === season.id ? { ...s, color } : s));
        await updateSeason(season.id, { color });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta temporada? Todos os preços associados serão removidos.')) return;
        const result = await deleteSeason(id);
        if (result.success) {
            setSeasons(prev => prev.filter(s => s.id !== id));
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold">Gestão de Temporadas</h2>
                    <p className="text-sm text-gray-500">Crie, edite e ative/desative temporadas de preços.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" /> Nova Temporada
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Nova Temporada de Preços</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Código</label>
                                <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Ex: VER27, INV27" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Nome</label>
                                <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Ex: Verão 2027" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700">Cor de destaque</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={newColor}
                                        onChange={e => setNewColor(e.target.value)}
                                        className="h-9 w-12 rounded border border-gray-200 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-500">{newColor}</span>
                                </div>
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                                <Button type="button" size="sm" onClick={handleCreate} disabled={saving || !newCode.trim() || !newLabel.trim()}>
                                    {saving ? 'Criando...' : 'Criar'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/80">
                        <TableHead className="text-xs font-semibold">Código</TableHead>
                        <TableHead className="text-xs font-semibold">Nome</TableHead>
                        <TableHead className="text-xs font-semibold w-20">Cor</TableHead>
                        <TableHead className="text-xs font-semibold w-20">Ativa</TableHead>
                        <TableHead className="text-xs font-semibold w-16"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {seasons.map(season => (
                        <TableRow key={season.id}>
                            <TableCell className="font-mono text-sm">{season.code}</TableCell>
                            <TableCell className="text-sm">{season.label}</TableCell>
                            <TableCell>
                                <input
                                    type="color"
                                    value={season.color || '#3b82f6'}
                                    onChange={e => handleColorChange(season, e.target.value)}
                                    className="h-7 w-10 rounded border border-gray-200 cursor-pointer"
                                />
                            </TableCell>
                            <TableCell>
                                <button
                                    type="button"
                                    onClick={() => handleToggleActive(season)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                        season.active ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                                            season.active ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </TableCell>
                            <TableCell>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(season.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                    title="Excluir temporada"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {seasons.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-400 py-8 text-sm">
                                Nenhuma temporada cadastrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

// ── Airtable Sync ──

function AirtableSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncMsg, setLastSyncMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setLastSyncMsg(null);
        try {
            const res = await fetch('/api/sync/tours', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setLastSyncMsg({ type: 'success', text: `Sincronização concluída: ${data.count} passeios enviados para o Airtable.` });
            } else {
                const err = await res.json();
                setLastSyncMsg({ type: 'error', text: `Erro: ${err.error || 'Falha na requisição'}` });
            }
        } catch {
            setLastSyncMsg({ type: 'error', text: 'Erro de comunicação de rede ou permissões insuficientes.' });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-xl">
            <h2 className="text-lg font-bold mb-4">Sincronização Airtable</h2>
            <p className="text-sm text-gray-500 mb-6">
                Envia os dados de todos os passeios ativos do Supabase para a tabela do Airtable.
                Passeios existentes serão atualizados e novos registros serão criados automaticamente.
            </p>
            <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full sm:w-auto"
            >
                {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isSyncing ? 'Enviando...' : 'Enviar dados para Airtable'}
            </Button>

            {lastSyncMsg && (
                <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 text-sm ${lastSyncMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {lastSyncMsg.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                    <p>{lastSyncMsg.text}</p>
                </div>
            )}
        </div>
    );
}

// ── Main ──

export function SettingsClient({ initialSeasons }: { initialSeasons: SeasonItem[] }) {
    return (
        <div className="space-y-6">
            <SeasonManager initialSeasons={initialSeasons} />
            <AirtableSync />
        </div>
    );
}
