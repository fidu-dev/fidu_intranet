'use client';

import { useState } from 'react';
import { submitAgencyRegistration, AgencyRegistrationData, RequestedUser } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function CadastroForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [formData, setFormData] = useState<Omit<AgencyRegistrationData, 'requestedUsers'>>({
        name: '',
        legalName: '',
        cnpj: '',
        cadastur: '',
        address: '',
        responsibleName: '',
        responsiblePhone: '',
        instagram: '',
        bankDetails: '',
    });

    const [users, setUsers] = useState<RequestedUser[]>([{ name: '', email: '' }]);

    const handleAddUser = () => setUsers([...users, { name: '', email: '' }]);

    const handleRemoveUser = (index: number) => {
        if (users.length > 1) {
            setUsers(users.filter((_, i) => i !== index));
        }
    };

    const handleUserChange = (index: number, field: keyof RequestedUser, value: string) => {
        const newUsers = [...users];
        newUsers[index][field] = value;
        setUsers(newUsers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        // Basic validation
        if (!formData.name || !formData.cnpj || !formData.responsibleName) {
            setErrorMsg('Por favor, preencha os campos obrigatórios (Fantasia, CNPJ, Responsável).');
            setIsLoading(false);
            return;
        }

        const validUsers = users.filter(u => u.name.trim() && u.email.trim());

        const res = await submitAgencyRegistration({
            ...formData,
            requestedUsers: validUsers
        });

        if (res.success) {
            setIsSuccess(true);
        } else {
            setErrorMsg(res.error || 'Ocorreu um erro.');
        }

        setIsLoading(false);
    };

    if (isSuccess) {
        return (
            <Card className="w-full max-w-2xl mx-auto shadow-sm border-gray-100 mt-10">
                <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                    <h2 className="text-2xl font-bold text-gray-800">Cadastro Enviado!</h2>
                    <p className="text-gray-600 max-w-md">
                        Recebemos as informações da sua agência com sucesso.
                        Nossa equipe avaliará o seu cadastro em breve e você receberá o acesso por e-mail.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-3xl mx-auto shadow-sm border-gray-100 my-10">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-8">
                <CardTitle className="text-2xl font-bold text-gray-800">Cadastro de Agência Parceira</CardTitle>
                <CardDescription className="text-base text-gray-500 mt-2">
                    Preencha o formulário abaixo para solicitar a parceria com a Fidu.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-8 pt-8 px-8">
                    {/* Institucional */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dados Institucionais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Fantasia *</Label>
                                <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Como sua agência é conhecida" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="legalName">Razão Social *</Label>
                                <Input id="legalName" required value={formData.legalName} onChange={e => setFormData({ ...formData, legalName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpj">CNPJ *</Label>
                                <Input id="cnpj" required value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cadastur">Cadastur</Label>
                                <Input id="cadastur" value={formData.cadastur} onChange={e => setFormData({ ...formData, cadastur: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instagram">Instagram</Label>
                                <Input id="instagram" value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })} placeholder="@agencia" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Endereço Físico</Label>
                                <Input id="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Rua, Número, Bairro, Cidade - UF" />
                            </div>
                        </div>
                    </div>

                    {/* Responsável */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Responsável pela Agência</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="respName">Nome Completo *</Label>
                                <Input id="respName" required value={formData.responsibleName} onChange={e => setFormData({ ...formData, responsibleName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="respPhone">Telefone (WhatsApp)</Label>
                                <Input id="respPhone" value={formData.responsiblePhone} onChange={e => setFormData({ ...formData, responsiblePhone: e.target.value })} placeholder="(11) 99999-9999" />
                            </div>
                        </div>
                    </div>



                    {/* Vendedores / Acessos */}
                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="text-lg font-semibold text-gray-800">Vendedores / Acessos Solicitados</h3>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddUser} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                <Plus className="w-4 h-4 mr-1" /> Adicionar Vendedor
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500">
                            Informe os nomes e e-mails dos usuários que precisarão de acesso ao portal para realizar reservas.
                        </p>
                        <div className="space-y-3">
                            {users.map((user, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                    <div className="space-y-1.5 flex-1 w-full">
                                        <Label className="text-xs text-gray-500">Nome do Vendedor</Label>
                                        <Input value={user.name} onChange={e => handleUserChange(index, 'name', e.target.value)} placeholder="Ex: João Silva" required />
                                    </div>
                                    <div className="space-y-1.5 flex-1 w-full">
                                        <Label className="text-xs text-gray-500">E-mail corporativo</Label>
                                        <Input type="email" value={user.email} onChange={e => handleUserChange(index, 'email', e.target.value)} placeholder="joao@agencia.com" required />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleRemoveUser(index)}
                                        disabled={users.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                            {errorMsg}
                        </div>
                    )}

                </CardContent>
                <CardFooter className="bg-gray-50/50 border-t border-gray-100 p-8 flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-white w-full sm:w-auto" disabled={isLoading}>
                        {isLoading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                        ) : 'Enviar Solicitação de Cadastro'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
