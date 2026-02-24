import { PortalHeader } from '@/components/PortalHeader';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Cadastro de Parceiros | Fidu Viagens",
    description: "Seja um parceiro Fidu e ofereça as melhores experiências do mundo.",
};

export default function CadastroLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <PortalHeader isPublic />
            {children}
        </div>
    );
}
