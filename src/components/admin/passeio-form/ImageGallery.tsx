'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Plus, X, Loader2 } from 'lucide-react';

export interface TourImageItem {
    id: string;
    url: string;
    altText: string | null;
    sortOrder: number;
}

interface ImageGalleryProps {
    tourId?: string;
    images: TourImageItem[];
    onImagesChanged: () => void;
}

async function resizeImage(file: File, maxSize = 1200, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                blob => blob ? resolve(blob) : reject(new Error('Resize failed')),
                'image/jpeg',
                quality
            );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

export function ImageGallery({ tourId, images, onImagesChanged }: ImageGalleryProps) {
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (files: FileList | null) => {
        if (!files || !tourId) return;
        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const resized = await resizeImage(file);
                const formData = new FormData();
                formData.append('file', resized, file.name.replace(/\.[^.]+$/, '.jpg'));
                formData.append('tourId', tourId);

                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Upload failed');
                }
            }
            onImagesChanged();
        } catch (err: any) {
            alert(`Erro no upload: ${err.message}`);
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleDelete = async (imageId: string) => {
        if (!confirm('Remover esta imagem?')) return;
        setDeletingId(imageId);
        try {
            const res = await fetch('/api/upload/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageId }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Delete failed');
            }
            onImagesChanged();
        } catch (err: any) {
            alert(`Erro ao remover: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Card className="shadow-sm border-blue-200">
            <CardHeader className="border-b border-blue-100 py-4">
                <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-semibold text-gray-800">Imagens</CardTitle>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
                        <ImageIcon className="h-3 w-3" /> {images.length} foto{images.length !== 1 ? 's' : ''}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {!tourId ? (
                    <p className="text-sm text-gray-500 text-center py-6">
                        Salve o passeio primeiro para adicionar imagens.
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {images.map(img => (
                                <div key={img.id} className="relative group aspect-[4/3] rounded-lg overflow-hidden border bg-gray-50">
                                    <img
                                        src={img.url}
                                        alt={img.altText || ''}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(img.id)}
                                        disabled={deletingId === img.id}
                                        className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        {deletingId === img.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <X className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            ))}

                            {/* Add button */}
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                disabled={uploading}
                                className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                            >
                                {uploading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <Plus className="h-6 w-6" />
                                )}
                                <span className="text-xs">{uploading ? 'Enviando...' : 'Adicionar'}</span>
                            </button>
                        </div>

                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={e => handleUpload(e.target.files)}
                        />
                    </>
                )}
            </CardContent>
        </Card>
    );
}
