'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Settings2, Plus, Trash2, X } from 'lucide-react';
import {
    createSelectOption,
    deleteSelectOption,
    getSelectOptionsFull,
} from '@/app/admin/actions';

const selectClass =
    'flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950';

// ── Single Select ──

interface ManageableSelectProps {
    label: string;
    group: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    onOptionsChanged: () => void;
    required?: boolean;
    error?: string;
}

export function ManageableSelect({
    label,
    group,
    value,
    onChange,
    options,
    onOptionsChanged,
    required,
    error,
}: ManageableSelectProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex gap-1.5">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={`${selectClass} flex-1 ${error ? 'border-red-300' : ''}`}
                >
                    <option value="">Selecione...</option>
                    {options.map(o => (
                        <option key={o} value={o}>{o}</option>
                    ))}
                </select>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 shrink-0"
                            title={`Gerenciar opções de ${label}`}
                        >
                            <Settings2 className="h-4 w-4 text-gray-500" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Gerenciar: {label}</DialogTitle>
                        </DialogHeader>
                        <OptionManager
                            group={group}
                            currentOptions={options}
                            onDone={() => {
                                setOpen(false);
                                onOptionsChanged();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// ── Multi-Chip Select ──

interface ManageableChipSelectProps {
    label: string;
    group: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    onOptionsChanged: () => void;
}

export function ManageableChipSelect({
    label,
    group,
    value,
    onChange,
    options,
    onOptionsChanged,
}: ManageableChipSelectProps) {
    const [open, setOpen] = useState(false);
    const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

    const toggle = (item: string) => {
        const next = selected.includes(item)
            ? selected.filter(s => s !== item)
            : [...selected, item];
        onChange(next.join(', '));
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">{label}</Label>
                <div className="flex items-center gap-2">
                    {selected.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                        >
                            <X className="h-3 w-3" /> Limpar
                        </button>
                    )}
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button
                                type="button"
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                                title={`Gerenciar opções de ${label}`}
                            >
                                <Settings2 className="h-3 w-3" /> Gerenciar
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Gerenciar: {label}</DialogTitle>
                            </DialogHeader>
                            <OptionManager
                                group={group}
                                currentOptions={options}
                                onDone={() => {
                                    setOpen(false);
                                    onOptionsChanged();
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {options.map(opt => {
                    const active = selected.includes(opt);
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => toggle(opt)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                                active
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Option Manager Dialog Content ──

export function OptionManager({
    group,
    currentOptions,
    onDone,
}: {
    group: string;
    currentOptions: string[];
    onDone: () => void;
}) {
    const [options, setOptions] = useState<{ id: string; value: string; sortOrder: number }[]>([]);
    const [newValue, setNewValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Load full options on mount
    useState(() => {
        getSelectOptionsFull(group).then(opts => {
            setOptions(opts.map(o => ({ id: o.id, value: o.value, sortOrder: o.sortOrder })));
            setLoading(false);
        });
    });

    const handleAdd = async () => {
        const trimmed = newValue.trim();
        if (!trimmed) return;
        setSaving(true);
        setError('');
        const result = await createSelectOption(group, trimmed);
        if (result.success) {
            setNewValue('');
            // Reload options
            const opts = await getSelectOptionsFull(group);
            setOptions(opts.map(o => ({ id: o.id, value: o.value, sortOrder: o.sortOrder })));
        } else {
            setError(result.error || 'Erro ao adicionar');
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        setSaving(true);
        await deleteSelectOption(id);
        setOptions(prev => prev.filter(o => o.id !== id));
        setSaving(false);
    };

    return (
        <div className="space-y-4">
            {loading ? (
                <p className="text-sm text-gray-400 py-4 text-center">Carregando...</p>
            ) : (
                <>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                        {options.map(opt => (
                            <div key={opt.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 group">
                                <span className="text-sm">{opt.value}</span>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(opt.id)}
                                    disabled={saving}
                                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remover"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        {options.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-2">Nenhuma opção cadastrada</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Input
                            value={newValue}
                            onChange={e => setNewValue(e.target.value)}
                            placeholder="Novo valor..."
                            className="flex-1"
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                        />
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleAdd}
                            disabled={saving || !newValue.trim()}
                            className="shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <div className="flex justify-end">
                        <Button type="button" size="sm" variant="outline" onClick={onDone}>
                            Fechar
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
