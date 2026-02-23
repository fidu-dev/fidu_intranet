import { prisma } from '../db/prisma'
import { Role, UserStatus } from '@prisma/client'
import { UserCapabilities } from '../domain/types'

export async function getUserCapabilities(email: string): Promise<UserCapabilities | null> {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { agency: true }
    })

    if (!user || user.status !== UserStatus.ACTIVE) {
        return null
    }

    const isInternal = user.role === Role.ADMIN || user.role === Role.VENDEDOR_INTERNO
    const isAdmin = user.role === Role.ADMIN

    return {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        commissionRate: user.agency?.commissionRate || 0,
        canReserve: user.flagReserva,
        canAccessMural: user.flagMural,
        canAccessExchange: user.flagExchange,
        isInternal,
        isAdmin,
        agencyName: user.agency?.name,
        allowedDestinations: user.allowedDestinations,
        preferences: user.preferences,
    }
}
