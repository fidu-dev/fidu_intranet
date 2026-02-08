'use client';

import { AgencyProduct } from '@/lib/airtable/types';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingCart, ArrowUpDown, ChevronUp, ChevronDown, Plus, X, Settings, CheckCircle2, ArrowUp, ArrowDown, RefreshCw, SlidersHorizontal, Filter, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { SalesSimulator } from './SalesSimulator';
import { AgencyInfo } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useCart } from './CartContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Badge } from '@/components/ui/badge';

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
    'SANTIAGO': '#3b5998',
    'SAN PEDRO': '#e6af2e',
    'ATACAMA': '#e6af2e',
    'PUERTO NATALES': '#2ea65a',
    'TORRES DEL PAINE': '#2ea65a',
    'CALAMA': '#7f8c8d',
    'GENERAL': '#34495e',
    'BARILOCHE': '#4b7bec',
    'USHUAIA': '#45aaf2',
    'CALAFATE': '#2d98da',
    'PUERTO VARAS': '#26de81',
};

const getDestinationColor = (dest: string | undefined) => {
    const key = dest?.toUpperCase() || '';
    return DESTINATION_COLORS[key] || '#95a5a6';
};

// Note: 'status' and 'category' are NOT included here as they are now represented by indicator dots
const ALL_COLUMNS = [
    { id: 'destination', label: 'Destino' },
    { id: 'tourName', label: 'Serviço' },
    { id: 'subCategory', label: 'Tags' },
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
    { id: 'temporada', label: 'Disponibilidade' },
    { id: 'duration', label: 'Duração' },
];

const DEFAULT_VISIBLE_COLUMNS = ['tourName', 'provider', 'priceAdulto', 'priceMenor', 'priceBebe', 'pickup', 'diasElegiveis', 'temporada', 'duration', 'subCategory'];

const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof AgencyProduct | string, sortConfig: SortConfig }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc' ?
        <ChevronUp className="ml-1 h-3 w-3 text-[#3b5998]" /> :
        <ChevronDown className="ml-1 h-3 w-3 text-[#3b5998]" />;
};


