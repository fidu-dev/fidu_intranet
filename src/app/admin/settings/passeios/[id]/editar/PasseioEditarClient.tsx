'use client';

import { useState, useEffect, useCallback } from 'react';
import { PasseioForm, type PasseioFormData, type SeasonInfo } from '@/components/admin/PasseioForm';
import { updatePasseio, getSelectOptionsMulti, getSeasons, getTourImages } from '@/app/admin/actions';
import { StickyHeader } from '@/components/admin/passeio-form/StickyHeader';
import type { TourImageItem } from '@/components/admin/passeio-form/ImageGallery';

const OPTION_GROUPS = ['destino', 'categoria', 'operador', 'temporada', 'moeda', 'tag', 'duracao', 'restricao', 'oqueLevar'];

function validate(data: PasseioFormData): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!data.title.trim()) errors.title = 'Título é obrigatório';
    if (!data.description.trim()) errors.description = 'Descrição é obrigatória';
    if (!data.destino.trim()) errors.destino = 'Destino é obrigatório';
    if (data.price && isNaN(parseFloat(data.price))) errors.price = 'Preço deve ser um número válido';
    if (data.inventoryQuantity && !Number.isInteger(Number(data.inventoryQuantity))) errors.inventoryQuantity = 'Deve ser um número inteiro';
    return errors;
}

interface Props {
    passeio: PasseioFormData & { id: string };
}

export function PasseioEditarClient({ passeio }: Props) {
    const [formData, setFormData] = useState<PasseioFormData>(passeio);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [options, setOptions] = useState<Record<string, string[]>>({});
    const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
    const [images, setImages] = useState<TourImageItem[]>([]);

    const loadOptions = useCallback(async () => {
        const opts = await getSelectOptionsMulti(OPTION_GROUPS);
        setOptions(opts);
    }, []);

    const loadSeasons = useCallback(async () => {
        const s = await getSeasons();
        setSeasons(s);
    }, []);

    const loadImages = useCallback(async () => {
        const imgs = await getTourImages(passeio.id);
        setImages(imgs);
    }, [passeio.id]);

    useEffect(() => {
        loadOptions();
        loadSeasons();
        loadImages();
    }, [loadOptions, loadSeasons, loadImages]);

    const handleSave = async () => {
        const validationErrors = validate(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setIsSaving(true);
        setMessage(null);
        try {
            const result = await updatePasseio(passeio.id, formData);
            if (result.success) {
                setMessage({ type: 'success', text: 'Passeio atualizado com sucesso!' });
            } else {
                setMessage({ type: 'error', text: `Erro ao salvar: ${result.error}` });
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: `Erro de conexão: ${e.message}` });
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = (field: 'statusOperativo' | 'statusIntranet', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <>
            <StickyHeader
                title={formData.title}
                statusOperativo={formData.statusOperativo}
                statusIntranet={formData.statusIntranet}
                onStatusChange={handleStatusChange}
                onSave={handleSave}
                backHref="/admin/settings/passeios"
                isSaving={isSaving}
                saveLabel="Salvar Alterações"
                message={message}
            />

            <PasseioForm
                data={formData}
                onChange={setFormData}
                errors={errors}
                options={options}
                seasons={seasons}
                onOptionsChanged={loadOptions}
                tourId={passeio.id}
                images={images}
                onImagesChanged={loadImages}
            />
        </>
    );
}
