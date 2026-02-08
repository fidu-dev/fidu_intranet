'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { getExchangeRatesAction } from '@/app/actions';
import { ExchangeRate } from '@/lib/airtable/types';
import { TrendingUp, TrendingDown, Minus, RefreshCw, History, X, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ExchangeTickerProps {
    canAccess: boolean;
}

interface ProcessedRate {
    current: ExchangeRate;
    previous?: ExchangeRate;
    trend: 'up' | 'down' | 'neutral';
    history: ExchangeRate[];
}

export function ExchangeTicker({ canAccess }: ExchangeTickerProps) {
    const [processedRates, setProcessedRates] = useState<ProcessedRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<ExchangeRate[]>([]);

    // Only fetch if canAccess is true
    useEffect(() => {
        if (!canAccess) return;

        async function loadRates() {
            try {
                const { rates: fetchedRates } = await getExchangeRatesAction();

                // Group by currency
                const ratesByCurrency: Record<string, ExchangeRate[]> = {};

                fetchedRates.forEach(rate => {
                    if (!ratesByCurrency[rate.currency]) {
                        ratesByCurrency[rate.currency] = [];
                    }
                    ratesByCurrency[rate.currency].push(rate);
                });

                // Process each currency
                const processed: ProcessedRate[] = Object.keys(ratesByCurrency).map(currency => {
                    const sorted = ratesByCurrency[currency].sort((a, b) => {
                        // Sort descending by date (assuming lastUpdated or createdTime is relevant)
                        // If getLastUpdated is available, use it. Otherwise rely on order from server (which we sorted)
                        const dateA = new Date(a.lastUpdated || '').getTime();
                        const dateB = new Date(b.lastUpdated || '').getTime();
                        return dateB - dateA;
                    });

                    const latest = sorted[0];
                    const previous = sorted.length > 1 ? sorted[1] : undefined;

                    let trend: 'up' | 'down' | 'neutral' = 'neutral';
                    if (previous) {
                        if (latest.value > previous.value) trend = 'up';
                        else if (latest.value < previous.value) trend = 'down';
                    }

                    return {
                        current: latest,
                        previous,
                        trend,
                        history: sorted
                    };
                });

                setProcessedRates(processed);

                // Flatten all history for the modal, sorted by date
                const allHistory = fetchedRates.sort((a, b) => {
                    return new Date(b.lastUpdated || '').getTime() - new Date(a.lastUpdated || '').getTime();
                });
                setHistoryData(allHistory);

                setLoading(false);
            } catch (error) {
                console.error("Failed to load exchange rates", error);
                setLoading(false);
            }
        }

        loadRates();
        // Refresh every 5 minutes
        const interval = setInterval(loadRates, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [canAccess]);

    // Handle history modal toggle
    const toggleHistory = () => setShowHistory(!showHistory);

    // If strictly no access (and not just loading), return null
    if (!canAccess) return null;

    return (
        <>
            <div className="bg-white border-b border-gray-100 h-8 overflow-hidden relative flex items-center">
                {/* Label Fixed with History Button */}
                <div className="absolute left-0 top-0 bottom-0 bg-white z-20 px-3 flex items-center shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] border-r border-gray-50 gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400">CAMBIO</span>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={toggleHistory}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-blue-600"
                        title="Ver Histórico"
                    >
                        <History className="h-3 w-3" />
                    </button>
                </div>

                {/* Marquee Container */}
                <div className="flex-1 overflow-hidden whitespace-nowrap flex items-center pl-28 sm:pl-32">
                    <div className="animate-marquee inline-block">
                        {loading && (
                            <div className="flex items-center gap-2 px-10">
                                <RefreshCw className="h-3 w-3 animate-spin text-gray-300" />
                                <span className="text-[9px] text-gray-300 font-medium">Carregando cotações...</span>
                            </div>
                        )}
                        {!loading && processedRates.length === 0 && (
                            <div className="flex items-center gap-2 px-10">
                                <span className="text-[9px] text-gray-400 font-medium">Nenhuma cotação disponível no momento</span>
                            </div>
                        )}
                        {processedRates.length > 0 && (
                            <>
                                {/* Show items twice for infinite loop effect */}
                                {[...processedRates, ...processedRates, ...processedRates].map((item, idx) => (
                                    <span key={`${item.current.id}-${idx}`} className="inline-flex items-center">
                                        <span className="inline-flex items-center mx-6">
                                            <span className="text-[10px] font-bold text-gray-400 mr-1.5">{item.current.currency}</span>
                                            <span className="text-xs font-black text-gray-700 mr-1.5">
                                                {/* Raw value display as requested. No decimals unless in source. */}
                                                {item.current.symbol} {item.current.value}
                                            </span>

                                            {/* Trend Indicator - Color only, no arrows to reduce noise per request */}
                                            {item.trend === 'up' && <span className="text-[8px] text-red-400 font-bold opacity-70">▲</span>}
                                            {item.trend === 'down' && <span className="text-[8px] text-green-400 font-bold opacity-70">▼</span>}
                                        </span>

                                        {/* Observations */}
                                        {idx % processedRates.length === processedRates.length - 1 && processedRates[0]?.current.observations && (
                                            <span className="inline-flex items-center mx-6 text-[10px] font-medium text-gray-400">
                                                <span className="font-bold mr-1 opacity-70">Obs:</span>
                                                {processedRates[0].current.observations}
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        display: inline-block;
                        animation: marquee 90s linear infinite;
                        white-space: nowrap;
                        will-change: transform;
                    }
                    .animate-marquee:hover {
                        animation-play-state: paused;
                    }
                `}</style>
            </div>

            {/* History Modal Portal */}
            {showHistory && <HistoryModal rates={historyData} onClose={() => setShowHistory(false)} />}
        </>
    );
}

// Sparkline Component
function Sparkline({ data, color }: { data: number[], color: string }) {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const height = 40;
    const width = 120;
    const step = width / (data.length - 1);

    // Create path
    // We want the latest data point on the RIGHT. 
    // Data comes in sorted DESC (newest first). So index 0 is newest.
    // Let's reverse for the chart so index 0 is oldest (left)
    const chartData = [...data].reverse();

    const points = chartData.map((val, i) => {
        const x = i * step;
        const normalizedY = ((val - min) / range) * height;
        const y = height - normalizedY; // Invert Y because SVG 0 is top
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <path
                d={`M ${points}`}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Dot on the last point (newest) */}
            <circle
                cx={width}
                cy={height - (((chartData[chartData.length - 1] - min) / range) * height)}
                r="3"
                fill={color}
            />
        </svg>
    );
}

function HistoryModal({ rates, onClose }: { rates: ExchangeRate[], onClose: () => void }) {
    // State
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [timeFilter, setTimeFilter] = useState<'today' | '7d' | '30d' | 'all'>('7d');

    // Memoized processing
    const { fileteredRates, groupedRates, sparklineData, currencyColor } = useMemo(() => {
        // 1. Filter by Currency
        let filtered = rates.filter(r => r.currency === selectedCurrency);

        // 2. Filter by Time
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));

        if (timeFilter === 'today') {
            filtered = filtered.filter(r => new Date(r.lastUpdated || '').getTime() >= todayStart.getTime());
        } else if (timeFilter === '7d') {
            const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
            filtered = filtered.filter(r => new Date(r.lastUpdated || '').getTime() >= sevenDaysAgo.getTime());
        } else if (timeFilter === '30d') {
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
            filtered = filtered.filter(r => new Date(r.lastUpdated || '').getTime() >= thirtyDaysAgo.getTime());
        }

        // 3. Prepare Sparkline Data (values only)
        const sparklineData = filtered.map(r => r.value);

        // 4. Group by Date (Hoje, Ontem, Full Date)
        const grouped: Record<string, ExchangeRate[]> = {};

        filtered.forEach(rate => {
            const date = new Date(rate.lastUpdated || '');
            const dateStr = date.toDateString();
            const todayStr = new Date().toDateString();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();

            let groupKey = date.toLocaleDateString('pt-BR');
            if (dateStr === todayStr) groupKey = 'Hoje';
            else if (dateStr === yesterdayStr) groupKey = 'Ontem';

            if (!grouped[groupKey]) grouped[groupKey] = [];
            grouped[groupKey].push(rate);
        });

        // Determine color based on currency (just for visual flair)
        // USD = Blue, CLP = Orange, ARS = Light Blue/Cyan (or standard palette)
        let cColor = '#2563eb'; // blue-600
        if (selectedCurrency === 'CLP') cColor = '#ea580c'; // orange-600
        if (selectedCurrency === 'ARS') cColor = '#0891b2'; // cyan-600

        return { fileteredRates: filtered, groupedRates: grouped, sparklineData, currencyColor: cColor };
    }, [rates, selectedCurrency, timeFilter]);

    const currencies = useMemo(() => Array.from(new Set(rates.map(r => r.currency))), [rates]);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Currency Tabs */}
                <div className="bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center justify-between p-4 pb-2">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-gray-400" />
                            <h3 className="font-bold text-gray-900">Histórico de Cotações</h3>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Currency Selector (Tabs) */}
                    <div className="flex px-4 gap-2 mb-0">
                        {['USD', 'CLP', 'ARS'].map(curr => (
                            <button
                                key={curr}
                                onClick={() => setSelectedCurrency(curr)}
                                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${selectedCurrency === curr
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                                    }`}
                            >
                                {curr}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters & Sparkline Area */}
                <div className="p-5 border-b border-gray-100 space-y-4">
                    {/* Time Filters */}
                    <div className="flex justify-center">
                        <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                            {[
                                { id: 'today', label: 'Hoje' },
                                { id: '7d', label: '7 dias' },
                                { id: '30d', label: '30 dias' },
                                { id: 'all', label: 'Tudo' },
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setTimeFilter(filter.id as any)}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${timeFilter === filter.id
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sparkline & Current Value Summary */}
                    <div className="flex items-center justify-between gap-6 px-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Última Cotação</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-gray-900">
                                    {fileteredRates[0]?.symbol} {fileteredRates[0]?.value}
                                </span>
                                {/* Trend vs previous in this filtered list */}
                                {fileteredRates.length > 1 && (
                                    (() => {
                                        const current = fileteredRates[0].value;
                                        const prev = fileteredRates[1].value;
                                        const diff = current - prev;
                                        if (diff === 0) return <span className="text-xs font-bold text-gray-400">-</span>;
                                        return (
                                            <span className={`text-xs font-bold flex items-center ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {diff > 0 ? '+' : ''}{Number.isInteger(diff) ? diff : diff.toFixed(2)}
                                            </span>
                                        );
                                    })()
                                )}
                            </div>
                        </div>

                        {/* Sparkline Chart */}
                        <div className="flex-1 h-10 max-w-[140px]">
                            <Sparkline data={sparklineData} color={currencyColor} />
                        </div>
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto bg-gray-50/30 p-4">
                    {Object.keys(groupedRates).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <Calendar className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs">Nenhum registro encontrado neste período.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedRates).map(([dateLabel, ratesGroup]) => (
                                <div key={dateLabel} className="animate-in slide-in-from-bottom-2 duration-300">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 ml-1 sticky top-0 bg-gray-50/95 backdrop-blur-sm py-1 z-10 w-fit px-2 rounded-md">
                                        {dateLabel}
                                    </h4>
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                        {ratesGroup.map((rate, idx) => {
                                            // Calculate diff with the NEXT item in this specific group OR looking ahead in full filtered list
                                            // To be accurate, we need to compare with the absolute previous record in history, not just within groups.
                                            // Let's find the index of this rate in the main 'fileteredRates' array.
                                            const mainIndex = fileteredRates.findIndex(r => r.id === rate.id);
                                            const previousRate = fileteredRates[mainIndex + 1];

                                            let diff = 0;
                                            if (previousRate) {
                                                diff = rate.value - previousRate.value;
                                            }

                                            return (
                                                <div key={rate.id} className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-700">
                                                                {new Date(rate.lastUpdated || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        {rate.observations && (
                                                            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 font-medium">
                                                                {rate.observations}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {mainIndex < fileteredRates.length - 1 && diff !== 0 && (
                                                            <span className={`text-[10px] font-bold ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                {diff > 0 ? '+' : ''}{Number.isInteger(diff) ? diff : diff.toFixed(2)}
                                                            </span>
                                                        )}
                                                        <span className={`font-mono text-sm font-bold ${diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                            {rate.value}
                                                        </span>
                                                        <div className="w-4 flex justify-center">
                                                            {mainIndex < fileteredRates.length - 1 ? (
                                                                diff > 0 ? <TrendingUp className="h-3 w-3 text-red-500" /> :
                                                                    diff < 0 ? <TrendingDown className="h-3 w-3 text-green-500" /> :
                                                                        <Minus className="h-3 w-3 text-gray-300" />
                                                            ) : (
                                                                <span className="w-3 h-3 block rounded-full bg-gray-100" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white text-center">
                    <button onClick={onClose} className="w-full py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
