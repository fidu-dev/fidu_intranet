import Image from "next/image";
import CadastroForm from "./CadastroForm";

export const dynamic = 'force-dynamic';

export default function CadastroPage() {
    return (
        <div className="min-h-screen relative flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 z-0">
                <Image src="/bg-mountains.jpg" alt="Background Mountais" fill className="object-cover object-center" priority />
                <div className="absolute inset-0 bg-blue-950/70 backdrop-blur-[2px]"></div>
            </div>

            <div className="w-full max-w-4xl pt-8 z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">Seja Parceiro Fidu</h1>
                    <p className="mt-3 text-lg text-blue-100 max-w-2xl mx-auto drop-shadow">
                        Junte-se a nós e ofereça as melhores experiências aos seus passageiros com comissionamento e suporte de ponta.
                    </p>
                </div>

                <CadastroForm />
            </div>
        </div>
    );
}
