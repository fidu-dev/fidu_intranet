'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log corporate error reporting here
    console.error('SERVER_ERROR_BOUNDARY:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-orange-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h1>
        <p className="text-gray-500 mb-4">
          Ocorreu um erro inesperado no servidor. Nossa equipe técnica já foi notificada.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg text-left overflow-auto max-h-40">
            <p className="text-xs font-mono text-red-600 font-bold mb-2">Debug Info:</p>
            <pre className="text-[10px] font-mono text-gray-600 whitespace-pre-wrap">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
              {error.stack && `\n\nStack:\n${error.stack}`}
            </pre>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-[#3b5998] hover:bg-[#2d4373] text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#3b5998]/20"
          >
            <RotateCcw className="h-4 w-4" />
            Tentar Novamente
          </button>

          <Link
            href="/"
            className="w-full bg-white hover:bg-gray-50 text-gray-600 font-semibold py-3 px-6 rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Voltar para o Início
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Se o problema persistir, entre em contato com suporte@fidu.com
        </p>
      </div>
    </div>
  );
}
