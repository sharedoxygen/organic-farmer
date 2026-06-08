import { prisma } from '@/lib/db'

/** Weekly order quantity totals for a crop (last N weeks). */
export async function getOrderDemandHistory(
  farmId: string,
  cropType: string,
  weeks = 12
): Promise<number[]> {
  const since = new Date()
  since.setDate(since.getDate() - weeks * 7)

  const items = await prisma.order_items.findMany({
    where: {
      farm_id: farmId,
      orders: {
        orderDate: { gte: since },
        status: { notIn: ['CANCELLED', 'CANCELED'] },
      },
      OR: [
        { productName: { contains: cropType, mode: 'insensitive' } },
        { seed_varieties: { name: { contains: cropType, mode: 'insensitive' } } },
      ],
    },
    include: {
      orders: { select: { orderDate: true } },
    },
  })

  const buckets = new Array(weeks).fill(0) as number[]
  const now = Date.now()

  for (const item of items) {
    const ageDays = Math.floor(
      (now - item.orders.orderDate.getTime()) / 86400000
    )
    const weekIdx = weeks - 1 - Math.floor(ageDays / 7)
    if (weekIdx >= 0 && weekIdx < weeks) {
      buckets[weekIdx] += item.quantity
    }
  }

  const hasData = buckets.some((v) => v > 0)
  if (!hasData) return []

  return buckets
}
