'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PasseioForm, EMPTY_FORM, type PasseioFormData } from '@/components/admin/PasseioForm';
import { createPasseio } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function validate(data: PasseioFormData): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!data.title.trim()) errors.title = 'Título é obrigatório';
    if (!data.description.trim()) errors.description = 'Descrição é obrigatória';
    if (!data.destino.trim()) errors.destino = 'Destino é obrigatório';
    if (data.price && isNaN(parseFloat(data.price))) errors.price = 'Preço deve ser um número válido';
    if (data.inventoryQuantity && !Number.isInteger(Number(data.inventoryQuantity))) errors.inventoryQuantity = 'Deve ser um número inteiro';
    return errors;
}

export function PasseioNovoClient() {
    const router = useRouter();
    const [formData, setFormData] = useState<PasseioFormData>(EMPTY_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSave = async () => {
        const validationErrors = validate(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setIsSaving(true);
        setMessage(null);
        try {
            const result = await createPasseio(formData);
            if (result.success) {
                router.push('/admin/settings/passeios');
            } else {
                setMessage({ type: 'error', text: `Erro ao salvar: ${result.error}` });
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: `Erro de conexão: ${e.message}` });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Link href="/admin/settings/passeios" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Voltar para listagem
                </Link>
                <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSaving ? 'Salvando...' : 'Criar Passeio'}
                </Button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-start gap-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                    <p>{message.text}</p>
                </div>
            )}

            <PasseioForm data={formData} onChange={setFormData} errors={errors} />

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSaving ? 'Salvando...' : 'Criar Passeio'}
                </Button>
            </div>
        </div>
    );
}
