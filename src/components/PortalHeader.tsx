'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AgencyInfo } from '@/app/actions';

interface PortalHeaderProps {
    agency?: AgencyInfo;
    hasUnreadMural?: boolean;
}

export function PortalHeader({ agency, hasUnreadMural }: PortalHeaderProps) {
    const pathname = usePathname();

    const navItems = [
        { label: 'Tarifário', href: '/portal', icon: null },
        { label: 'Reservas', href: '/portal/reservas', icon: null, permission: agency?.canReserve },
        { label: 'Mural', href: '/portal/mural', icon: null, showBadge: hasUnreadMural, permission: agency?.canAccessMural },
        { label: 'Portfólio', href: 'https://portfolio.fiduviagens.com.br', icon: null, external: true },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/portal" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity flex items-baseline" style={{ color: '#3b5998' }}>
                        Fidu<span className="text-gray-900">Viagens</span>
                        <span className="ml-2 text-[13px] font-medium text-gray-400 uppercase tracking-wider">Partner</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 border-l pl-6 ml-2">
                        {navItems.map((item) => {
                            const hasPermission = item.permission !== false;
                            if (!hasPermission) return null;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    target={item.external ? "_blank" : undefined}
                                    rel={item.external ? "noopener noreferrer" : undefined}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isActive
                                        ? 'bg-blue-50 text-[#3b5998]'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {item.label}
                                    {item.showBadge && (
                                        <span className="flex h-2 w-2 rounded-full bg-[#3b5998] animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    {agency && (
                        <div className="hidden lg:flex items-center gap-6 text-sm">
                            <div className="flex flex-col text-right">
                                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Agente</span>
                                <span className="text-gray-900 font-semibold">{agency.agentName}</span>
                            </div>
                            <div className="flex flex-col text-right border-l pl-6">
                                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Agência</span>
                                <span className="text-gray-900 font-semibold">{agency.agencyName}</span>
                            </div>
                            {!agency.isInternal && (
                                <div className="flex flex-col text-right border-l pl-6">
                                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Comissão</span>
                                    <span className="bg-blue-50 text-[#3b5998] px-2 py-0.5 rounded font-bold text-xs self-end">
                                        {(agency.commissionRate * 100).toFixed(0)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
