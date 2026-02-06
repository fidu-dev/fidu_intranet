'use client';

import { AgencyProduct } from '@/app/actions';
import { ProductCard } from './ProductCard';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ProductGridProps {
    products: AgencyProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [destinationFilter, setDestinationFilter] = useState('all');

    // Extract unique filters
    const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);
    const destinations = useMemo(() => Array.from(new Set(products.map(p => p.destination))).sort(), [products]);

    // Filter logic
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch =
                (product.tourName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (product.destination?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
            const matchesDestination = destinationFilter === 'all' || product.destination === destinationFilter;

            return matchesSearch && matchesCategory && matchesDestination;
        });
    }, [products, searchTerm, categoryFilter, destinationFilter]);

    return (
        <div className="space-y-8">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search experiences..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48">
                    <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Destination" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Destinations</SelectItem>
                            {destinations.map(dest => (
                                <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full md:w-48">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    No matches found for your search.
                </div>
            )}
        </div>
    );
}
