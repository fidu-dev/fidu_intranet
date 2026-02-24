import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  try {
    await prisma.agency.findFirst({
        select: {
            responsiblePhone: true
        }
    })
    console.log("Success")
  } catch (e) {
    console.error(e)
  }
  await prisma.$disconnect()
}
main()
