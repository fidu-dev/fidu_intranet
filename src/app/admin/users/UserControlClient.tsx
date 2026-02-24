'use client';

import { useState } from 'react';
import { updateUserAccess, createNewUser } from '@/app/admin/actions';

const AVAILABLE_DESTINATIONS = ["ATACAMA", "BARILOCHE", "SANTIAGO"];

export function UserControlClient({ initialUsers, agencies }: { initialUsers: any[], agencies: any[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [saving, setSaving] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [newUser, setNewUser] = useState({
        id: 'new',
        email: '',
        name: '',
        agencyId: '',
        role: 'AGENCIA_PARCEIRA',
        flagMural: false,
        flagExchange: false,
        flagReserva: false,
        allowedDestinations: [] as string[]
    });

    const handleSave = async (user: any) => {
        setSaving(user.id);
        try {
            if (user.id === 'new') {
                const result = await createNewUser({
                    email: user.email,
                    name: user.name,
                    agencyId: user.agencyId,
                    role: user.role,
                    flagMural: user.flagMural,
                    flagExchange: user.flagExchange,
                    flagReserva: user.flagReserva,
                    allowedDestinations: user.allowedDestinations,
                });
                if (result.success && result.user) {
                    setUsers([result.user, ...users]);
                    setIsAddingUser(false);
                    setNewUser({ ...newUser, email: '', name: '', agencyId: '' });
                    alert('Usuário cadastrado com sucesso!');
                }
            } else {
                await updateUserAccess(user.id, {
                    name: user.name,
                    email: user.email,
                    agencyId: user.agencyId,
                    role: user.role,
                    flagMural: user.flagMural,
                    flagExchange: user.flagExchange,
                    flagReserva: user.flagReserva,
                    allowedDestinations: user.allowedDestinations,
                });
                alert('Salvo com sucesso!');
            }
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
            <div className="p-4 border-b flex items-center justify-between">
                <input
                    type="text"
                    placeholder="Buscar usuários por e-mail, nome ou agência..."
                    className="w-full max-w-sm px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                    onClick={() => setIsAddingUser(true)}
                    className="px-4 py-2 bg-[#3b5998] text-white font-semibold rounded-lg text-sm"
                >
                    + Novo Usuário
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 bg-gray-50 uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Usuário / Email</th>
                            <th className="px-6 py-4">Nome da Agência</th>
                            <th className="px-6 py-4">Role / Acesso</th>
                            <th className="px-6 py-4">Permissões Especiais</th>
                            <th className="px-6 py-4">
                                Destinos Permitidos
                                <div className="text-[9px] text-gray-400 font-normal mt-0.5 normal-case tracking-normal">Mantenha limpo para acesso total.</div>
                            </th>
                            <th className="px-6 py-4 text-center">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isAddingUser && (
                            <tr className="bg-blue-50/50">
                                <td className="px-6 py-4">
                                    <input
                                        type="email"
                                        className="w-full px-2 py-1 text-xs border rounded bg-white font-medium mb-1 border-blue-300"
                                        placeholder="Email (novo)"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 text-xs border rounded bg-white border-blue-300"
                                        placeholder="Nome do Agente"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        className="w-full px-2 py-1 text-xs border rounded bg-white text-gray-700 font-medium border-blue-300"
                                        value={newUser.agencyId}
                                        onChange={(e) => setNewUser({ ...newUser, agencyId: e.target.value })}
                                    >
                                        <option value="">-- Sem Agência --</option>
                                        {agencies.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        className="w-full px-2 py-1 text-xs border rounded bg-white border-blue-300"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="AGENCIA_PARCEIRA">Agência Parceira</option>
                                        <option value="VENDEDOR_INTERNO">Vendedor Interno</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input type="checkbox" checked={newUser.flagMural} onChange={(e) => setNewUser({ ...newUser, flagMural: e.target.checked })} className="rounded text-[#3b5998]" />
                                            Mural
                                        </label>
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input type="checkbox" checked={newUser.flagExchange} onChange={(e) => setNewUser({ ...newUser, flagExchange: e.target.checked })} className="rounded text-[#3b5998]" />
                                            Câmbio
                                        </label>
                                    </div>
                                </td>
                                <td className="px-6 py-4 min-w-[200px]">
                                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto pr-1">
                                        {AVAILABLE_DESTINATIONS.map(d => (
                                            <label key={d} className="flex items-center gap-1 text-[10px] cursor-pointer hover:bg-white p-0.5 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={newUser.allowedDestinations?.includes(d)}
                                                    onChange={(e) => {
                                                        const current = newUser.allowedDestinations || [];
                                                        const next = e.target.checked ? [...current, d] : current.filter(x => x !== d);
                                                        setNewUser({ ...newUser, allowedDestinations: next });
                                                    }}
                                                    className="rounded text-[#3b5998] w-3 h-3"
                                                />
                                                <span title={d}>{d}</span>
                                            </label>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => setIsAddingUser(false)}
                                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-semibold"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => handleSave(newUser)}
                                            disabled={saving === 'new' || !newUser.email}
                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors"
                                        >
                                            {saving === 'new' ? 'Salvando...' : 'Criar'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
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
                                            Câmbio
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={user.flagReserva} onChange={(e) => updateField(user.id, 'flagReserva', e.target.checked)} className="rounded text-blue-600" />
                                            Reservas
                                        </label>
                                    </div>
                                </td>
                                <td className="px-6 py-4 min-w-[200px]">
                                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto pr-1">
                                        {AVAILABLE_DESTINATIONS.map(d => (
                                            <label key={d} className="flex items-center gap-1 text-[10px] cursor-pointer hover:bg-gray-100 p-0.5 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={(user.allowedDestinations || []).includes(d)}
                                                    onChange={(e) => {
                                                        const current = user.allowedDestinations || [];
                                                        const next = e.target.checked ? [...current, d] : current.filter((x: string) => x !== d);
                                                        updateField(user.id, 'allowedDestinations', next);
                                                    }}
                                                    className="rounded text-blue-600 w-3 h-3"
                                                />
                                                <span title={d}>{d}</span>
                                            </label>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
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
