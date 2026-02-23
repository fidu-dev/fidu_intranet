import { prisma } from '../db/prisma'
import { Role, UserStatus } from '@prisma/client'
import { UserCapabilities } from '../domain/types'

export async function getUserCapabilities(email: string): Promise<UserCapabilities | null> {
    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user || user.status !== UserStatus.ACTIVE) {
        return null
    }

    const isInternal = user.role === Role.ADMIN || user.role === Role.VENDEDOR_INTERNO
    const isAdmin = user.role === Role.ADMIN

    return {
        id: user.id,
        email: user.email,
        commissionRate: user.commissionRate,
        canReserve: isInternal || user.flagReserva,
        canAccessMural: isInternal || user.flagMural,
        canAccessExchange: isInternal || user.flagExchange,
        isInternal,
        isAdmin,
    }
}
