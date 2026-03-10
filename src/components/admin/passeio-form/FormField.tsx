'use client';

import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface FormFieldProps {
    label: string;
    required?: boolean;
    tooltip?: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}

export function FormField({ label, required, tooltip, error, className, children }: FormFieldProps) {
    return (
        <div className={className}>
            <div className="flex items-center gap-1.5 mb-1.5">
                <Label className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
                {tooltip && (
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                                {tooltip}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
