export interface SettlementResult {
  totalShared: number
  user1ShouldPay: number
  user2ShouldPay: number
  user1Paid: number
  user2Paid: number
  user1Owes: number
  user2Owes: number
  netSettlement: number
  creditor: 'user1' | 'user2' | 'even'
}

function sumByUser<T extends { paidBy: 'user1' | 'user2'; amount: number }>(
  items: T[],
  user: 'user1' | 'user2'
): number {
  return items.filter((x) => x.paidBy === user).reduce((sum, x) => sum + x.amount, 0)
}

export function calculateSettlement(
  expenses: Array<{ amount: number; paidBy: 'user1' | 'user2'; shared: boolean; splitRatio?: number }>,
  settlements: Array<{ amount: number; paidBy: 'user1' | 'user2' }>,
  cashEntries: Array<{ amount: number; paidBy: 'user1' | 'user2' }> = [],
  defaultSplitRatio: number = 0.5
): SettlementResult {
  const sharedExpenses = expenses.filter((e) => e.shared)
  const totalShared = sharedExpenses.reduce((sum, e) => sum + e.amount, 0)

  let user1ShouldPay = 0
  let user2ShouldPay = 0
  sharedExpenses.forEach((e) => {
    const r = e.splitRatio ?? defaultSplitRatio
    user1ShouldPay += e.amount * r
    user2ShouldPay += e.amount * (1 - r)
  })

  const user1Paid = sumByUser(sharedExpenses, 'user1')
  const user2Paid = sumByUser(sharedExpenses, 'user2')
  const user1SettlementsPaid = sumByUser(settlements, 'user1')
  const user2SettlementsPaid = sumByUser(settlements, 'user2')

  const user1RawOwes = Math.max(0, user1ShouldPay - user1Paid)
  const user2RawOwes = Math.max(0, user2ShouldPay - user2Paid)

  // Cash entries: paidBy user1 means user1 gave cash to user2 → user2 owes user1 more
  const user1CashGiven = sumByUser(cashEntries, 'user1')
  const user2CashGiven = sumByUser(cashEntries, 'user2')

  // Total raw balance (shared + cash) before settlements. positive = user2 owes user1.
  const rawTotal = (user2RawOwes - user1RawOwes) + (user1CashGiven - user2CashGiven)

  // Apply settlements to the full balance directionally.
  // Wrong-direction payments are clamped to 0 (can't reverse who owes whom).
  const totalBalance = rawTotal >= 0
    ? Math.max(0, rawTotal - user2SettlementsPaid)
    : Math.min(0, rawTotal + user1SettlementsPaid)

  const user1Owes = totalBalance < 0 ? Math.abs(totalBalance) : 0
  const user2Owes = totalBalance > 0 ? totalBalance : 0
  const netSettlement = Math.abs(totalBalance)

  let creditor: 'user1' | 'user2' | 'even'
  if (totalBalance > 0) {
    creditor = 'user1'
  } else if (totalBalance < 0) {
    creditor = 'user2'
  } else {
    creditor = 'even'
  }

  return {
    totalShared,
    user1ShouldPay,
    user2ShouldPay,
    user1Paid,
    user2Paid,
    user1Owes,
    user2Owes,
    netSettlement,
    creditor,
  }
}
