import { getAgencyProducts } from '@/app/actions';
import { redirect } from 'next/navigation';

export default async function ReservasPage() {
    const { products, agency, error } = await getAgencyProducts();

    if (error) {
        return (
            <main className="container mx-auto px-6 py-10">
                <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-100">
                    {error}
                </div>
            </main>
        );
    }

    // STRICT ACCESS CONTROL: Redirect if agent is not authorized to reserve
    if (!agency?.canReserve) {
        redirect('/portal');
    }

    return (
        <main className="container mx-auto px-6 py-10">
            <div className="mb-10">
                <h1 className="text-3xl font-bold mb-2" style={{ color: '#3b5998' }}>Solicitar Reserva</h1>
                <p className="text-gray-500">
                    Preencha os dados abaixo para solicitar sua reserva. Nossa equipe entrará em contato para confirmar.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-3xl mx-auto">
                {/* 
                    Mockup of a reservation form. 
                    In a real scenario, this would be a client component with validation and a server action to save to Airtable.
                */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Passeio</label>
                            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                <option value="">Selecione um passeio...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.destination} - {p.tourName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Data da Reserva</label>
                            <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Adultos</label>
                            <input type="number" min="1" defaultValue="1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Crianças (Menor)</label>
                            <input type="number" min="0" defaultValue="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Bebês (INF)</label>
                            <input type="number" min="0" defaultValue="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Nome dos Passageiros</label>
                        <textarea rows={4} placeholder="Ex: João Silva, Maria Silva..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>

                    <div className="pt-6">
                        <button className="w-full py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all" style={{ backgroundColor: '#3b5998' }}>
                            Enviar Solicitação de Reserva
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-4">
                            Ao enviar, você receberá uma cópia da solicitação por e-mail.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
