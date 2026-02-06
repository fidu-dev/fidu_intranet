'use client';

import { AgencyProduct } from '@/app/actions';
import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Info, Clock, Calendar, CheckCircle2, AlertCircle, ShoppingCart, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

interface ProductGridProps {
    products: AgencyProduct[];
}

type SortConfig = {
    key: keyof AgencyProduct | '';
    direction: 'asc' | 'desc';
};

const DESTINATION_COLORS: Record<string, string> = {
    'SANTIAGO': '#3b5998', // Fidu Blue
    'SAN PEDRO': '#e6af2e', // Deep Yellow/Orange
    'ATACAMA': '#e6af2e',
    'PUERTO NATALES': '#2ea65a', // Green
    'TORRES DEL PAINE': '#2ea65a',
    'CALAMA': '#7f8c8d', // Gray
    'GENERAL': '#34495e',
};

const getDestinationColor = (dest: string) => {
    const key = dest.toUpperCase();
    return DESTINATION_COLORS[key] || '#95a5a6'; // Default silver/gray
};

export function ProductGrid({ products }: ProductGridProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('REG');
    const [destinationFilter, setDestinationFilter] = useState('all');
    const [seasonFilter, setSeasonFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'tourName', direction: 'asc' });

    // Extract unique filters
    const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);
    const destinations = useMemo(() => Array.from(new Set(products.map(p => p.destination))).sort(), [products]);
    const seasons = useMemo(() => {
        const allSeasons = products.map(p => p.temporada).filter(Boolean) as string[];
        return Array.from(new Set(allSeasons)).sort();
    }, [products]);

    const requestSort = (key: keyof AgencyProduct) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter and Sort logic
    const filteredProducts = useMemo(() => {
        let result = products.filter(product => {
            const matchesSearch =
                (product.tourName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (product.destination?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
            const matchesDestination = destinationFilter === 'all' || product.destination === destinationFilter;
            const matchesSeason = seasonFilter === 'all' || product.temporada === seasonFilter;

            return matchesSearch && matchesCategory && matchesDestination && matchesSeason;
        });

        if (sortConfig.key) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof AgencyProduct];
                const bValue = b[sortConfig.key as keyof AgencyProduct];

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [products, searchTerm, categoryFilter, destinationFilter, seasonFilter, sortConfig]);

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof AgencyProduct }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
        return sortConfig.direction === 'asc' ?
            <ChevronUp className="ml-1 h-3 w-3 text-[#3b5998]" /> :
            <ChevronDown className="ml-1 h-3 w-3 text-[#3b5998]" />;
    };

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Pesquisar passeios ou destinos..."
                        className="pl-10 border-gray-200 focus:ring-blue-500 rounded-lg"
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                        <SelectTrigger className="flex-1 lg:w-40 border-gray-200 rounded-lg">
                            <SelectValue placeholder="Destino" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Destinos</SelectItem>
                            {destinations.map(dest => (
                                <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="flex-1 lg:w-40 border-gray-200 rounded-lg">
                            <SelectValue placeholder="Serviço" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Serviços</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                        <SelectTrigger className="flex-1 lg:w-40 border-gray-200 rounded-lg">
                            <SelectValue placeholder="Temporada" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Temporadas</SelectItem>
                            {seasons.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th
                                    className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight w-20 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => requestSort('category')}
                                >
                                    <div className="flex items-center">Tipo <SortIcon columnKey="category" /></div>
                                </th>
                                <th
                                    className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => requestSort('destination')}
                                >
                                    <div className="flex items-center">Destino <SortIcon columnKey="destination" /></div>
                                </th>
                                <th
                                    className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => requestSort('tourName')}
                                >
                                    <div className="flex items-center">Serviço <SortIcon columnKey="tourName" /></div>
                                </th>
                                <th
                                    className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => requestSort('netoPriceAdulto')}
                                >
                                    <div className="flex items-center justify-end">Neto (ADU) <SortIcon columnKey="netoPriceAdulto" /></div>
                                </th>
                                <th
                                    className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => requestSort('netoPriceMenor')}
                                >
                                    <div className="flex items-center justify-end">Neto (CHD) <SortIcon columnKey="netoPriceMenor" /></div>
                                </th>
                                <th
                                    className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => requestSort('netoPriceBebe')}
                                >
                                    <div className="flex items-center justify-end">Neto (INF) <SortIcon columnKey="netoPriceBebe" /></div>
                                </th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight">Pickup</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight">Retorno</th>
                                <th
                                    className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => requestSort('temporada')}
                                >
                                    <div className="flex items-center">Temporada <SortIcon columnKey="temporada" /></div>
                                </th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight">Dias</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${product.category === 'REG' ? 'bg-yellow-100 text-yellow-700' :
                                            product.category === 'PVD' ? 'bg-gray-100 text-gray-700' :
                                                'bg-blue-100 text-[#3b5998]'
                                            }`}>
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className="text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-sm" style={{ backgroundColor: getDestinationColor(product.destination) }}>
                                            {product.destination}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 min-w-[200px]">
                                        <div className="text-sm font-medium text-gray-900 group-hover:text-[#3b5998]">
                                            {product.tourName}
                                        </div>
                                    </td>
                                    <td
                                        className="px-4 py-4 text-right cursor-help"
                                        title={`Sugestão de Venda: ${formatPrice(product.salePriceAdulto)}`}
                                    >
                                        <span className="text-sm font-bold text-gray-900">
                                            {formatPrice(product.netoPriceAdulto)}
                                        </span>
                                    </td>
                                    <td
                                        className="px-4 py-4 text-right cursor-help"
                                        title={`Sugestão de Venda: ${formatPrice(product.salePriceMenor)}`}
                                    >
                                        <span className="text-sm font-bold text-gray-900">
                                            {formatPrice(product.netoPriceMenor)}
                                        </span>
                                    </td>
                                    <td
                                        className="px-4 py-4 text-right cursor-help"
                                        title={`Sugestão de Venda: ${formatPrice(product.salePriceBebe)}`}
                                    >
                                        <span className="text-sm font-bold text-gray-900">
                                            {formatPrice(product.netoPriceBebe)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                                        {product.pickup || '--:--'}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                                        {product.retorno || '--:--'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded border border-cyan-100 whitespace-nowrap">
                                            {product.temporada}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {product.diasElegiveis?.map(dia => (
                                                <span key={dia} className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">
                                                    {dia}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20 text-gray-500 bg-gray-50/50">
                        Nenhum passeio encontrado para os filtros selecionados.
                    </div>
                )}
            </div>
        </div>
    );
}
