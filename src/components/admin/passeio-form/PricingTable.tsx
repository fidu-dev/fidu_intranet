'use client';

import { Input } from '@/components/ui/input';
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

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
}

export function PricingTable({ seasons, prices, onPriceChange }: PricingTableProps) {
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
                                Nenhuma temporada cadastrada. Adicione temporadas em Configurações de Sistema.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
