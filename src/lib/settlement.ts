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
  settlements: Array<{ amount: number; paidBy: 'user1' | 'user2' }>
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

  // How much each person still owes after settlements
  const user1RawOwes = Math.max(0, perPerson - user1Paid)
  const user2RawOwes = Math.max(0, perPerson - user2Paid)

  const user1Owes = Math.max(0, user1RawOwes - user1SettlementsPaid)
  const user2Owes = Math.max(0, user2RawOwes - user2SettlementsPaid)

  const netSettlement = Math.abs(user1Owes - user2Owes)

  let creditor: 'user1' | 'user2' | 'even'
  if (user2Owes > user1Owes) {
    creditor = 'user1'
  } else if (user1Owes > user2Owes) {
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
