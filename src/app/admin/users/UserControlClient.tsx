'use client';

import { useState } from 'react';
import { updateUserAccess } from '@/app/admin/actions';

export function UserControlClient({ initialUsers, agencies }: { initialUsers: any[], agencies: any[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [saving, setSaving] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = async (user: any) => {
        setSaving(user.id);
        try {
            await updateUserAccess(user.id, {
                name: user.name,
                email: user.email,
                agencyId: user.agencyId,
                role: user.role,
                flagMural: user.flagMural,
                flagExchange: user.flagExchange,
                flagReserva: user.flagReserva,
            });
            alert('Salvo com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar usuário!');
        } finally {
            setSaving(null);
        }
    };

    const updateField = (id: string, field: string, value: any) => {
        setUsers(users.map(u => u.id === id ? { ...u, [field]: value } : u));
    };

    const filteredUsers = users.filter(u =>
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agencies.find(a => a.id === u.agencyId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b">
                <input
                    type="text"
                    placeholder="Buscar usuários por e-mail, nome ou agência..."
                    className="w-full max-w-sm px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 bg-gray-50 uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Usuário / Email</th>
                            <th className="px-6 py-4">Nome da Agência</th>
                            <th className="px-6 py-4">Role / Acesso</th>
                            <th className="px-6 py-4">Permissões Especiais</th>
                            <th className="px-6 py-4 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <input
                                        type="email"
                                        className="w-full px-2 py-1 text-xs border rounded bg-white font-medium mb-1"
                                        placeholder="Email"
                                        value={user.email || ''}
                                        onChange={(e) => updateField(user.id, 'email', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 text-xs border rounded bg-white"
                                        placeholder="Nome do Agente"
                                        value={user.name || ''}
                                        onChange={(e) => updateField(user.id, 'name', e.target.value)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        className="w-full px-2 py-1 text-xs border rounded bg-white text-gray-700 font-medium"
                                        value={user.agencyId || ''}
                                        onChange={(e) => updateField(user.id, 'agencyId', e.target.value || null)}
                                    >
                                        <option value="">-- Sem Agência --</option>
                                        {agencies.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        className="w-full px-2 py-1 text-xs border rounded bg-white"
                                        value={user.role}
                                        onChange={(e) => updateField(user.id, 'role', e.target.value)}
                                    >
                                        <option value="ADMIN">Administrador</option>
                                        <option value="VENDEDOR_INTERNO">Interno / Operações</option>
                                        <option value="AGENCIA_PARCEIRA">Agência Parceira</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-2 text-xs">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={user.flagMural} onChange={(e) => updateField(user.id, 'flagMural', e.target.checked)} className="rounded text-blue-600" />
                                            Mural
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={user.flagExchange} onChange={(e) => updateField(user.id, 'flagExchange', e.target.checked)} className="rounded text-blue-600" />
                                            Câmbio (Exchange)
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={user.flagReserva} onChange={(e) => updateField(user.id, 'flagReserva', e.target.checked)} className="rounded text-blue-600" />
                                            Reservas
                                        </label>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleSave(user)}
                                        disabled={saving === user.id}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {saving === user.id ? 'Salvando...' : 'Atualizar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
