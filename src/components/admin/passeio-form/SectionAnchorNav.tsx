'use client';

import { useScrollSpy } from '@/hooks/useScrollSpy';
import { FileText, DollarSign, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
    { id: 'dados-gerais', label: 'Dados Gerais', icon: FileText },
    { id: 'precos', label: 'Preços', icon: DollarSign },
    { id: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
] as const;

const SECTION_IDS = SECTIONS.map(s => s.id);

export function SectionAnchorNav() {
    const activeId = useScrollSpy(SECTION_IDS, {
        rootId: 'admin-main-scroll',
        rootMargin: '-80px 0px -60% 0px',
    });

    const handleClick = (id: string) => {
        const el = document.getElementById(id);
        const scrollContainer = document.getElementById('admin-main-scroll');
        if (el && scrollContainer) {
            const top = el.offsetTop - 80;
            scrollContainer.scrollTo({ top, behavior: 'smooth' });
        }
    };

    return (
        <nav className="sticky top-20 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">Seções</p>
            {SECTIONS.map(section => (
                <button
                    key={section.id}
                    type="button"
                    onClick={() => handleClick(section.id)}
                    className={cn(
                        'flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left',
                        activeId === section.id
                            ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    )}
                >
                    <section.icon className="h-4 w-4 shrink-0" />
                    {section.label}
                </button>
            ))}
        </nav>
    );
}
