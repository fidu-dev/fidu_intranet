'use client';

import { useState, useRef } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    Combobox, ComboboxContent, ComboboxList, ComboboxItem,
    ComboboxChipsInput, ComboboxEmpty,
} from '@/components/ui/combobox';
import { Settings2, X } from 'lucide-react';
import { OptionManager } from '@/components/admin/ManageableSelect';
import { Label } from '@/components/ui/label';

interface TagsComboboxProps {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    onOptionsChanged: () => void;
}

export function TagsCombobox({ value, onChange, options, onOptionsChanged }: TagsComboboxProps) {
    const [manageOpen, setManageOpen] = useState(false);
    const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
    const anchor = useRef<HTMLDivElement | null>(null);

    const removeTag = (tag: string) => {
        const newSelected = selected.filter(s => s !== tag);
        onChange(newSelected.join(', '));
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Tags</Label>
                <Dialog open={manageOpen} onOpenChange={setManageOpen}>
                    <DialogTrigger asChild>
                        <button type="button" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                            <Settings2 className="h-3 w-3" /> Gerenciar
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Gerenciar: Tags</DialogTitle>
                        </DialogHeader>
                        <OptionManager
                            group="tag"
                            currentOptions={options}
                            onDone={() => {
                                setManageOpen(false);
                                onOptionsChanged();
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <Combobox
                multiple
                value={selected}
                onValueChange={(newSelected: string[]) => onChange(newSelected.join(', '))}
            >
                <div
                    ref={anchor}
                    className="border-input focus-within:border-ring focus-within:ring-ring/50 flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]"
                >
                    {selected.map(tag => (
                        <span
                            key={tag}
                            className="bg-muted text-foreground flex h-5.5 items-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap"
                        >
                            {tag}
                            <button
                                type="button"
                                className="opacity-50 hover:opacity-100"
                                onClick={() => removeTag(tag)}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <ComboboxChipsInput placeholder="Buscar ou digitar tag..." />
                </div>
                <ComboboxContent anchor={anchor}>
                    <ComboboxList>
                        {options.map(item => (
                            <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                        ))}
                        <ComboboxEmpty>Nenhuma tag encontrada</ComboboxEmpty>
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </div>
    );
}
