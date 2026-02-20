import { ShieldAlert, Mail } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="h-10 w-10 text-red-500" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
                <p className="text-gray-500 mb-8">
                    Você não tem permissão para acessar este portal. Este portal é exclusivo para parceiros da <strong>Fidu Viagens Intranet</strong>.
                </p>

                <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left flex items-start gap-3">
                    <Mail className="h-5 w-5 text-[#3b5998] mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-[#3b5998]">Como obter acesso?</p>
                        <p className="text-xs text-blue-700/80 mt-1">
                            Entre em contato com seu gestor na Fidu ou envie um e-mail para suporte@fidu.com solicitando a inclusão do seu usuário.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Link
                        href="/portal"
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        Ir para o Portal
                    </Link>

                    <Link
                        href="https://fiduviagens.com"
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Voltar para o site principal
                    </Link>
                </div>
            </div>
        </div>
    );
}
