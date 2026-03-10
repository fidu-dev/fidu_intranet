'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { createSeason } from '@/app/admin/actions';

interface SeasonInfo {
    id: string;
    code: string;
    label: string;
}

interface SeasonPriceData {
    adu: string;
    chd: string;
    inf: string;
}

interface PricingTableProps {
    seasons: SeasonInfo[];
    prices: Record<string, SeasonPriceData>;
    onPriceChange: (seasonCode: string, field: keyof SeasonPriceData, value: string) => void;
    onSeasonsChanged: () => void;
}

function AddSeasonDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!code.trim() || !label.trim()) return;
        setSaving(true);
        setError('');
        const result = await createSeason(code.trim().toUpperCase(), label.trim());
        if (result.success) {
            setCode('');
            setLabel('');
            setOpen(false);
            onCreated();
        } else {
            setError(result.error || 'Erro ao criar temporada');
        }
        setSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Nova Temporada
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Nova Temporada de Preços</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Código</label>
                        <Input value={code} onChange={e => setCode(e.target.value)} placeholder="Ex: VER27, INV27" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Nome</label>
                        <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Verão 2027" />
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="button" size="sm" onClick={handleCreate} disabled={saving || !code.trim() || !label.trim()}>
                            Criar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function PricingTable({ seasons, prices, onPriceChange, onSeasonsChanged }: PricingTableProps) {
    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/80">
                        <TableHead className="w-40 text-xs font-semibold">Temporada</TableHead>
                        <TableHead className="text-xs font-semibold">Adulto</TableHead>
                        <TableHead className="text-xs font-semibold">Criança</TableHead>
                        <TableHead className="text-xs font-semibold">Infante</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {seasons.map(season => {
                        const sp = prices[season.code] || { adu: '', chd: '', inf: '' };
                        return (
                            <TableRow key={season.id}>
                                <TableCell className="font-medium">
                                    <div>
                                        <span className="text-sm">{season.label}</span>
                                        <span className="text-xs text-gray-400 ml-1.5">({season.code})</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={sp.adu}
                                        onChange={e => onPriceChange(season.code, 'adu', e.target.value)}
                                        placeholder="0.00"
                                        className="h-8 w-28"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={sp.chd}
                                        onChange={e => onPriceChange(season.code, 'chd', e.target.value)}
                                        placeholder="0.00"
                                        className="h-8 w-28"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={sp.inf}
                                        onChange={e => onPriceChange(season.code, 'inf', e.target.value)}
                                        placeholder="0.00"
                                        className="h-8 w-28"
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {seasons.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-400 py-8 text-sm">
                                Nenhuma temporada cadastrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex justify-end">
                <AddSeasonDialog onCreated={onSeasonsChanged} />
            </div>
        </div>
    );
}
