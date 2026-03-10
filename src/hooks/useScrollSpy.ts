'use client';

import { useState, useEffect } from 'react';

export function useScrollSpy(
    sectionIds: string[],
    options?: { rootId?: string; rootMargin?: string; threshold?: number }
): string {
    const [activeId, setActiveId] = useState(sectionIds[0] || '');

    useEffect(() => {
        const root = options?.rootId
            ? document.getElementById(options.rootId)
            : null;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    setActiveId(visible[0].target.id);
                }
            },
            {
                root,
                rootMargin: options?.rootMargin || '-80px 0px -60% 0px',
                threshold: options?.threshold || 0,
            }
        );

        sectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [sectionIds, options?.rootId, options?.rootMargin, options?.threshold]);

    return activeId;
}
