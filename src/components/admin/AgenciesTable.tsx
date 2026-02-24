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
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Save, Loader2, X, CheckCircle, XCircle } from 'lucide-react';

export interface AgencyFull {
    id: string;
    name: string;
    legalName: string | null;
    cnpj: string | null;
    cadastur: string | null;
    address: string | null;
    responsibleName: string | null;
    responsiblePhone: string | null;
    instagram: string | null;
    bankDetails: string | null;
    commissionRate: number;
    status: string;
    requestedUsers?: any;
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
        name: '', legalName: '', cnpj: '', cadastur: '', address: '', responsibleName: '', responsiblePhone: '', instagram: '', bankDetails: '', commissionRate: 0, status: 'APPROVED'
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
            responsiblePhone: agency.responsiblePhone || '',
            instagram: agency.instagram || '',
            bankDetails: agency.bankDetails || '',
            commissionRate: agency.commissionRate * 100,
            status: agency.status,
            requestedUsers: agency.requestedUsers
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
        } catch (e: any) {
            console.error('Save Agency Error:', e);
            alert(`Falha ao atualizar agência: ${e.message || e}`);
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
        } catch (e: any) {
            console.error('Create Agency Error:', e);
            alert(`Falha ao criar agência: ${e.message || e}`);
        } finally {
            setIsSaving(false);
            setIsCreateOpen(false);
        }
    };

    const handleApprove = async (id: string, currentRate: number) => {
        setIsSaving(true);
        try {
            await updateAgency(id, { status: 'APPROVED', commissionRate: currentRate });
            setAgencies(agencies.map(a => a.id === id ? { ...a, status: 'APPROVED' } : a));
        } catch (e) {
            alert('Falha ao aprovar agência');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Deseja realmente rejeitar esta agência?')) return;
        setIsSaving(true);
        try {
            await updateAgency(id, { status: 'REJECTED' });
            setAgencies(agencies.map(a => a.id === id ? { ...a, status: 'REJECTED' } : a));
        } catch (e) {
            alert('Falha ao rejeitar agência');
        } finally {
            setIsSaving(false);
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
                                <Label className="text-right text-xs">Instagram</Label>
                                <Input value={newAgency.instagram!} onChange={e => setNewAgency({ ...newAgency, instagram: e.target.value })} className="col-span-3 h-8 text-sm" placeholder="@agencia" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs">Responsável</Label>
                                <Input value={newAgency.responsibleName!} onChange={e => setNewAgency({ ...newAgency, responsibleName: e.target.value })} className="col-span-3 h-8 text-sm" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs">Tel. Responsável</Label>
                                <Input value={newAgency.responsiblePhone!} onChange={e => setNewAgency({ ...newAgency, responsiblePhone: e.target.value })} className="col-span-3 h-8 text-sm" placeholder="(11) 99999-9999" />
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <Label className="text-right text-xs pt-2">Endereço</Label>
                                <textarea value={newAgency.address!} onChange={e => setNewAgency({ ...newAgency, address: e.target.value })} className="col-span-3 flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-xs">Dados Bancários / Pix</Label>
                                <Input value={newAgency.bankDetails!} onChange={e => setNewAgency({ ...newAgency, bankDetails: e.target.value })} className="col-span-3 h-8 text-sm" placeholder="Chave celular, CNPJ, ou Ag/Cc" />
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

            <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
                <Table className="min-w-[1100px]">
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="w-[180px]">Fantasia</TableHead>
                            <TableHead className="w-[320px]">Dados Empresariais</TableHead>
                            <TableHead className="w-[280px]">Responsável</TableHead>
                            <TableHead className="w-[110px]">Comissão Base</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead className="text-right w-[90px]">Ações</TableHead>
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
                                                <div className="flex items-center gap-2"><span className="w-16 text-gray-400">Insta:</span><Input className="h-7 text-xs flex-1" value={editData.instagram!} onChange={e => setEditData({ ...editData, instagram: e.target.value })} placeholder="@agencia" /></div>
                                                <div className="flex items-start gap-2"><span className="w-16 text-gray-400 mt-1.5">Endereço:</span><textarea className="flex-1 min-h-[40px] rounded-md border text-xs p-2" value={editData.address!} onChange={e => setEditData({ ...editData, address: e.target.value })} /></div>
                                                <div className="flex items-start gap-2"><span className="w-16 text-gray-400 mt-1.5">Banco/Pix:</span><textarea className="flex-1 min-h-[40px] rounded-md border text-xs p-2" value={editData.bankDetails!} onChange={e => setEditData({ ...editData, bankDetails: e.target.value })} /></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1 text-xs text-gray-500">
                                                {agency.legalName && <div><span className="text-gray-400">Razão:</span> {agency.legalName}</div>}
                                                {agency.cnpj && <div><span className="text-gray-400">CNPJ:</span> {agency.cnpj}</div>}
                                                {agency.cadastur && <div><span className="text-gray-400">Cadastur:</span> {agency.cadastur}</div>}
                                                {agency.instagram && <div><span className="text-gray-400">Insta:</span> {agency.instagram}</div>}
                                                {agency.address && <div className="truncate max-w-xs" title={agency.address}><span className="text-gray-400">End.:</span> {agency.address}</div>}
                                                {agency.bankDetails && <div className="truncate max-w-xs" title={agency.bankDetails}><span className="text-gray-400">Banco:</span> {agency.bankDetails}</div>}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="align-top pt-4 text-gray-600">
                                        {isEditing ? (
                                            <div className="flex flex-col gap-2 w-full pr-4">
                                                <Input
                                                    className="h-8 text-sm w-full"
                                                    placeholder="Nome"
                                                    value={editData.responsibleName!}
                                                    onChange={e => setEditData({ ...editData, responsibleName: e.target.value })}
                                                />
                                                <Input
                                                    className="h-8 text-sm w-full"
                                                    placeholder="Telefone"
                                                    value={editData.responsiblePhone!}
                                                    onChange={e => setEditData({ ...editData, responsiblePhone: e.target.value })}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="font-semibold text-gray-800">{agency.responsibleName || '-'}</div>
                                                {agency.responsiblePhone && <div className="text-xs text-gray-500">{agency.responsiblePhone}</div>}
                                            </div>
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
                                    <TableCell className="align-top pt-4">
                                        {isEditing ? (
                                            <select
                                                className="h-8 text-sm w-full border border-gray-300 rounded px-2 bg-white"
                                                value={editData.status}
                                                onChange={e => setEditData({ ...editData, status: e.target.value })}
                                            >
                                                <option value="PENDING">Pendente</option>
                                                <option value="APPROVED">Aprovada</option>
                                                <option value="REJECTED">Rejeitada</option>
                                            </select>
                                        ) : agency.status === 'PENDING' ? (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>
                                        ) : agency.status === 'APPROVED' ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovada</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitada</Badge>
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
                                            <div className="flex items-center justify-end gap-1">
                                                {agency.status === 'PENDING' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleApprove(agency.id, agency.commissionRate)}
                                                            title="Aprovar Agência"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleReject(agency.id)}
                                                            title="Rejeitar Agência"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleEdit(agency)}
                                                >
                                                    <Pencil className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {agencies.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">Nenhuma agência cadastrada.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
