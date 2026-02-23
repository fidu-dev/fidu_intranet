'use client';

import { useState } from 'react';
import { updateAgency, createNewAgency } from '@/app/admin/actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Save, Loader2, X } from 'lucide-react';

export interface AgencyFull {
    id: string;
    name: string;
    legalName: string | null;
    cnpj: string | null;
    cadastur: string | null;
    address: string | null;
    responsibleName: string | null;
    commissionRate: number;
}

interface AgenciesTableProps {
    initialAgencies: AgencyFull[];
}

export function AgenciesTable({ initialAgencies }: AgenciesTableProps) {
    const [agencies, setAgencies] = useState(initialAgencies);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Edit State
    const [editData, setEditData] = useState<Partial<AgencyFull>>({});

    // New Agency State
    const [newAgency, setNewAgency] = useState<Partial<AgencyFull>>({
        name: '', legalName: '', cnpj: '', cadastur: '', address: '', responsibleName: '', commissionRate: 0
    });

    const handleEdit = (agency: AgencyFull) => {
        setEditingId(agency.id);
        setEditData({
            name: agency.name,
            legalName: agency.legalName || '',
            cnpj: agency.cnpj || '',
            cadastur: agency.cadastur || '',
            address: agency.address || '',
            responsibleName: agency.responsibleName || '',
            commissionRate: agency.commissionRate * 100,
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleSave = async (id: string) => {
        setIsSaving(true);
        const rate = parseFloat(String(editData.commissionRate)) / 100 || 0;
        const payload = { ...editData, commissionRate: rate };
        try {
            await updateAgency(id, payload);
            setAgencies(agencies.map(a => a.id === id ? { ...a, ...payload } : a));
            setEditingId(null);
        } catch (e) {
            alert('Falha ao atualizar agência');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreate = async () => {
        setIsSaving(true);
        const rate = parseFloat(String(newAgency.commissionRate)) / 100 || 0;
        try {
            await createNewAgency({ ...newAgency, commissionRate: rate });
            window.location.reload();
        } catch (e) {
            alert('Falha ao criar agência');
        } finally {
            setIsSaving(false);
            setIsCreateOpen(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Agências Parceiras</h2>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Plus className="h-4 w-4" /> Cadastrar Agência
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Cadastrar Agência</DialogTitle>
                            <DialogDescription>
                                Preencha os dados institucionais da agência.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                            {/* Form fields for New Agency */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs">Fantasia</Label>
                                <Input value={newAgency.name} onChange={e => setNewAgency({ ...newAgency, name: e.target.value })} className="col-span-3 h-8 text-sm" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs">Razão Social</Label>
                                <Input value={newAgency.legalName!} onChange={e => setNewAgency({ ...newAgency, legalName: e.target.value })} className="col-span-3 h-8 text-sm" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs">CNPJ</Label>
                                <Input value={newAgency.cnpj!} onChange={e => setNewAgency({ ...newAgency, cnpj: e.target.value })} className="col-span-3 h-8 text-sm" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs">Cadastur</Label>
                                <Input value={newAgency.cadastur!} onChange={e => setNewAgency({ ...newAgency, cadastur: e.target.value })} className="col-span-3 h-8 text-sm" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs">Responsável</Label>
                                <Input value={newAgency.responsibleName!} onChange={e => setNewAgency({ ...newAgency, responsibleName: e.target.value })} className="col-span-3 h-8 text-sm" />
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <Label className="text-right text-xs pt-2">Endereço</Label>
                                <textarea value={newAgency.address!} onChange={e => setNewAgency({ ...newAgency, address: e.target.value })} className="col-span-3 flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs font-bold text-blue-600">Comissão %</Label>
                                <Input type="number" step="0.5" value={newAgency.commissionRate} onChange={e => setNewAgency({ ...newAgency, commissionRate: parseFloat(e.target.value) || 0 })} className="col-span-3 h-8 text-sm font-bold border-blue-200" placeholder="Ex: 15" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleCreate} disabled={isSaving || !newAgency.name} className="bg-blue-600">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Agência
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="w-[180px]">Fantasia</TableHead>
                            <TableHead>Dados Empresariais</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead className="w-[120px]">Comissão Base</TableHead>
                            <TableHead className="text-right w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agencies.map((agency) => {
                            const isEditing = editingId === agency.id;
                            return (
                                <TableRow key={agency.id}>
                                    <TableCell className="font-medium align-top pt-4">
                                        {isEditing ? (
                                            <Input
                                                className="h-8 text-sm w-full font-bold"
                                                value={editData.name}
                                                onChange={e => setEditData({ ...editData, name: e.target.value })}
                                            />
                                        ) : (
                                            agency.name
                                        )}
                                    </TableCell>
                                    <TableCell className="align-top pt-4">
                                        {isEditing ? (
                                            <div className="space-y-2 text-xs">
                                                <div className="flex items-center gap-2"><span className="w-16 text-gray-400">Razão:</span><Input className="h-7 text-xs flex-1" value={editData.legalName!} onChange={e => setEditData({ ...editData, legalName: e.target.value })} /></div>
                                                <div className="flex items-center gap-2"><span className="w-16 text-gray-400">CNPJ:</span><Input className="h-7 text-xs flex-1" value={editData.cnpj!} onChange={e => setEditData({ ...editData, cnpj: e.target.value })} /></div>
                                                <div className="flex items-center gap-2"><span className="w-16 text-gray-400">Cadastur:</span><Input className="h-7 text-xs flex-1" value={editData.cadastur!} onChange={e => setEditData({ ...editData, cadastur: e.target.value })} /></div>
                                                <div className="flex items-start gap-2"><span className="w-16 text-gray-400 mt-1.5">Endereço:</span><textarea className="flex-1 min-h-[40px] rounded-md border text-xs p-2" value={editData.address!} onChange={e => setEditData({ ...editData, address: e.target.value })} /></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1 text-xs text-gray-500">
                                                {agency.legalName && <div><span className="text-gray-400">Razão:</span> {agency.legalName}</div>}
                                                {agency.cnpj && <div><span className="text-gray-400">CNPJ:</span> {agency.cnpj}</div>}
                                                {agency.cadastur && <div><span className="text-gray-400">Cadastur:</span> {agency.cadastur}</div>}
                                                {agency.address && <div className="truncate max-w-xs" title={agency.address}><span className="text-gray-400">End.:</span> {agency.address}</div>}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="align-top pt-4 text-gray-600">
                                        {isEditing ? (
                                            <Input
                                                className="h-8 text-sm w-full"
                                                value={editData.responsibleName!}
                                                onChange={e => setEditData({ ...editData, responsibleName: e.target.value })}
                                            />
                                        ) : (
                                            agency.responsibleName || '-'
                                        )}
                                    </TableCell>
                                    <TableCell className="align-top pt-4">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    className="w-16 h-8 text-sm px-2 text-center text-blue-700 font-bold bg-blue-50 border-blue-200"
                                                    value={editData.commissionRate}
                                                    onChange={e => setEditData({ ...editData, commissionRate: parseFloat(e.target.value) || 0 })}
                                                />
                                                <span className="text-sm font-bold text-gray-400">%</span>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100 shadow-sm">
                                                {(agency.commissionRate * 100).toFixed(1)}%
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right align-top pt-4">
                                        {isEditing ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0 shrink-0"
                                                    onClick={() => handleSave(agency.id)}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 shrink-0" onClick={handleCancelEdit}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleEdit(agency)}
                                            >
                                                <Pencil className="h-4 w-4 text-gray-500" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {agencies.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">Nenhuma agência cadastrada.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
