import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const phone = '693845941'
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    console.log(`User with phone ${phone} not found.`)
    return
  }
  const updatedUser = await prisma.user.update({
    where: { phone },
    data: { role: 'owner' },
  })
  console.log(`User ${updatedUser.name} (${phone}) role updated to ${updatedUser.role}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
