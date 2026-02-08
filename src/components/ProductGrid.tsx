'use client';

import { AgencyProduct } from '@/lib/airtable/types';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingCart, ArrowUpDown, ChevronUp, ChevronDown, Plus, X, Settings, CheckCircle2, GripVertical, ArrowUp, ArrowDown, Trash2, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SalesSimulator } from './SalesSimulator';
import { AgencyInfo } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useCart } from './CartContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ProductGridProps {
    products: AgencyProduct[];
    isInternal?: boolean;
    agencyInfo?: AgencyInfo;
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

const ALL_COLUMNS = [
    { id: 'status', label: 'Status' },
    { id: 'category', label: 'Tipo' },
    { id: 'destination', label: 'Destino' },
    { id: 'tourName', label: 'Serviço' },
    { id: 'subCategory', label: 'Categoria' },
    { id: 'provider', label: 'Operador' },
    { id: 'priceAdulto', label: 'Adulto' },
    { id: 'priceMenor', label: 'Menor' },
    { id: 'priceBebe', label: 'Bebê' },
    { id: 'pickup', label: 'Pickup' },
    { id: 'retorno', label: 'Retorno' },
    { id: 'diasElegiveis', label: 'Dias Elegíveis' },
    { id: 'taxasExtras', label: 'Taxas Extras' },
    { id: 'whatToBring', label: 'O que levar' },
    { id: 'description', label: 'Observações' },
    { id: 'requirements', label: 'Restrições' },
    { id: 'temporada', label: 'Temporada' },
    { id: 'duration', label: 'Duração' },
];

const DEFAULT_VISIBLE_COLUMNS = ['category', 'tourName', 'status', 'provider', 'priceAdulto', 'priceMenor', 'priceBebe', 'pickup', 'diasElegiveis', 'temporada', 'duration', 'subCategory'];

const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof AgencyProduct | string, sortConfig: SortConfig }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc' ?
        <ChevronUp className="ml-1 h-3 w-3 text-[#3b5998]" /> :
        <ChevronDown className="ml-1 h-3 w-3 text-[#3b5998]" />;
};


