'use server'

import { prisma } from '@/lib/db/prisma';

export interface RequestedUser {
    name: string;
    email: string;
    phone?: string;
}

export interface AgencyRegistrationData {
    name: string;
    legalName: string;
    cnpj: string;
    cadastur: string;
    address: string;
    responsibleName: string;
    responsiblePhone: string;
    instagram: string;
    bankDetails: string;
    requestedUsers: RequestedUser[];
}

export async function submitAgencyRegistration(data: AgencyRegistrationData) {
    try {
        await prisma.agency.create({
            data: {
                name: data.name,
                legalName: data.legalName,
                cnpj: data.cnpj,
                cadastur: data.cadastur,
                address: data.address,
                responsibleName: data.responsibleName,
                responsiblePhone: data.responsiblePhone,
                instagram: data.instagram,
                bankDetails: data.bankDetails,
                status: 'PENDING',
                commissionRate: 0,
                requestedUsers: data.requestedUsers as any,
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error('Agency registration error:', error);
        return { success: false, error: 'Ocorreu um erro ao processar o cadastro.' };
    }
}
