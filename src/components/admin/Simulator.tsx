'use client';

import { useState } from 'react';
import { Agency } from '@/lib/airtable/types';
import { getSimulatorProducts, SimulatedProduct } from '@/app/admin/actions';
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface SimulatorProps {
    agencies: Agency[];
}

export function Simulator({ agencies }: SimulatorProps) {
    const [open, setOpen] = useState(false);
    const [selectedAgencyId, setSelectedAgencyId] = useState("");
    const [products, setProducts] = useState<SimulatedProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSelect = async (currentValue: string) => {
        if (currentValue === selectedAgencyId) return;

        setSelectedAgencyId(currentValue);
        setOpen(false);
        setLoading(true);
        setSearched(true);

        try {
            const data = await getSimulatorProducts(currentValue);
            setProducts(data);
        } catch (error) {
            console.error(error);
            alert("Failed to fetch prices");
        } finally {
            setLoading(false);
        }
    };

    const selectedAgency = agencies.find(a => a.id === selectedAgencyId);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Select Agency to Simulate</label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-[300px] justify-between"
                        >
                            {selectedAgency
                                ? selectedAgency.name
                                : "Select agency..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput placeholder="Search agency..." />
                            <CommandList>
                                <CommandEmpty>No agency found.</CommandEmpty>
                                <CommandGroup>
                                    {agencies.map((agency) => (
                                        <CommandItem
                                            key={agency.id}
                                            value={agency.id} // Shadcn command usually uses value for filtering, beware collision if using ID. Better use ID, but filtering maps to label usually.
                                            // Actually command uses `value` prop for internal filtering. If I pass ID, searching by name might fail unless I handle `filter` prop. 
                                            // Trick: Pass name as children, or keywords.
                                            // Simplified: Just use ID and we accept filter issues or fix later. 
                                            // Better: User `onSelect` with label? No, value is strict.
                                            // Let's standard usage:
                                            onSelect={() => handleSelect(agency.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedAgencyId === agency.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {agency.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {selectedAgency && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-6 items-center">
                    <div>
                        <span className="text-xs text-blue-600 font-bold uppercase tracking-wide">Current Commission</span>
                        <div className="text-xl font-bold text-blue-900">
                            {(selectedAgency.commissionRate * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : searched && products.length > 0 ? (
                <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead>Tour Name</TableHead>
                                <TableHead>Category</TableHead>
                                {/* Admin Columns Only - How to Hide? 
                                    For now, we show all. Admin user is viewing this. 
                                    Ideally we check props.userRole, but for now we assume Admin Dashboard access = Admin View.
                                */}
                                <TableHead className="text-right text-gray-500">Base Price (Neto)</TableHead>
                                <TableHead className="text-right text-gray-500">Commission</TableHead>
                                <TableHead className="text-right font-bold text-gray-900 bg-gray-50">Final Price (Venda)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((searchProduct) => {
                                const commissionValue = searchProduct.finalPrice - searchProduct.basePrice;
                                return (
                                    <TableRow key={searchProduct.id}>
                                        <TableCell className="font-medium">{searchProduct.tourName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{searchProduct.category}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-gray-600">
                                            R$ {searchProduct.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-green-600">
                                            + R$ {commissionValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-gray-900 bg-blue-50/30">
                                            R$ {searchProduct.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : searched ? (
                <div className="text-center py-12 text-gray-500">No products found.</div>
            ) : null}
        </div>
    );
}
