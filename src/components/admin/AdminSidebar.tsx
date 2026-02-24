'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Package, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
    { icon: Users, label: "Controle de Acesso", href: "/admin/users" },
    { icon: Package, label: "Agências", href: "/admin/agencies" },
    { icon: Settings, label: "Configurações", href: "/admin/settings" },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r hidden md:flex flex-col">
            <nav className="flex-1 p-4 space-y-1 mt-2">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50 text-[#3b5998]"
                                    : "text-gray-600 hover:bg-gray-100/50 hover:text-gray-900"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