export function ProductGrid({ products, isInternal, agencyInfo }: ProductGridProps) {
    const { selectedProducts, addToCart, clearCart } = useCart();
    const [visibleColumns, setVisibleColumns] = useLocalStorage<string[]>('fidu_visible_columns', DEFAULT_VISIBLE_COLUMNS);

    // Filter out invalid columns (like 'status', 'category') that may have been saved before they were removed
    useEffect(() => {
        const validColumnIds = ALL_COLUMNS.map(c => c.id);
        const filteredColumns = visibleColumns.filter(col => validColumnIds.includes(col));

        // Only update if there are invalid columns
        if (filteredColumns.length !== visibleColumns.length) {
            setVisibleColumns(filteredColumns);
        }
    }, [visibleColumns, setVisibleColumns]); // Run when visibleColumns/set changes to ensure cleanup happens

    const toggleColumn = (columnId: string) => {
        const newColumns = visibleColumns.includes(columnId)
            ? visibleColumns.filter(id => id !== columnId)
            : [...visibleColumns, columnId];
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

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('REG');
    const [destinationFilter, setDestinationFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [subCategoryFilter, setSubCategoryFilter] = useState('all');
    const [providerFilter, setProviderFilter] = useState('all');
    const [season, setSeason] = useState<'VER26' | 'INV26'>('VER26'); // This is Pricing Mode
    const [temporadaFilter, setTemporadaFilter] = useState('all'); // This is Data Filtering
    const [diasElegiveisFilter, setDiasElegiveisFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'tourName', direction: 'asc' });
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

    const getEffectiveStatus = (status?: any) => {
        if (!status) return 'Inativo';
        if (status === true || status === 'true') return 'Ativo';
        if (status === false || status === 'false') return 'Inativo';

        const s = String(Array.isArray(status) ? status[0] : status).trim();
        if (s.toLowerCase() === 'true') return 'Ativo';
        if (s.toLowerCase() === 'false') return 'Inativo';

        return s || 'Inativo';
    };

    const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).filter((c): c is string => Boolean(c)).sort(), [products]);
    const destinations = useMemo(() => Array.from(new Set(products.map(p => p.destination))).filter((d): d is string => Boolean(d)).sort(), [products]);
    const statuses = useMemo(() => Array.from(new Set(products.map(p => getEffectiveStatus(p.status)))).sort(), [products]);
    const subCategories = useMemo(() => Array.from(new Set(products.flatMap(p => p.subCategory?.split(', ') || []))).filter((sc): sc is string => Boolean(sc)).sort(), [products]);
    const providers = useMemo(() => Array.from(new Set(products.map(p => p.provider))).filter((p): p is string => Boolean(p && p !== '–')).sort(), [products]);
    const eligibleDays = useMemo(() => Array.from(new Set(products.flatMap(p => p.diasElegiveis || []))).filter((d): d is string => Boolean(d)).sort(), [products]);

    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('REG');
        setDestinationFilter('all');
        setStatusFilter('all');
        setSubCategoryFilter('all');
        setProviderFilter('all');
        setTemporadaFilter('all');
        setDiasElegiveisFilter('all');
    };

    const requestSort = (key: keyof AgencyProduct) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleProductClick = (product: AgencyProduct) => {
        const seasonalProduct = {
            ...product,
            priceAdulto: season === 'VER26' ? product.priceAdultoVer26 : product.priceAdultoInv26,
            priceMenor: season === 'VER26' ? product.priceMenorVer26 : product.priceMenorInv26,
            priceBebe: season === 'VER26' ? product.priceBebeVer26 : product.priceBebeInv26,
            netoPriceAdulto: season === 'VER26' ? product.netoPriceAdultoVer26 : product.netoPriceAdultoInv26,
            netoPriceMenor: season === 'VER26' ? product.netoPriceMenorVer26 : product.netoPriceMenorInv26,
            netoPriceBebe: season === 'VER26' ? product.netoPriceBebeVer26 : product.netoPriceBebeInv26,
            salePriceAdulto: season === 'VER26' ? product.salePriceAdultoVer26 : product.salePriceAdultoInv26,
            salePriceMenor: season === 'VER26' ? product.salePriceMenorVer26 : product.salePriceMenorInv26,
            salePriceBebe: season === 'VER26' ? product.salePriceBebeVer26 : product.salePriceBebeInv26,
        };

        addToCart(seasonalProduct);
        setIsSimulatorOpen(true);
    };

    const filteredProducts = useMemo(() => {
        let result = products.filter(product => {
            const matchesSearch =
                (product.tourName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (product.destination?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
            const matchesDestination = destinationFilter === 'all' || product.destination === destinationFilter;
            const matchesStatus = statusFilter === 'all' || getEffectiveStatus(product.status) === statusFilter;
            const matchesSubCategory = subCategoryFilter === 'all' || (product.subCategory || '').includes(subCategoryFilter);
            const matchesProvider = providerFilter === 'all' || product.provider === providerFilter;
            const matchesTemporada = temporadaFilter === 'all' || (product.temporada || '').toUpperCase().includes(temporadaFilter.toUpperCase().replace('26', ''));
            const matchesDias = diasElegiveisFilter === 'all' || (product.diasElegiveis || []).includes(diasElegiveisFilter);

            return matchesSearch && matchesCategory && matchesDestination && matchesStatus && matchesSubCategory && matchesProvider && matchesTemporada && matchesDias;
        });

        if (sortConfig.key) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof AgencyProduct];
                const bValue = b[sortConfig.key as keyof AgencyProduct];
                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [products, searchTerm, categoryFilter, destinationFilter, statusFilter, subCategoryFilter, providerFilter, sortConfig]);

    const formatPrice = (price: number) => {
        return Math.ceil(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
    };

    return (
        <div className="space-y-6">
            {/* Quick Actions Bar */}
            {selectedProducts.length > 0 && (
                <div className="flex items-center justify-between bg-[#3b5998] text-white p-4 rounded-xl shadow-lg shadow-blue-200/50 animate-in fade-in slide-in-from-top-4 duration-300">
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
                        <Button variant="secondary" size="sm" className="bg-white text-[#3b5998] hover:bg-blue-50 font-bold" onClick={() => setIsSimulatorOpen(true)}>
                            Ver Simulação
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={clearCart}>
                            <X className="h-4 w-4 mr-1" />
                            Limpar
                        </Button>
                    </div>
                </div>
            )}

            <div className="pt-2 pb-1">
                <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
                    Tarifário <span className="text-gray-300 text-lg">|</span> <span className="text-gray-500 font-bold">2026</span>
                </h1>
            </div>

            {/* Refactored Horizontal Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100 items-center">

                {/* 1. Search (Compact) */}
                <div className="relative w-full lg:w-72 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Buscar passeio ou destino..."
                        className="pl-9 border-gray-200 focus:ring-blue-500 rounded-lg h-9 bg-gray-50/50 border-none transition-all focus:bg-white focus:shadow-md text-sm shadow-inner"
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Separator */}
                <div className="h-5 w-[1px] bg-gray-200 hidden lg:block mx-1" />

                {/* 2. Destination (Select) */}
                <div className="w-full lg:w-48 shrink-0">
                    <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                        <SelectTrigger className="w-full h-9 border-gray-200 bg-gray-50/50 rounded-lg text-xs font-bold text-gray-600 focus:ring-0 border-none shadow-sm">
                            <SelectValue placeholder="Todos os Destinos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Destinos</SelectItem>
                            {destinations.map(dest => (
                                <SelectItem key={dest} value={dest}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getDestinationColor(dest) }} />
                                        {dest}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 3. Price Mode (Compact) */}
                {/* 3. Price Mode (Enhanced) */}
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 h-9 items-center">
                    <button
                        onClick={() => setSeason('VER26')}
                        className={`px-4 h-full rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${season === 'VER26' ? 'bg-white text-orange-600 shadow-sm ring-1 ring-black/5 scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className={season === 'VER26' ? "w-2 h-2 rounded-full bg-orange-500" : "w-2 h-2 rounded-full bg-gray-300"} />
                        Verão
                    </button>
                    <button
                        onClick={() => setSeason('INV26')}
                        className={`px-4 h-full rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${season === 'INV26' ? 'bg-white text-[#3b5998] shadow-sm ring-1 ring-black/5 scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className={season === 'INV26' ? "w-2 h-2 rounded-full bg-[#3b5998]" : "w-2 h-2 rounded-full bg-gray-300"} />
                        Inverno
                    </button>
                </div>

                {/* Active Filter Indicators (Compact) */}
                {(categoryFilter !== 'REG' || statusFilter !== 'all' || temporadaFilter !== 'all' || subCategoryFilter !== 'all' || providerFilter !== 'all' || diasElegiveisFilter !== 'all') && (
                    <div className="hidden xl:flex items-center gap-1 overflow-hidden px-2">
                        <div className="w-[1px] h-4 bg-gray-200 mr-2" />
                        <span className="text-[10px] text-[#3b5998] font-bold whitespace-nowrap bg-blue-50 px-2 py-0.5 rounded-full">Filtros ativos</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-6 px-2 text-red-500 hover:bg-red-50 rounded-full text-[9px] uppercase hover:text-red-700"
                        >
                            Limpar
                        </Button>
                    </div>
                )}

                {/* Spacer */}
                <div className="hidden lg:block lg:flex-1" />

                {/* 4. Actions */}
                <div className="flex items-center gap-2 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 mt-2 lg:mt-0">

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className={`h-9 rounded-lg border-gray-200 gap-2 font-bold text-xs uppercase hover:bg-gray-50 px-3 ml-auto lg:ml-0 flex-1 lg:flex-none ${(categoryFilter !== 'REG' || statusFilter !== 'all' || temporadaFilter !== 'all' || subCategoryFilter !== 'all' || providerFilter !== 'all' || diasElegiveisFilter !== 'all') ? 'text-[#3b5998] border-blue-200 bg-blue-50/30' : 'text-gray-600'}`}>
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span className="">Filtros</span>
                                {(categoryFilter !== 'REG' || statusFilter !== 'all' || temporadaFilter !== 'all' || subCategoryFilter !== 'all' || providerFilter !== 'all' || diasElegiveisFilter !== 'all') && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#3b5998]" />
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-md p-0 overflow-y-auto">
                            <SheetHeader className="p-6 border-b bg-gray-50/30">
                                <SheetTitle className="text-xl font-black flex items-center gap-2 text-gray-800">
                                    <Filter className="h-5 w-5 text-gray-400" />
                                    Filtros
                                </SheetTitle>
                            </SheetHeader>
                            <div className="p-6 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Disponibilidade (Temporada)</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setTemporadaFilter('all')} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${temporadaFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Todas</button>
                                        <button onClick={() => setTemporadaFilter('INV26')} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${temporadaFilter === 'INV26' ? 'bg-[#3b5998] text-white border-[#3b5998]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Inverno</button>
                                        <button onClick={() => setTemporadaFilter('VER26')} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${temporadaFilter === 'VER26' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Verão</button>
                                        <button onClick={() => setTemporadaFilter('Ano Todo')} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${temporadaFilter === 'Ano Todo' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Ano Todo</button>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-gray-100 w-full" />

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status Operacional</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setStatusFilter('all')} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${statusFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Todos</button>
                                        {statuses.map(stat => (
                                            <button key={stat} onClick={() => setStatusFilter(stat)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${statusFilter === stat ? (stat === 'Ativo' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-800 text-white border-gray-800') : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                                                {stat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Serviço</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => setCategoryFilter('all')} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${categoryFilter === 'all' ? 'bg-[#3b5998] text-white border-[#3b5998] shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Todos</button>
                                        <button onClick={() => setCategoryFilter('REG')} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${categoryFilter === 'REG' ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Regular</button>
                                        <button onClick={() => setCategoryFilter('PVD')} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${categoryFilter === 'PVD' ? 'bg-gray-700 text-white border-gray-700 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Privado</button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Operador</label>
                                    <Select value={providerFilter} onValueChange={setProviderFilter}>
                                        <SelectTrigger className="w-full border-gray-200 rounded-xl h-11 bg-gray-50/50">
                                            <SelectValue placeholder="Selecione o Operador" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Operadores</SelectItem>
                                            {providers.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tags</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setSubCategoryFilter('all')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${subCategoryFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}>Todas</button>
                                        {subCategories.map(tag => (
                                            <button key={tag} onClick={() => setSubCategoryFilter(tag)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${subCategoryFilter === tag ? 'bg-[#3b5998] text-white border-[#3b5998]' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100 group'}`}>
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dias Elegíveis</label>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setDiasElegiveisFilter('all')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${diasElegiveisFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}>Todos</button>
                                        {eligibleDays.map(day => (
                                            <button key={day} onClick={() => setDiasElegiveisFilter(day)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${diasElegiveisFilter === day ? 'bg-[#3b5998] text-white border-[#3b5998]' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}>
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 mt-auto border-t bg-gray-50/50">
                                <SheetClose asChild>
                                    <Button className="w-full rounded-xl bg-[#3b5998] hover:bg-[#2d4373] h-12 font-bold shadow-lg shadow-blue-100">Ver Resultados</Button>
                                </SheetClose>
                                <Button variant="ghost" className="w-full mt-2 text-xs font-bold text-gray-400 hover:text-red-500" onClick={clearFilters}>Limpar Filtros</Button>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="h-5 w-[1px] bg-gray-200 hidden lg:block" />

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#3b5998] hover:bg-blue-50 h-9 w-9 rounded-lg shrink-0" title="Legenda">
                                <Info className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4" align="end">
                            <div className="space-y-4">
                                <h4 className="font-bold text-sm text-gray-900 border-b pb-2 mb-2">Legenda</h4>

                                <div>
                                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status Operacional</h5>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-green-500/10 shadow-sm shrink-0" />
                                            <span className="text-xs text-gray-700 font-medium">Ativo</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-gray-300/10 shadow-sm shrink-0" />
                                            <span className="text-xs text-gray-500 font-medium">Inativo</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo de Serviço</h5>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 ring-4 ring-yellow-400/10 shadow-sm shrink-0" />
                                            <span className="text-xs text-gray-700 font-medium">Regular</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-gray-800 ring-4 ring-gray-800/10 shadow-sm shrink-0" />
                                            <span className="text-xs text-gray-700 font-medium">Privado</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#3b5998] hover:bg-blue-50 h-9 w-9 rounded-lg shrink-0" title="Colunas">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                            <div className="p-4 border-b">
                                <h4 className="font-bold text-sm">Configurar Tabela</h4>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest p-2">Visíveis</div>
                                {visibleColumns.map((colId, index) => {
                                    const colDef = ALL_COLUMNS.find(c => c.id === colId);
                                    if (!colDef) return null;
                                    return (
                                        <div key={colId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 group">
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col">
                                                    <button disabled={index === 0} onClick={() => moveColumn(index, 'up')} className="text-gray-300 hover:text-[#3b5998] disabled:opacity-20"><ArrowUp className="h-3 w-3" /></button>
                                                    <button disabled={index === visibleColumns.length - 1} onClick={() => moveColumn(index, 'down')} className="text-gray-300 hover:text-[#3b5998] disabled:opacity-20"><ArrowDown className="h-3 w-3" /></button>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{colDef.label}</span>
                                            </div>
                                            <button onClick={() => toggleColumn(colId)} className="text-gray-300 hover:text-red-500"><X className="h-3 w-3" /></button>
                                        </div>
                                    );
                                })}
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest p-2 mt-4">Invisíveis</div>
                                {ALL_COLUMNS.filter(col => !visibleColumns.includes(col.id)).map(col => (
                                    <button key={col.id} onClick={() => toggleColumn(col.id)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 group">
                                        <span className="text-sm text-gray-500 group-hover:text-[#3b5998]">{col.label}</span>
                                        <Plus className="h-4 w-4 text-gray-300 group-hover:text-[#3b5998]" />
                                    </button>
                                ))}
                            </div>
                            <div className="p-3 bg-gray-50/50 border-t">
                                <Button variant="ghost" size="sm" onClick={() => setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)} className="w-full text-[10px] font-bold text-[#3b5998] hover:bg-blue-100 uppercase gap-2">
                                    <RefreshCw className="h-3 w-3" /> Restaurar Padrão
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                {visibleColumns.filter(c => c !== 'status' && c !== 'category').map(colId => {
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
                                    if (['priceAdulto', 'priceMenor', 'priceBebe'].includes(colId)) return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort(season === 'VER26' ? `${colId}Ver26` : `${colId}Inv26` as any)}>
                                            <div className="flex items-center justify-end">{ALL_COLUMNS.find(c => c.id === colId)?.label} <SortIcon columnKey={season === 'VER26' ? `${colId}Ver26` : `${colId}Inv26`} sortConfig={sortConfig} /></div>
                                        </th>
                                    );
                                    if (colId === 'provider') return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('provider')}>
                                            <div className="flex items-center">Operador <SortIcon columnKey="provider" sortConfig={sortConfig} /></div>
                                        </th>
                                    );

                                    const colDef = ALL_COLUMNS.find(c => c.id === colId);
                                    let label = colDef?.label || colId;

                                    return (
                                        <th key={colId} className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort(colId as any)}>
                                            <div className="flex items-center">{label} <SortIcon columnKey={colId} sortConfig={sortConfig} /></div>
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
                                    <tr key={product.id} className={`hover:bg-blue-50/30 transition-colors group cursor-pointer ${isSelected ? 'bg-blue-50/40' : ''}`} onClick={() => handleProductClick(product)}>
                                        {visibleColumns.filter(c => c !== 'status' && c !== 'category').map(colId => {
                                            if (colId === 'destination') return (
                                                <td key={colId} className="px-4 py-4 whitespace-nowrap">
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setDestinationFilter(product.destination ?? ''); }} className="text-white text-[10px] font-black px-4 py-1.5 rounded-md shadow-sm transition-transform active:scale-95 hover:opacity-90 uppercase tracking-wider" style={{ backgroundColor: getDestinationColor(product.destination) }}>
                                                        {product.destination}
                                                    </button>
                                                </td>
                                            );
                                            if (colId === 'tourName') {
                                                const status = getEffectiveStatus(product.status);
                                                const isActive = status.toLowerCase() === 'ativo';
                                                const isRegular = product.category === 'REG';
                                                return (
                                                    <td key={colId} className="px-4 py-5 min-w-[250px]">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex gap-1 mt-1 shrink-0">
                                                                {/* Status Indicator */}
                                                                <div
                                                                    className={`w-2 h-2 rounded-full shadow-sm ${isActive ? 'bg-green-500 ring-4 ring-green-500/10' : 'bg-gray-300 ring-4 ring-gray-300/10'}`}
                                                                    title={status}
                                                                />
                                                                {/* Type Indicator */}
                                                                <div
                                                                    className={`w-2 h-2 rounded-full shadow-sm ${isRegular ? 'bg-yellow-400 ring-4 ring-yellow-400/10' : 'bg-gray-800 ring-4 ring-gray-800/10'}`}
                                                                    title={isRegular ? 'Regular' : 'Privado'}
                                                                />
                                                            </div>
                                                            <div className="text-sm font-bold text-gray-700 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2" title={product.tourName}>
                                                                {product.tourName}
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            if (colId === 'subCategory') return (
                                                <td key={colId} className="px-4 py-5 text-xs">
                                                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                        {product.subCategory ? product.subCategory.split(', ').map(tag => (
                                                            <button
                                                                key={tag}
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); setSubCategoryFilter(tag); }}
                                                                className="bg-gray-50 text-gray-400 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase hover:bg-gray-100 hover:text-gray-600 transition-all border border-gray-100 whitespace-nowrap"
                                                            >
                                                                {tag}
                                                            </button>
                                                        )) : '-'}
                                                    </div>
                                                </td>
                                            );
                                            if (colId === 'provider') return (
                                                <td key={colId} className="px-4 py-5 text-xs">
                                                    {product.provider && product.provider !== '–' ? (
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setProviderFilter(product.provider ?? ''); }} className="text-gray-400 px-0 py-0 font-medium hover:text-blue-600 transition-all whitespace-nowrap text-[11px]">
                                                            {product.provider}
                                                        </button>
                                                    ) : '-'}
                                                </td>
                                            );
                                            if (['priceAdulto', 'priceMenor', 'priceBebe'].includes(colId)) {
                                                const price = season === 'VER26' ? (product as any)[`${colId}Ver26`] : (product as any)[`${colId}Inv26`];
                                                const netoPrice = season === 'VER26' ? (product as any)[`netoPrice${colId.charAt(5).toUpperCase() + colId.slice(6)}Ver26`] : (product as any)[`netoPrice${colId.charAt(5).toUpperCase() + colId.slice(6)}Inv26`];
                                                const actualPrice = isInternal ? price : netoPrice;

                                                // Theme Colors & Hierarchy
                                                const isWinter = season === 'INV26';

                                                let textColorClass = "";
                                                if (colId === 'priceAdulto') {
                                                    textColorClass = isWinter ? "text-[#3b5998]" : "text-orange-600";
                                                } else if (colId === 'priceMenor') {
                                                    textColorClass = isWinter ? "text-[#3b5998]/80" : "text-orange-600/80";
                                                } else if (colId === 'priceBebe') {
                                                    textColorClass = isWinter ? "text-[#3b5998]/60" : "text-orange-600/60";
                                                }

                                                return (
                                                    <td key={colId} className={`px-4 py-5 text-right w-24 ${isInternal ? '' : 'cursor-help'}`} title={isInternal ? undefined : `Sugestão de Venda: ${formatPrice(price || 0)}`}>
                                                        <span className={`text-base font-bold tracking-tight ${textColorClass}`}>
                                                            {formatPrice(actualPrice || 0)}
                                                        </span>
                                                    </td>
                                                );
                                            }
                                            if (colId === 'diasElegiveis') return (
                                                <td key={colId} className="px-4 py-5 text-xs">
                                                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                        {product.diasElegiveis?.map(day => (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); setDiasElegiveisFilter(day); }}
                                                                className="bg-gray-100/80 text-gray-500 px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase hover:bg-gray-200 transition-all active:scale-95 border border-gray-200/50 whitespace-nowrap"
                                                            >
                                                                {day}
                                                            </button>
                                                        )) || '-'}
                                                    </div>
                                                </td>
                                            );
                                            if (colId === 'temporada') return (
                                                <td key={colId} className="px-4 py-4 text-xs">
                                                    <div className="flex flex-col gap-1">
                                                        {(Array.isArray(product.temporada) ? product.temporada : (product.temporada?.split(', ') || [])).map(temp => {
                                                            const t = temp.toUpperCase();
                                                            const isWinter = t.includes('INV') || t.includes('INVERNO') || t.includes('NEVE');
                                                            const isSummer = (t.includes('VER') && !t.includes('INVER')) || t.includes('VERÃO') || t.includes('SOL');
                                                            const isAllYear = t.includes('ANO TODO');

                                                            let colors = 'bg-gray-100 text-gray-600 border-gray-200';
                                                            if (isWinter) colors = 'bg-blue-50 text-blue-800 border-blue-100';
                                                            if (isSummer) colors = 'bg-orange-50 text-orange-800 border-orange-100';
                                                            if (isAllYear) colors = 'bg-green-50 text-green-800 border-green-100';

                                                            return (
                                                                <button
                                                                    key={temp}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTemporadaFilter(isWinter ? 'INV26' : isSummer ? 'VER26' : 'Ano Todo');
                                                                    }}
                                                                    className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase transition-all shadow-sm border active:scale-95 text-center whitespace-nowrap ${colors}`}
                                                                >
                                                                    {temp}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                            const val = (product as any)[colId];
                                            return <td key={colId} className="px-4 py-4 text-xs text-gray-500 truncate max-w-[150px]" title={val}>{val || '-'}</td>;
                                        })}
                                        <td className="px-4 py-4 text-center">
                                            {isSelected ? (
                                                <div className="bg-blue-600 text-white p-1.5 rounded-full inline-flex"><CheckCircle2 className="h-4 w-4" /></div>
                                            ) : (
                                                <div className="text-gray-300 group-hover:text-blue-500 transition-colors p-1.5 rounded-full inline-flex border border-transparent group-hover:border-blue-100"><Plus className="h-4 w-4" /></div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredProducts.length === 0 && (
                    <div className="text-center py-20 text-gray-500 bg-gray-50/50">Nenhum passeio encontrado.</div>
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
