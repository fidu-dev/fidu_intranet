'use client';

import { AgencyProduct } from '@/lib/airtable/types';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingCart, ArrowUpDown, ChevronUp, ChevronDown, Plus, X, Settings, CheckCircle2, ArrowUp, ArrowDown, RefreshCw, SlidersHorizontal, Filter, Info, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { SalesSimulator } from './SalesSimulator';
import { AgencyInfo } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useCart } from './CartContext';
import { Badge } from '@/components/ui/badge';
import { saveUserPreferences } from '@/app/actions';

interface ProductGridProps {
    products: AgencyProduct[];
    isInternal?: boolean;
    agencyInfo?: AgencyInfo;
    initialPreferences?: any;
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
    // Trim and normalize the destination to handle trailing spaces or inconsistent casing
    const key = (dest || '').trim().toUpperCase();
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

const DEFAULT_VISIBLE_COLUMNS = ['tourName', 'priceAdulto', 'priceMenor', 'priceBebe', 'pickup', 'retorno', 'diasElegiveis', 'subCategory'];

const SortIcon = ({ columnKey, sortConfig }: { columnKey: keyof AgencyProduct | string, sortConfig: SortConfig }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc' ?
        <ChevronUp className="ml-1 h-3 w-3 text-[#3b5998]" /> :
        <ChevronDown className="ml-1 h-3 w-3 text-[#3b5998]" />;
};


export function ProductGrid({ products, isInternal, agencyInfo, initialPreferences }: ProductGridProps) {
    const { selectedProducts, addToCart, clearCart } = useCart();

    const prefs = initialPreferences || {};

    const [visibleColumns, setVisibleColumns] = useState<string[]>(prefs.visibleColumns || DEFAULT_VISIBLE_COLUMNS);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(prefs.columnWidths || {});
    const [showSuggestedPrice, setShowSuggestedPrice] = useState(prefs.showSuggestedPrice || false);

    // Debounced preferences save
    useEffect(() => {
        const timeout = setTimeout(() => {
            saveUserPreferences({
                visibleColumns,
                columnWidths,
                showSuggestedPrice,
            }).catch(console.error);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [visibleColumns, columnWidths, showSuggestedPrice]);

    // Resize handlers
    const resizingColumn = useRef<{ id: string; startX: number; startWidth: number } | null>(null);

    const onResizeStart = (e: React.MouseEvent, columnId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const header = (e.target as HTMLElement).closest('th');
        if (!header) return;

        resizingColumn.current = {
            id: columnId,
            startX: e.pageX,
            startWidth: header.offsetWidth,
        };

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!resizingColumn.current) return;
            const diff = moveEvent.pageX - resizingColumn.current.startX;
            const newWidth = Math.max(50, resizingColumn.current.startWidth + diff);
            setColumnWidths(prev => ({
                ...prev,
                [resizingColumn.current!.id]: newWidth
            }));
        };

        const onMouseUp = () => {
            resizingColumn.current = null;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const availableColumns = useMemo(() => {
        return isInternal ? ALL_COLUMNS : ALL_COLUMNS.filter(c => c.id !== 'provider');
    }, [isInternal]);

    // Filter out invalid columns (like 'status', 'category') that may have been saved before they were removed
    useEffect(() => {
        const validColumnIds = availableColumns.map(c => c.id);
        const filteredColumns = visibleColumns.filter(col => validColumnIds.includes(col));

        // Only update if there are invalid columns
        if (filteredColumns.length !== visibleColumns.length) {
            setVisibleColumns(filteredColumns);
        }
    }, [visibleColumns, availableColumns]); // Run when visibleColumns/set changes to ensure cleanup happens

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
    const [statusFilter, setStatusFilter] = useState('Ativo');
    const [subCategoryFilter, setSubCategoryFilter] = useState<string[]>([]);
    const [providerFilter, setProviderFilter] = useState('all');
    const [season, setSeason] = useState<'VER26' | 'INV26'>('VER26'); // This is Pricing Mode
    const [temporadaFilter, setTemporadaFilter] = useState('all'); // This is Data Filtering
    const [diasElegiveisFilter, setDiasElegiveisFilter] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'tourName', direction: 'asc' });
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
    const [selectedDetailProduct, setSelectedDetailProduct] = useState<AgencyProduct | null>(null);

    const getEffectiveStatus = (status?: any) => {
        if (!status) return 'Inativo';
        if (status === true || status === 'true') return 'Ativo';
        if (status === false || status === 'false') return 'Inativo';

        const s = String(Array.isArray(status) ? status[0] : status).trim();
        if (s.toLowerCase() === 'true') return 'Ativo';
        if (s.toLowerCase() === 'false') return 'Inativo';

        return s || 'Inativo';
    };

    const categories = useMemo(() => Array.from(new Set(products.map(p => (p.category || '').trim()))).filter((c): c is string => Boolean(c)).sort(), [products]);
    const destinations = useMemo(() => Array.from(new Set(products.map(p => (p.destination || '').trim()))).filter((d): d is string => Boolean(d)).sort(), [products]);
    const statuses = useMemo(() => Array.from(new Set(products.map(p => getEffectiveStatus(p.status)))).sort(), [products]);
    const subCategories = useMemo(() => Array.from(new Set(products.flatMap(p => p.subCategory?.split(', ') || []))).filter((sc): sc is string => Boolean(sc)).sort(), [products]);
    const providers = useMemo(() => Array.from(new Set(products.map(p => (p.provider || '').trim()))).filter((p): p is string => Boolean(p && p !== '–')).sort(), [products]);
    const eligibleDays = useMemo(() => {
        const WEEKDAY_ORDER: Record<string, number> = {
            'DOMINGO': 0, 'SEGUNDA': 1, 'SEGUNDA-FEIRA': 1,
            'TERÇA': 2, 'TERÇA-FEIRA': 2, 'TERCA': 2,
            'QUARTA': 3, 'QUARTA-FEIRA': 3,
            'QUINTA': 4, 'QUINTA-FEIRA': 4,
            'SEXTA': 5, 'SEXTA-FEIRA': 5,
            'SÁBADO': 6, 'SABADO': 6,
        };
        const days = Array.from(new Set(products.flatMap(p => p.diasElegiveis || []))).filter((d): d is string => Boolean(d));
        return days.sort((a, b) => {
            const aKey = a.toUpperCase().trim();
            const bKey = b.toUpperCase().trim();
            const aOrder = WEEKDAY_ORDER[aKey] ?? 99;
            const bOrder = WEEKDAY_ORDER[bKey] ?? 99;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.localeCompare(b, 'pt-BR');
        });
    }, [products]);

    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('REG');
        setDestinationFilter('all');
        setStatusFilter('all');
        setSubCategoryFilter([]);
        setProviderFilter('all');
        setTemporadaFilter('all');
        setDiasElegiveisFilter([]);
    };

    const toggleSubCategory = (tag: string) => {
        setSubCategoryFilter(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const toggleDiasElegiveis = (day: string) => {
        setDiasElegiveisFilter(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
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
            const matchesCategory = categoryFilter === 'all' || (product.category || '').trim() === categoryFilter;
            const matchesDestination = destinationFilter === 'all' || (product.destination || '').trim() === destinationFilter;
            const matchesStatus = statusFilter === 'all' || getEffectiveStatus(product.status) === statusFilter;
            const matchesSubCategory = subCategoryFilter.length === 0 || subCategoryFilter.some(tag => (product.subCategory || '').includes(tag));
            const matchesProvider = providerFilter === 'all' || product.provider === providerFilter;
            const matchesTemporada = temporadaFilter === 'all' || (product.temporada || '').toUpperCase().includes(temporadaFilter.toUpperCase().replace('26', ''));
            const matchesDias = diasElegiveisFilter.length === 0 || diasElegiveisFilter.some(day => (product.diasElegiveis || []).includes(day));

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
                <div className="flex items-center justify-between bg-[#3b5998] text-white p-4 rounded-xl shadow-lg shadow-[#3b5998]/20 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">{selectedProducts.length} passeio(s) na simulação</p>
                            <p className="text-[10px] text-white/80">Clique no botão ao lado para ver o orçamento consolidado</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="bg-white text-[#3b5998] hover:bg-gray-50 font-bold" onClick={() => setIsSimulatorOpen(true)}>
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
                        className="pl-9 border-gray-200 focus:ring-[#3b5998] rounded-lg h-9 bg-gray-50/50 border-none transition-all focus:bg-white focus:shadow-md text-sm shadow-inner"
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
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 h-9 items-center group relative cursor-pointer" onClick={() => setSeason(s => s === 'VER26' ? 'INV26' : 'VER26')} title="Alternar Temporada">
                    {/* Toggle Switch Background */}
                    <div
                        className="absolute w-1/2 h-7 bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out"
                        style={{ left: season === 'VER26' ? '4px' : 'calc(50% - 4px)' }}
                    />

                    <div className={`relative z-10 px-4 h-full rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${season === 'VER26' ? 'text-orange-600' : 'text-gray-400'}`}>
                        <span className={season === 'VER26' ? "w-2 h-2 rounded-full bg-orange-500" : "w-2 h-2 rounded-full bg-gray-300"} />
                        Verão
                    </div>
                    <div className={`relative z-10 px-4 h-full rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${season === 'INV26' ? 'text-[#3b5998]' : 'text-gray-400'}`}>
                        <span className={season === 'INV26' ? "w-2 h-2 rounded-full bg-[#3b5998]" : "w-2 h-2 rounded-full bg-gray-300"} />
                        Inverno
                    </div>
                </div>

                {/* Separator */}
                <div className="h-5 w-[1px] bg-gray-200 hidden lg:block mx-1" />

                {/* Suggested Price Toggle */}
                {!isInternal && (
                    <div className="flex items-center gap-2 shrink-0">
                        <label htmlFor="priceToggle" className="text-xs font-bold text-gray-600 cursor-pointer select-none flex items-center gap-2" title="Preço Sugerido (Original) vs Preço Líquido (Comissão deduzida)">
                            Ver Valor Sugerido
                        </label>
                        <button
                            id="priceToggle"
                            role="switch"
                            aria-checked={showSuggestedPrice}
                            onClick={() => setShowSuggestedPrice(!showSuggestedPrice)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3b5998] focus:ring-offset-2 ${showSuggestedPrice ? 'bg-[#3b5998]' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showSuggestedPrice ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                )}

                {/* Active Filter Indicators (Compact) */}
                {(categoryFilter !== 'REG' || statusFilter !== 'all' || temporadaFilter !== 'all' || subCategoryFilter.length > 0 || providerFilter !== 'all' || diasElegiveisFilter.length > 0) && (
                    <div className="hidden xl:flex items-center gap-1 overflow-hidden px-2">
                        <div className="w-[1px] h-4 bg-gray-200 mr-2" />
                        <span className="text-[10px] text-[#3b5998] font-bold whitespace-nowrap bg-[#3b5998]/5 px-2 py-0.5 rounded-full">Filtros ativos</span>
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
                            <Button variant="outline" className={`h-9 rounded-lg border-gray-200 gap-2 font-bold text-xs uppercase hover:bg-gray-50 px-3 ml-auto lg:ml-0 flex-1 lg:flex-none ${(categoryFilter !== 'REG' || statusFilter !== 'all' || temporadaFilter !== 'all' || subCategoryFilter.length > 0 || providerFilter !== 'all' || diasElegiveisFilter.length > 0) ? 'text-[#3b5998] border-[#3b5998]/20 bg-[#3b5998]/5' : 'text-gray-600'}`}>
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span className="">Filtros</span>
                                {(categoryFilter !== 'REG' || statusFilter !== 'all' || temporadaFilter !== 'all' || subCategoryFilter.length > 0 || providerFilter !== 'all' || diasElegiveisFilter.length > 0) && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#3b5998]" />
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
                            <SheetHeader className="p-4 border-b bg-gray-50/30 shrink-0">
                                <SheetTitle className="text-lg font-black flex items-center gap-2 text-gray-800 uppercase tracking-tight">
                                    <Filter className="h-4 w-4 text-gray-400" />
                                    Filtros
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto">
                                <div className="p-6 space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Disponibilidade (Temporada)</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                <button onClick={() => setTemporadaFilter('all')} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${temporadaFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Todas</button>
                                                <button onClick={() => setTemporadaFilter('INV26')} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${temporadaFilter === 'INV26' ? 'bg-[#3b5998] text-white border-[#3b5998]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Inverno</button>
                                                <button onClick={() => setTemporadaFilter('VER26')} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${temporadaFilter === 'VER26' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Verão</button>
                                                <button onClick={() => setTemporadaFilter('Ano Todo')} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${temporadaFilter === 'Ano Todo' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Ano Todo</button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status Operacional</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                <button onClick={() => setStatusFilter('all')} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${statusFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Todos</button>
                                                {statuses.map(stat => (
                                                    <button key={stat} onClick={() => setStatusFilter(stat)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${statusFilter === stat ? (stat === 'Ativo' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-800 text-white border-gray-800') : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                                                        {stat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Serviço</label>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => setCategoryFilter('all')} className={`flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${categoryFilter === 'all' ? 'bg-[#3b5998] text-white border-[#3b5998] shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Todos</button>
                                                <button onClick={() => setCategoryFilter('REG')} className={`flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${categoryFilter === 'REG' ? 'bg-yellow-500 text-white border-yellow-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Regular</button>
                                                <button onClick={() => setCategoryFilter('PVD')} className={`flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${categoryFilter === 'PVD' ? 'bg-gray-700 text-white border-gray-700 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Privado</button>
                                            </div>
                                        </div>

                                        {isInternal && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Operador</label>
                                                <Select value={providerFilter} onValueChange={setProviderFilter}>
                                                    <SelectTrigger className="w-full border-gray-200 rounded-lg h-9 bg-gray-50/50 text-xs">
                                                        <SelectValue placeholder="Selecione o Operador" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Todos os Operadores</SelectItem>
                                                        {providers.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Tags Section */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tags</label>
                                            <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50/50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <button onClick={() => setSubCategoryFilter([])} className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all ${subCategoryFilter.length === 0 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>Todas</button>
                                                {subCategories.map(tag => (
                                                    <button key={tag} onClick={() => toggleSubCategory(tag)} className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all ${subCategoryFilter.includes(tag) ? 'bg-[#3b5998] text-white border-[#3b5998]' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Dias Elegíveis Section */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dias Elegíveis</label>
                                            <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50/50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <button onClick={() => setDiasElegiveisFilter([])} className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all ${diasElegiveisFilter.length === 0 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>Todos</button>
                                                {eligibleDays.map(day => (
                                                    <button key={day} onClick={() => toggleDiasElegiveis(day)} className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all ${diasElegiveisFilter.includes(day) ? 'bg-[#3b5998] text-white border-[#3b5998]' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Footer */}
                            <div className="p-4 border-t bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-10 rounded-lg text-xs font-bold text-gray-400 hover:text-red-500 border-gray-100 hover:bg-red-50"
                                    onClick={clearFilters}
                                >
                                    Limpar Filtros
                                </Button>
                                <SheetClose asChild>
                                    <Button className="flex-[2] h-10 rounded-lg bg-[#3b5998] hover:bg-[#2d4373] text-white text-xs font-bold shadow-lg shadow-[#3b5998]/10 ring-1 ring-white/10">
                                        Aplicar / Fechar
                                    </Button>
                                </SheetClose>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="h-5 w-[1px] bg-gray-200 hidden lg:block" />

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#3b5998] hover:bg-[#3b5998]/5 h-9 w-9 rounded-lg shrink-0" title="Legenda">
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
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-[#3b5998] hover:bg-[#3b5998]/5 h-9 w-9 rounded-lg shrink-0" title="Colunas">
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
                                    const colDef = availableColumns.find(c => c.id === colId);
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
                                {availableColumns.filter(col => !visibleColumns.includes(col.id)).map(col => (
                                    <button key={col.id} onClick={() => toggleColumn(col.id)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#3b5998]/5 group">
                                        <span className="text-sm text-gray-500 group-hover:text-[#3b5998]">{col.label}</span>
                                        <Plus className="h-4 w-4 text-gray-300 group-hover:text-[#3b5998]" />
                                    </button>
                                ))}
                            </div>
                            <div className="p-3 bg-gray-50/50 border-t">
                                <Button variant="ghost" size="sm" onClick={() => { setVisibleColumns(DEFAULT_VISIBLE_COLUMNS); setColumnWidths({}); }} className="w-full text-[10px] font-bold text-[#3b5998] hover:bg-[#3b5998]/10 uppercase gap-2">
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
                                        <th
                                            key={colId}
                                            className="group relative px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors"
                                            style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}
                                            onClick={() => requestSort('destination')}
                                        >
                                            <div className="flex items-center">Destino <SortIcon columnKey="destination" sortConfig={sortConfig} /></div>
                                            <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#3b5998]/30 transition-colors z-10" onMouseDown={(e) => onResizeStart(e, colId)} />
                                        </th>
                                    );
                                    if (colId === 'tourName') return (
                                        <th
                                            key={colId}
                                            className="group relative px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors"
                                            style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}
                                            onClick={() => requestSort('tourName')}
                                        >
                                            <div className="flex items-center">Serviço <SortIcon columnKey="tourName" sortConfig={sortConfig} /></div>
                                            <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#3b5998]/30 transition-colors z-10" onMouseDown={(e) => onResizeStart(e, colId)} />
                                        </th>
                                    );
                                    if (['priceAdulto', 'priceMenor', 'priceBebe'].includes(colId)) return (
                                        <th
                                            key={colId}
                                            className="group relative px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                            style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}
                                            onClick={() => requestSort(season === 'VER26' ? `${colId}Ver26` : `${colId}Inv26` as any)}
                                        >
                                            <div className="flex items-center justify-end">{ALL_COLUMNS.find(c => c.id === colId)?.label} <SortIcon columnKey={season === 'VER26' ? `${colId}Ver26` : `${colId}Inv26`} sortConfig={sortConfig} /></div>
                                            <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#3b5998]/30 transition-colors z-10" onMouseDown={(e) => onResizeStart(e, colId)} />
                                        </th>
                                    );
                                    if (colId === 'provider') return (
                                        <th
                                            key={colId}
                                            className="group relative px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors"
                                            style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}
                                            onClick={() => requestSort('provider')}
                                        >
                                            <div className="flex items-center">Operador <SortIcon columnKey="provider" sortConfig={sortConfig} /></div>
                                            <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#3b5998]/30 transition-colors z-10" onMouseDown={(e) => onResizeStart(e, colId)} />
                                        </th>
                                    );

                                    const colDef = ALL_COLUMNS.find(c => c.id === colId);
                                    let label = colDef?.label || colId;

                                    return (
                                        <th
                                            key={colId}
                                            className="group relative px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight cursor-pointer hover:bg-gray-100 transition-colors"
                                            style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}
                                            onClick={() => requestSort(colId as any)}
                                        >
                                            <div className="flex items-center">{label} <SortIcon columnKey={colId} sortConfig={sortConfig} /></div>
                                            <div className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#3b5998]/30 transition-colors z-10" onMouseDown={(e) => onResizeStart(e, colId)} />
                                        </th>
                                    );
                                })}
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-center w-10">Info</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-tight text-center w-10">Add</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map((product) => {
                                const isSelected = selectedProducts.find(p => p.id === product.id);
                                return (
                                    <tr key={product.id} className={`hover:bg-[#3b5998]/5 transition-colors group cursor-pointer ${isSelected ? 'bg-[#3b5998]/5' : ''}`} onClick={() => handleProductClick(product)}>
                                        {visibleColumns.filter(c => c !== 'status' && c !== 'category').map(colId => {
                                            if (colId === 'destination') return (
                                                <td key={colId} className="px-4 py-4 whitespace-nowrap overflow-hidden" style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setDestinationFilter(product.destination ?? ''); }} className="text-white text-[10px] font-black px-4 py-1.5 rounded-md shadow-sm transition-transform active:scale-95 hover:opacity-90 uppercase tracking-wider" style={{ backgroundColor: getDestinationColor(product.destination) }}>
                                                        {product.destination}
                                                    </button>
                                                </td>
                                            );
                                            if (colId === 'tourName') {
                                                const status = getEffectiveStatus(product.status);
                                                const isActive = status.toLowerCase() === 'ativo';
                                                const cat = (product.category || '').trim();
                                                const isRegular = cat === 'REG' || cat === 'REGULAR';
                                                return (
                                                    <td key={colId} className="px-4 py-5 overflow-hidden" style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}>
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
                                                            <div className="text-sm font-bold text-gray-700 leading-snug group-hover:text-[#3b5998] transition-colors line-clamp-2" title={product.tourName}>
                                                                {product.tourName}
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            if (colId === 'subCategory') return (
                                                <td key={colId} className="px-4 py-5 text-xs overflow-hidden" style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}>
                                                    <div className="flex flex-wrap gap-1 max-w-full">
                                                        {product.subCategory ? product.subCategory.split(', ').map(tag => (
                                                            <button
                                                                key={tag}
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); toggleSubCategory(tag); }}
                                                                className={`px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase transition-all border whitespace-nowrap ${subCategoryFilter.includes(tag) ? 'bg-[#3b5998] text-white border-[#3b5998]' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100 hover:text-gray-600'}`}
                                                            >
                                                                {tag}
                                                            </button>
                                                        )) : '-'}
                                                    </div>
                                                </td>
                                            );
                                            if (colId === 'provider') return (
                                                <td key={colId} className="px-4 py-5 text-xs overflow-hidden" style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}>
                                                    {product.provider && product.provider !== '–' ? (
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setProviderFilter(product.provider ?? ''); }} className="text-gray-400 px-0 py-0 font-medium hover:text-[#3b5998] transition-all whitespace-nowrap text-[11px]">
                                                            {product.provider}
                                                        </button>
                                                    ) : '-'}
                                                </td>
                                            );
                                            if (['priceAdulto', 'priceMenor', 'priceBebe'].includes(colId)) {
                                                const price = season === 'VER26' ? (product as any)[`${colId}Ver26`] : (product as any)[`${colId}Inv26`];
                                                const netoPrice = season === 'VER26' ? (product as any)[`netoPrice${colId.charAt(5).toUpperCase() + colId.slice(6)}Ver26`] : (product as any)[`netoPrice${colId.charAt(5).toUpperCase() + colId.slice(6)}Inv26`];
                                                // Se Internal ou ShowSuggestedPrice for true, exibe preço cheio do DB, senão exibe Neto (deduzida a comissão)
                                                const actualPrice = (isInternal || showSuggestedPrice) ? price : netoPrice;

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
                                                    <td key={colId} className={`px-4 py-5 text-right overflow-hidden ${(isInternal || showSuggestedPrice) ? '' : 'cursor-help'}`} style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }} title={(isInternal || showSuggestedPrice) ? undefined : `Valor base: ${formatPrice(price || 0)}`}>
                                                        {(!isInternal && showSuggestedPrice && price !== netoPrice) && (
                                                            <div className="text-[10px] text-gray-400 line-through mb-0.5 leading-none mr-0.5">{formatPrice(netoPrice || 0)}</div>
                                                        )}
                                                        <span className={`text-base font-bold tracking-tight ${textColorClass}`}>
                                                            {formatPrice(actualPrice || 0)}
                                                        </span>
                                                    </td>
                                                );
                                            }
                                            if (colId === 'diasElegiveis') return (
                                                <td key={colId} className="px-4 py-5 text-xs overflow-hidden" style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}>
                                                    <div className="flex flex-wrap gap-1 max-w-full">
                                                        {product.diasElegiveis?.map(day => (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); toggleDiasElegiveis(day); }}
                                                                className={`px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase transition-all active:scale-95 border whitespace-nowrap ${diasElegiveisFilter.includes(day) ? 'bg-[#3b5998] text-white border-[#3b5998]' : 'bg-gray-100/80 text-gray-500 border-gray-200/50 hover:bg-gray-200'}`}
                                                            >
                                                                {day}
                                                            </button>
                                                        )) || '-'}
                                                    </div>
                                                </td>
                                            );
                                            if (colId === 'temporada') return (
                                                <td key={colId} className="px-4 py-4 text-xs overflow-hidden" style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }}>
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
                                            return <td key={colId} className="px-4 py-4 text-xs text-gray-500 overflow-hidden" style={{ width: columnWidths[colId] || 'auto', minWidth: columnWidths[colId] || 'auto' }} title={val}>{val || '-'}</td>;
                                        })}
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedDetailProduct(product); }}
                                                className="text-gray-400 hover:text-[#3b5998] transition-colors p-1.5 rounded-full hover:bg-[#3b5998]/5"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {isSelected ? (
                                                <div className="bg-[#3b5998] text-white p-1.5 rounded-full inline-flex"><CheckCircle2 className="h-4 w-4" /></div>
                                            ) : (
                                                <div className="text-gray-300 group-hover:text-[#3b5998] transition-colors p-1.5 rounded-full inline-flex border border-transparent group-hover:border-[#3b5998]/10"><Plus className="h-4 w-4" /></div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Details Side Sheet */}
            <Sheet open={!!selectedDetailProduct} onOpenChange={(open) => !open && setSelectedDetailProduct(null)}>
                <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
                    {selectedDetailProduct && (
                        <>
                            <SheetHeader className="p-6 border-b bg-gray-50/50 shrink-0 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        {selectedDetailProduct.destination}
                                    </div>
                                    <div className="flex gap-1">
                                        <div className={`w-2 h-2 rounded-full ${getEffectiveStatus(selectedDetailProduct.status).toLowerCase() === 'ativo' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <div className={`w-2 h-2 rounded-full ${selectedDetailProduct.category === 'REG' ? 'bg-yellow-400' : 'bg-gray-800'}`} />
                                    </div>
                                </div>
                                <SheetTitle className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight text-left">
                                    {selectedDetailProduct.tourName}
                                </SheetTitle>
                                {isInternal && selectedDetailProduct.provider && selectedDetailProduct.provider !== '–' && (
                                    <p className="text-xs font-bold text-[#3b5998] mt-1 uppercase tracking-wider">
                                        Operador: {selectedDetailProduct.provider}
                                    </p>
                                )}
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pickup</label>
                                        <p className="text-sm font-bold text-gray-700">{selectedDetailProduct.pickup || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Retorno</label>
                                        <p className="text-sm font-bold text-gray-700">{selectedDetailProduct.retorno || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Duração</label>
                                        <p className="text-sm font-bold text-gray-700">{selectedDetailProduct.duration || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dias Elegíveis</label>
                                        <p className="text-sm font-bold text-gray-700">{selectedDetailProduct.diasElegiveis?.join(', ') || '-'}</p>
                                    </div>
                                </div>

                                {/* Rich Text Sections */}
                                {(() => {
                                    const p = selectedDetailProduct as AgencyProduct;
                                    const isValuable = (val: any) => {
                                        if (!val) return false;
                                        const v = String(val).trim();
                                        return v !== '' && v !== '-' && v !== '–' && v !== 'N/A' && v !== 'Sem taxa' && v !== 'R$ 0';
                                    };

                                    const sections = [
                                        { label: 'Restrições', value: p.restrictions || p.requirements },
                                        { label: 'Opcionais disponíveis', value: p.optionals },
                                        { label: 'Observações', value: p.observations || p.description },
                                        { label: 'O que levar', value: p.whatToBring },
                                    ].filter(s => isValuable(s.value));

                                    // Special logic for Taxas Extras
                                    const hasTax = p.taxasExtras === 'SIM' || p.taxasExtras === 'true';
                                    if (hasTax && isValuable(p.valorExtra)) {
                                        sections.push({ label: 'Taxas Adicionais', value: p.valorExtra || '' });
                                    }

                                    return sections.map(section => {
                                        const isRestrictions = section.label === 'Restrições';
                                        const chips = isRestrictions
                                            ? String(section.value ?? '').split(/[,\n]+/).map(s => s.trim()).filter(Boolean)
                                            : [];

                                        return (
                                            <div key={section.label} className="space-y-3 bg-gray-50/50 p-5 rounded-xl border border-gray-100/80">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-4 rounded-full ${isRestrictions ? 'bg-red-400' : 'bg-[#3b5998]'}`} />
                                                    <label className={`text-[10px] font-black uppercase tracking-widest ${isRestrictions ? 'text-red-500' : 'text-[#3b5998]'}`}>{section.label}</label>
                                                </div>
                                                {isRestrictions && chips.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {chips.map((chip, i) => (
                                                            <span
                                                                key={i}
                                                                className="inline-flex items-center px-3 py-1 rounded-full border border-red-200 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wide"
                                                            >
                                                                {chip}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                                                        {section.value}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}

                                {/* Seasonal Pricing Table */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tabela de Preços (Completa)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Verão */}
                                        <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/20">
                                            <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                Verão 2026
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-xs text-gray-500 font-bold">Adulto</span>
                                                    <span className="text-sm font-black text-orange-600">{formatPrice((isInternal || showSuggestedPrice) ? (selectedDetailProduct as any).priceAdultoVer26 : (selectedDetailProduct as any).netoPriceAdultoVer26)}</span>
                                                </div>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-xs text-gray-500 font-bold">Menor</span>
                                                    <span className="text-sm font-black text-orange-600/80">{formatPrice((isInternal || showSuggestedPrice) ? (selectedDetailProduct as any).priceMenorVer26 : (selectedDetailProduct as any).netoPriceMenorVer26)}</span>
                                                </div>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-xs text-gray-500 font-bold">Bebê</span>
                                                    <span className="text-sm font-black text-orange-600/60">{formatPrice((isInternal || showSuggestedPrice) ? (selectedDetailProduct as any).priceBebeVer26 : (selectedDetailProduct as any).netoPriceBebeVer26)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Inverno */}
                                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20">
                                            <h4 className="text-[10px] font-black text-[#3b5998] uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#3b5998]" />
                                                Inverno 2026
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-xs text-gray-500 font-bold">Adulto</span>
                                                    <span className="text-sm font-black text-[#3b5998]">{formatPrice((isInternal || showSuggestedPrice) ? (selectedDetailProduct as any).priceAdultoInv26 : (selectedDetailProduct as any).netoPriceAdultoInv26)}</span>
                                                </div>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-xs text-gray-500 font-bold">Menor</span>
                                                    <span className="text-sm font-black text-[#3b5998]/80">{formatPrice((isInternal || showSuggestedPrice) ? (selectedDetailProduct as any).priceMenorInv26 : (selectedDetailProduct as any).netoPriceMenorInv26)}</span>
                                                </div>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-xs text-gray-500 font-bold">Bebê</span>
                                                    <span className="text-sm font-black text-[#3b5998]/60">{formatPrice((isInternal || showSuggestedPrice) ? (selectedDetailProduct as any).priceBebeInv26 : (selectedDetailProduct as any).netoPriceBebeInv26)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t bg-white shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex gap-3">
                                <Button
                                    className="flex-1 h-12 rounded-xl bg-[#3b5998] hover:bg-[#2d4373] text-white font-bold shadow-lg shadow-[#3b5998]/10"
                                    onClick={() => {
                                        if (selectedDetailProduct) {
                                            handleProductClick(selectedDetailProduct);
                                            setSelectedDetailProduct(null);
                                        }
                                    }}
                                >
                                    Adicionar à Simulação
                                </Button>
                                <Button variant="outline" className="h-12 w-12 rounded-xl border-gray-100 text-gray-400" onClick={() => setSelectedDetailProduct(null)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
            {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-gray-500 bg-gray-50/50">Nenhum passeio encontrado.</div>
            )}

            <SalesSimulator
                isOpen={isSimulatorOpen}
                onClose={() => setIsSimulatorOpen(false)}
                agencyInfo={agencyInfo}
            />
        </div>
    );
}
