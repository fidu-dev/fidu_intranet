'use client';

import { useState } from 'react';
import { Agency } from '@/lib/airtable/types';
import { updateAgencyCommission, createNewAgency } from '@/app/admin/actions';
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
import { Plus, Pencil, Save, Loader2 } from 'lucide-react';

interface AgenciesTableProps {
    initialAgencies: Agency[];
}

export function AgenciesTable({ initialAgencies }: AgenciesTableProps) {
    const [agencies, setAgencies] = useState(initialAgencies);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editCommission, setEditCommission] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    // New Agency State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newCommission, setNewCommission] = useState('');

    const handleEdit = (agency: Agency) => {
        setEditingId(agency.id);
        setEditCommission((agency.commissionRate * 100).toString());
    };

    const handleSaveCommission = async (id: string) => {
        setIsSaving(true);
        const rate = parseFloat(editCommission) / 100;
        try {
            await updateAgencyCommission(id, rate);
            // Optimistic update
            setAgencies(agencies.map(a => a.id === id ? { ...a, commissionRate: rate } : a));
            setEditingId(null);
        } catch (e) {
            alert('Failed to update commission');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreate = async () => {
        setIsSaving(true);
        const rate = parseFloat(newCommission) / 100;
        try {
            await createNewAgency(newName, newEmail, rate);
            // Reload page effectively to fetch new data or mock push
            // For simplicity/robustness, we might trigger a router refresh, but let's just alert for now.
            window.location.reload();
        } catch (e) {
            alert('Failed to create agency');
        } finally {
            setIsSaving(false);
            setIsCreateOpen(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Partner Agencies</h2>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Plus className="h-4 w-4" /> Add Agency
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Agency</DialogTitle>
                            <DialogDescription>
                                Create a profile for a new partner. The email must match their Clerk login email.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={newName} onChange={e => setNewName(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="commission" className="text-right">Comm. %</Label>
                                <Input id="commission" type="number" value={newCommission} onChange={e => setNewCommission(e.target.value)} className="col-span-3" placeholder="10" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleCreate} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Agency
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Current Commission</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agencies.map((agency) => (
                            <TableRow key={agency.id}>
                                <TableCell className="font-medium">{agency.name}</TableCell>
                                <TableCell className="text-gray-500">{agency.email}</TableCell>
                                <TableCell>
                                    {editingId === agency.id ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                className="w-20 h-8"
                                                value={editCommission}
                                                onChange={e => setEditCommission(e.target.value)}
                                                autoFocus
                                            />
                                            <span className="text-sm text-gray-500">%</span>
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {(agency.commissionRate * 100).toFixed(1)}%
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {editingId === agency.id ? (
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                                            onClick={() => handleSaveCommission(agency.id)}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handleEdit(agency)}
                                        >
                                            <Pencil className="h-3 w-3 text-gray-500" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
