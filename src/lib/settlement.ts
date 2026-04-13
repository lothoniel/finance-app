export interface SettlementResult {
  totalShared: number
  perPerson: number
  user1Paid: number
  user2Paid: number
  user1Owes: number
  user2Owes: number
  netSettlement: number
  creditor: 'user1' | 'user2' | 'even'
}

export function calculateSettlement(
  expenses: Array<{ amount: number; paidBy: 'user1' | 'user2'; shared: boolean }>,
  settlements: Array<{ amount: number; paidBy: 'user1' | 'user2' }>,
  cashEntries: Array<{ amount: number; paidBy: 'user1' | 'user2' }> = []
): SettlementResult {
  const sharedExpenses = expenses.filter((e) => e.shared)
  const totalShared = sharedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const perPerson = totalShared / 2

  const user1Paid = sharedExpenses
    .filter((e) => e.paidBy === 'user1')
    .reduce((sum, e) => sum + e.amount, 0)

  const user2Paid = sharedExpenses
    .filter((e) => e.paidBy === 'user2')
    .reduce((sum, e) => sum + e.amount, 0)

  const user1SettlementsPaid = settlements
    .filter((s) => s.paidBy === 'user1')
    .reduce((sum, s) => sum + s.amount, 0)

  const user2SettlementsPaid = settlements
    .filter((s) => s.paidBy === 'user2')
    .reduce((sum, s) => sum + s.amount, 0)

  // How much each person still owes after settlements (from shared expenses only)
  const user1RawOwes = Math.max(0, perPerson - user1Paid)
  const user2RawOwes = Math.max(0, perPerson - user2Paid)

  const user1OwesFromShared = Math.max(0, user1RawOwes - user1SettlementsPaid)
  const user2OwesFromShared = Math.max(0, user2RawOwes - user2SettlementsPaid)

  // Cash entries: paidBy user1 means user1 gave cash to user2 → user2 owes user1 more
  const user1CashGiven = cashEntries
    .filter((c) => c.paidBy === 'user1')
    .reduce((sum, c) => sum + c.amount, 0)
  const user2CashGiven = cashEntries
    .filter((c) => c.paidBy === 'user2')
    .reduce((sum, c) => sum + c.amount, 0)

  // Net balance: positive = user2 owes user1, negative = user1 owes user2
  const sharedBalance = user2OwesFromShared - user1OwesFromShared
  const cashBalance = user1CashGiven - user2CashGiven
  const totalBalance = sharedBalance + cashBalance

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
    perPerson,
    user1Paid,
    user2Paid,
    user1Owes,
    user2Owes,
    netSettlement,
    creditor,
  }
}
