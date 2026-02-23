import { PrismaClient, Role, UserStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'rafaelhobrum@gmail.com'

    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            role: Role.ADMIN,
            status: UserStatus.ACTIVE,
            flagMural: true,
            flagReserva: true,
            flagExchange: true,
            name: 'Rafa',
        },
        create: {
            email: adminEmail,
            name: 'Rafa',
            role: Role.ADMIN,
            status: UserStatus.ACTIVE,
            flagMural: true,
            flagReserva: true,
            flagExchange: true,
        },
    })

    console.log(`Seed finalizado: Usuário admin ${adminUser.email} (ID: ${adminUser.id}) criado / atualizado com sucesso.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