export function ProductGrid({ products, isInternal, agencyInfo }: ProductGridProps) {
    const { selectedProducts, addToCart, clearCart } = useCart();

    // Column Visibility State with Persistence
    const [visibleColumns, setVisibleColumns] = useLocalStorage<string[]>('fidu_visible_columns', DEFAULT_VISIBLE_COLUMNS);

    const toggleColumn = (columnId: string) => {
        const newColumns = visibleColumns.includes(columnId)
            ? visibleColumns.filter(id => id !== columnId)
            : [...visibleColumns, columnId]; // Append to end if adding

        setVisibleColumns(newColumns);
    };

    const moveColumn = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === visibleColumns.length - 1) return;

        const newColumns = [...visibleColumns];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
        setVisibleColumns(newColumns);
    };

    // Reordering logic could go here (moveUp/moveDown functions) but standard append behavior usually sufficient for simple "select to add"

    const isColumnVisible = (id: string) => visibleColumns.includes(id);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('REG');
    const [destinationFilter, setDestinationFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [subCategoryFilter, setSubCategoryFilter] = useState('all');
    const [providerFilter, setProviderFilter] = useState('all');
    const [season, setSeason] = useState<'VER26' | 'INV26'>('VER26'); // Default to Summer 2026
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'tourName', direction: 'asc' });

    // UI Local State
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

    // Extract unique filters
    const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).filter(Boolean).sort(), [products]);
    const destinations = useMemo(() => Array.from(new Set(products.map(p => p.destination))).filter(Boolean).sort(), [products]);
    const statuses = useMemo(() => Array.from(new Set(products.map(p => p.status || 'Ativo'))).filter(Boolean).sort(), [products]);
    const subCategories = useMemo(() => Array.from(new Set(products.map(p => p.subCategory))).filter(Boolean).sort(), [products]);
    const providers = useMemo(() => Array.from(new Set(products.map(p => p.provider))).filter(p => p && p !== '–').sort(), [products]);

    const requestSort = (key: keyof AgencyProduct) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleProductClick = (product: AgencyProduct) => {
        // Create a copy of the product with the ACTIVE season prices mapped to the standard fields
        // This ensures the Cart receives the correct price based on the current toggle
        const seasonalProduct = {
            ...product,
            priceAdulto: season === 'VER26' ? product.priceAdultoVer26 : product.priceAdultoInv26,
            priceMenor: season === 'VER26' ? product.priceMenorVer26 : product.priceMenorInv26,
            priceBebe: season === 'VER26' ? product.priceBebeVer26 : product.priceBebeInv26,
            // Also update net prices if used elsewhere
            netoPriceAdulto: season === 'VER26' ? product.netoPriceAdultoVer26 : product.netoPriceAdultoInv26,
            netoPriceMenor: season === 'VER26' ? product.netoPriceMenorVer26 : product.netoPriceMenorInv26,
            netoPriceBebe: season === 'VER26' ? product.netoPriceBebeVer26 : product.netoPriceBebeInv26,
            // And sale prices
            salePriceAdulto: season === 'VER26' ? product.salePriceAdultoVer26 : product.salePriceAdultoInv26,
            salePriceMenor: season === 'VER26' ? product.salePriceMenorVer26 : product.salePriceMenorInv26,
            salePriceBebe: season === 'VER26' ? product.salePriceBebeVer26 : product.salePriceBebeInv26,
        };

        addToCart(seasonalProduct);
        setIsSimulatorOpen(true);
    };

    // Filter and Sort logic
    const filteredProducts = useMemo(() => {
        let result = products.filter(product => {
            const matchesSearch =
                (product.tourName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (product.destination?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
            const matchesDestination = destinationFilter === 'all' || product.destination === destinationFilter;
            const matchesStatus = statusFilter === 'all' || (product.status || 'Ativo') === statusFilter;
            const matchesSubCategory = subCategoryFilter === 'all' || product.subCategory === subCategoryFilter;
            const matchesProvider = providerFilter === 'all' || product.provider === providerFilter;

            return matchesSearch && matchesCategory && matchesDestination && matchesStatus && matchesSubCategory && matchesProvider;
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
    }, [products, searchTerm, categoryFilter, destinationFilter, sortConfig]);

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
    };

    return (
        <div className="space-y-6">
            {/* Quick Actions Bar */}
            {selectedProducts.length > 0 && (
                <div className="flex items-center justify-between bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-200 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">{selectedProducts.length} passeio(s) na simulação</p>
                            <p className="text-[10px] text-blue-100 opacity-90">Clique no botão ao lado para ver o orçamento consolidado</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white text-blue-600 hover:bg-blue-50 font-bold"
                            onClick={() => setIsSimulatorOpen(true)}
                        >
                            Ver Simulação
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/10"
                            onClick={clearCart}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpar
                        </Button>
                    </div>
                </div>
            )}

            {/* Dynamic Title based on Season - MAIN H1 */}
            <div>
                <h1 className={`text-3xl font-bold transition-colors duration-300 ${season === 'VER26' ? 'text-orange-600' : 'text-blue-700'}`}>
                    {season === 'VER26' ? '☀️ Tarifário de Verão 2026' : '❄️ Tarifário de Inverno 2026'}
                </h1>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                {/* Top Bar: Season Toggle + Column Config */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    {/* Season Toggle - Centered (relative to the flex container) or Left aligned? 
                        User said "Next to season selector", "Same visual level". 
                        Let's group them. 
                    */}
                    <div className="flex items-center gap-4 w-full">
                        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                            <button
                                onClick={() => setSeason('VER26')}
                                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${season === 'VER26'
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Verão 2026
                            </button>
                            <button
                                onClick={() => setSeason('INV26')}
                                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${season === 'INV26'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                Inverno 2026
                            </button>
                        </div>

                        {/* Column Visibility Settings Button */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                                    <Settings className="h-4 w-4" />
                                    <span className="hidden sm:inline">Configurar Colunas</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                                <div className="p-3 border-b border-gray-100">
                                    <h4 className="font-bold text-sm text-gray-900">Organizar Colunas</h4>
                                    <p className="text-xs text-gray-500">Arraste para reordenar (futuro) ou use as setas</p>
                                </div>

                                <div className="max-h-[400px] overflow-y-auto">
                                    {/* Active Columns */}
                                    <div className="p-2 space-y-1">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 mt-1">Visíveis</div>
                                        {visibleColumns.map((colId, index) => {
                                            const colDef = ALL_COLUMNS.find(c => c.id === colId);
                                            if (!colDef) return null;
                                            return (
                                                <div key={colId} className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100 group border border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col">
                                                            <button
                                                                disabled={index === 0}
                                                                onClick={() => moveColumn(index, 'up')}
                                                                className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                                                            >
                                                                <ArrowUp className="h-3 w-3" />
                                                            </button>
                                                            <button
                                                                disabled={index === visibleColumns.length - 1}
                                                                onClick={() => moveColumn(index, 'down')}
                                                                className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                                                            >
                                                                <ArrowDown className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">{colDef.label}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleColumn(colId)}
                                                        className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Available Columns */}
                                    <div className="p-2 pt-0">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 mt-4 pt-4 border-t border-gray-100">Adicionar</div>
                                        <div className="space-y-1">
                                            {ALL_COLUMNS.filter(col => !visibleColumns.includes(col.id)).map(col => {
                                                if (col.restricted && !isInternal) return null;
                                                return (
                                                    <button
                                                        key={col.id}
                                                        onClick={() => toggleColumn(col.id)}
                                                        className="w-full flex items-center justify-between p-2 rounded-md hover:bg-blue-50 text-left group transition-colors"
                                                    >
                                                        <span className="text-sm text-gray-600 group-hover:text-blue-700">{col.label}</span>
                                                        <Plus className="h-4 w-4 text-gray-300 group-hover:text-blue-600" />
                                                    </button>
                                                );
                                            })}
                                            {ALL_COLUMNS.filter(col => !visibleColumns.includes(col.id) && (!col.restricted || isInternal)).length === 0 && (
                                                <div className="text-xs text-center py-4 text-gray-400 italic">
                                                    Todas as colunas visíveis
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-center">
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

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="flex-1 lg:w-32 border-gray-200 rounded-lg">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                {statuses.map(stat => (
                                    <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {subCategories.length > 0 && (
                            <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
                                <SelectTrigger className="flex-1 lg:w-40 border-gray-200 rounded-lg">
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Categorias</SelectItem>
                                    {subCategories.map(sc => (
                                        <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {providers.length > 0 && (
                            <Select value={providerFilter} onValueChange={setProviderFilter}>
                                <SelectTrigger className="flex-1 lg:w-40 border-gray-200 rounded-lg">
                                    <SelectValue placeholder="Operador" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Operadores</SelectItem>
                                    {providers.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                {visibleColumns.map(colId => {
                                    // Custom Headers for specific columns that need Sorting
                                    if (colId === 'category') return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight w-20 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('category')}>
                                            <div className="flex items-center">Tipo <SortIcon columnKey="category" sortConfig={sortConfig} /></div>
                                        </th>
                                    );
                                    if (colId === 'destination') return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('destination')}>
                                            <div className="flex items-center">Destino <SortIcon columnKey="destination" sortConfig={sortConfig} /></div>
                                        </th>
                                    );
                                    if (colId === 'tourName') return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('tourName')}>
                                            <div className="flex items-center">Serviço <SortIcon columnKey="tourName" sortConfig={sortConfig} /></div>
                                        </th>
                                    );
                                    if (colId === 'priceAdulto') return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('netoPriceAdulto')}>
                                            <div className="flex items-center justify-end">Adulto <SortIcon columnKey={season === 'VER26' ? 'netoPriceAdultoVer26' : 'netoPriceAdultoInv26'} sortConfig={sortConfig} /></div>
                                        </th>
                                    );
                                    if (colId === 'priceMenor') return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort(season === 'VER26' ? 'netoPriceMenorVer26' : 'netoPriceMenorInv26')}>
                                            <div className="flex items-center justify-end">Menor <SortIcon columnKey={season === 'VER26' ? 'netoPriceMenorVer26' : 'netoPriceMenorInv26'} sortConfig={sortConfig} /></div>
                                        </th>
                                    );
                                    if (colId === 'priceBebe') return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort(season === 'VER26' ? 'netoPriceBebeVer26' : 'netoPriceBebeInv26')}>
                                            <div className="flex items-center justify-end">Bebê <SortIcon columnKey={season === 'VER26' ? 'netoPriceBebeVer26' : 'netoPriceBebeInv26'} sortConfig={sortConfig} /></div>
                                        </th>
                                    );
                                    if (colId === 'pickup') return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('pickup')}>
                                            <div className="flex items-center">Pickup <SortIcon columnKey="pickup" sortConfig={sortConfig} /></div>
                                        </th>
                                    );
                                    if (colId === 'retorno') return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('retorno')}>
                                            <div className="flex items-center">Retorno <SortIcon columnKey="retorno" sortConfig={sortConfig} /></div>
                                        </th>
                                    );

                                    // Default Header for other fields
                                    const colDef = ALL_COLUMNS.find(c => c.id === colId);
                                    return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-gray-400">
                                            {colDef?.label || colId}
                                        </th>
                                    );
                                })}
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-center">Add</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map((product) => {
                                const isSelected = selectedProducts.find(p => p.id === product.id);
                                return (
                                    <tr
                                        key={product.id}
                                        className={`hover:bg-blue-50/30 transition-colors group cursor-pointer ${isSelected ? 'bg-blue-50/40' : ''}`}
                                        onClick={() => handleProductClick(product)}
                                    >
                                        {visibleColumns.map(colId => {
                                            // Render Cells based on Column ID
                                            if (colId === 'status') return (
                                                <td key={colId} className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${(product.status || 'Ativo').toLowerCase() === 'ativo'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        {product.status || 'Ativo'}
                                                    </span>
                                                </td>
                                            );
                                            if (colId === 'category') return (
                                                <td key={colId} className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${product.category === 'REG' ? 'bg-yellow-100 text-yellow-700' :
                                                        product.category === 'PVD' ? 'bg-gray-100 text-gray-700' :
                                                            'bg-blue-100 text-[#3b5998]'
                                                        }`}>
                                                        {product.category}
                                                    </span>
                                                </td>
                                            );
                                            if (colId === 'destination') return (
                                                <td key={colId} className="px-4 py-4 whitespace-nowrap">
                                                    <span className="text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-sm" style={{ backgroundColor: getDestinationColor(product.destination) }}>
                                                        {product.destination}
                                                    </span>
                                                </td>
                                            );
                                            if (colId === 'tourName') return (
                                                <td key={colId} className="px-4 py-4 min-w-[200px]">
                                                    <div className="text-sm font-medium text-gray-900 group-hover:text-[#3b5998]">
                                                        {product.tourName}
                                                    </div>
                                                </td>
                                            );
                                            if (colId === 'subCategory') return (
                                                <td key={colId} className="px-4 py-4 text-xs text-gray-500">
                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                                                        {product.subCategory || '-'}
                                                    </span>
                                                </td>
                                            );
                                            if (colId === 'provider') return (
                                                <td key={colId} className="px-4 py-4 text-xs text-gray-500">
                                                    {product.provider || '-'}
                                                </td>
                                            );
                                            if (colId === 'priceAdulto') return (
                                                <td key={colId} className={`px-4 py-4 text-right ${isInternal ? '' : 'cursor-help'}`}
                                                    title={isInternal ? undefined : `Sugestão de Venda: ${formatPrice(season === 'VER26' ? product.salePriceAdultoVer26 : product.salePriceAdultoInv26)}`}>
                                                    <span className={`text-sm font-bold ${season === 'VER26' ? 'text-orange-700' : 'text-blue-700'}`}>
                                                        {formatPrice(isInternal
                                                            ? (season === 'VER26' ? product.salePriceAdultoVer26 : product.salePriceAdultoInv26)
                                                            : (season === 'VER26' ? product.netoPriceAdultoVer26 : product.netoPriceAdultoInv26)
                                                        )}
                                                    </span>
                                                </td>
                                            );
                                            if (colId === 'priceMenor') return (
                                                <td key={colId} className={`px-4 py-4 text-right ${isInternal ? '' : 'cursor-help'}`}
                                                    title={isInternal ? undefined : `Sugestão de Venda: ${formatPrice(season === 'VER26' ? product.salePriceMenorVer26 : product.salePriceMenorInv26)}`}>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatPrice(isInternal
                                                            ? (season === 'VER26' ? product.salePriceMenorVer26 : product.salePriceMenorInv26)
                                                            : (season === 'VER26' ? product.netoPriceMenorVer26 : product.netoPriceMenorInv26)
                                                        )}
                                                    </span>
                                                </td>
                                            );
                                            if (colId === 'priceBebe') return (
                                                <td key={colId} className={`px-4 py-4 text-right ${isInternal ? '' : 'cursor-help'}`}
                                                    title={isInternal ? undefined : `Sugestão de Venda: ${formatPrice(season === 'VER26' ? product.salePriceBebeVer26 : product.salePriceBebeInv26)}`}>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatPrice(isInternal
                                                            ? (season === 'VER26' ? product.salePriceBebeVer26 : product.salePriceBebeInv26)
                                                            : (season === 'VER26' ? product.netoPriceBebeVer26 : product.netoPriceBebeInv26)
                                                        )}
                                                    </span>
                                                </td>
                                            );
                                            if (colId === 'pickup') return (
                                                <td key={colId} className="px-4 py-4 text-sm text-gray-500 font-mono">
                                                    {product.pickup || '--:--'}
                                                </td>
                                            );
                                            if (colId === 'retorno') return (
                                                <td key={colId} className="px-4 py-4 text-sm text-gray-500 font-mono">
                                                    {product.retorno || '--:--'}
                                                </td>
                                            );
                                            if (colId === 'diasElegiveis') return (
                                                <td key={colId} className="px-4 py-4 text-xs text-gray-500">
                                                    {product.diasElegiveis?.join(', ') || '-'}
                                                </td>
                                            );
                                            if (colId === 'taxasExtras') return (
                                                <td key={colId} className="px-4 py-4 text-xs text-gray-500 max-w-[150px] truncate" title={product.taxasExtras}>
                                                    {product.taxasExtras || '-'}
                                                </td>
                                            );
                                            if (colId === 'whatToBring') return (
                                                <td key={colId} className="px-4 py-4 text-xs text-gray-500 max-w-[150px] truncate" title={product.whatToBring}>
                                                    {product.whatToBring || '-'}
                                                </td>
                                            );
                                            if (colId === 'description') return (
                                                <td key={colId} className="px-4 py-4 text-xs text-gray-500 max-w-[150px] truncate" title={product.description}>
                                                    {product.description || '-'}
                                                </td>
                                            );
                                            if (colId === 'requirements') return (
                                                <td key={colId} className="px-4 py-4 text-xs text-gray-500 max-w-[150px] truncate" title={product.requirements}>
                                                    {product.requirements || '-'}
                                                </td>
                                            );
                                            if (colId === 'temporada') return (
                                                <td key={colId} className="px-4 py-4 text-xs text-gray-500">
                                                    {product.temporada || '-'}
                                                </td>
                                            );
                                            if (colId === 'duration') return (
                                                <td key={colId} className="px-4 py-4 text-xs text-gray-500">
                                                    {product.duration || '-'}
                                                </td>
                                            );

                                            return <td key={colId} className="px-4 py-4"></td>;
                                        })}

                                        <td className="px-4 py-4 text-center">
                                            {isSelected ? (
                                                <div className="bg-blue-600 text-white p-1.5 rounded-full inline-flex border border-blue-600 shadow-sm shadow-blue-100">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </div>
                                            ) : (
                                                <div className="text-gray-300 group-hover:text-blue-500 transition-colors p-1.5 rounded-full inline-flex border border-transparent group-hover:border-blue-100">
                                                    <Plus className="h-4 w-4" />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20 text-gray-500 bg-gray-50/50">
                        Nenhum passeio encontrado para os filtros selecionados.
                    </div>
                )}
            </div>

            <SalesSimulator
                isOpen={isSimulatorOpen}
                onClose={() => setIsSimulatorOpen(false)}
                agencyInfo={agencyInfo}
            />
        </div>
    );
}
