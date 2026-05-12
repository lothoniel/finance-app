import { describe, it, expect } from 'vitest'
import { calculateSettlement } from '../../lib/settlement'

describe('calculateSettlement', () => {
  it('returns even when both users pay equally', () => {
    const expenses = [
      { amount: 1000, paidBy: 'user1' as const, shared: true },
      { amount: 1000, paidBy: 'user2' as const, shared: true },
    ]
    const result = calculateSettlement(expenses, [])
    expect(result.creditor).toBe('even')
    expect(result.netSettlement).toBe(0)
    expect(result.totalShared).toBe(2000)
    expect(result.user1ShouldPay).toBe(1000)
    expect(result.user2ShouldPay).toBe(1000)
  })

  it('user2 owes half when user1 pays all', () => {
    const expenses = [
      { amount: 2000, paidBy: 'user1' as const, shared: true },
    ]
    const result = calculateSettlement(expenses, [])
    expect(result.user1Paid).toBe(2000)
    expect(result.user2Paid).toBe(0)
    expect(result.user2Owes).toBe(1000)
    expect(result.user1Owes).toBe(0)
    expect(result.creditor).toBe('user1')
    expect(result.netSettlement).toBe(1000)
  })

  it('user1 owes half when user2 pays all', () => {
    const expenses = [
      { amount: 3000, paidBy: 'user2' as const, shared: true },
    ]
    const result = calculateSettlement(expenses, [])
    expect(result.user2Paid).toBe(3000)
    expect(result.user1Paid).toBe(0)
    expect(result.user1Owes).toBe(1500)
    expect(result.user2Owes).toBe(0)
    expect(result.creditor).toBe('user2')
    expect(result.netSettlement).toBe(1500)
  })

  it('personal expenses do not affect shared calculation', () => {
    const expenses = [
      { amount: 2000, paidBy: 'user1' as const, shared: true },
      { amount: 5000, paidBy: 'user1' as const, shared: false }, // personal, ignored
      { amount: 3000, paidBy: 'user2' as const, shared: false }, // personal, ignored
    ]
    const result = calculateSettlement(expenses, [])
    expect(result.totalShared).toBe(2000)
    expect(result.user1ShouldPay).toBe(1000)
    expect(result.user2ShouldPay).toBe(1000)
    expect(result.user2Owes).toBe(1000)
  })

  it('settlements reduce what is owed', () => {
    const expenses = [
      { amount: 2000, paidBy: 'user1' as const, shared: true },
    ]
    const settlements = [
      { amount: 500, paidBy: 'user2' as const },
    ]
    const result = calculateSettlement(expenses, settlements)
    // user2 owes 1000 raw, paid 500 in settlements, still owes 500
    expect(result.user2Owes).toBe(500)
    expect(result.netSettlement).toBe(500)
  })

  it('zero expenses returns all zeros', () => {
    const result = calculateSettlement([], [])
    expect(result.totalShared).toBe(0)
    expect(result.user1ShouldPay).toBe(0)
    expect(result.user2ShouldPay).toBe(0)
    expect(result.user1Paid).toBe(0)
    expect(result.user2Paid).toBe(0)
    expect(result.user1Owes).toBe(0)
    expect(result.user2Owes).toBe(0)
    expect(result.netSettlement).toBe(0)
    expect(result.creditor).toBe('even')
  })

  it('handles mixed shared and personal with settlements', () => {
    const expenses = [
      { amount: 4000, paidBy: 'user1' as const, shared: true },
      { amount: 2000, paidBy: 'user2' as const, shared: true },
      { amount: 1000, paidBy: 'user1' as const, shared: false },
    ]
    const settlements = [
      { amount: 200, paidBy: 'user2' as const },
    ]
    const result = calculateSettlement(expenses, settlements)
    // totalShared = 6000, user1ShouldPay = 3000, user2ShouldPay = 3000
    // user1Paid shared = 4000, user2Paid shared = 2000
    // user1RawOwes = max(0, 3000 - 4000) = 0
    // user2RawOwes = max(0, 3000 - 2000) = 1000
    // user2 settlement paid = 200, user2Owes = 1000 - 200 = 800
    expect(result.totalShared).toBe(6000)
    expect(result.user1ShouldPay).toBe(3000)
    expect(result.user2ShouldPay).toBe(3000)
    expect(result.user1Owes).toBe(0)
    expect(result.user2Owes).toBe(800)
    expect(result.creditor).toBe('user1')
  })

  it('cash given by user1 increases what user2 owes', () => {
    const expenses = [
      { amount: 2000, paidBy: 'user1' as const, shared: true },
    ]
    // user2 already owes 1000 from shared. user1 also gave 300 cash.
    const cashEntries = [{ amount: 300, paidBy: 'user1' as const }]
    const result = calculateSettlement(expenses, [], cashEntries)
    expect(result.user2Owes).toBe(1300)
    expect(result.user1Owes).toBe(0)
    expect(result.creditor).toBe('user1')
    expect(result.netSettlement).toBe(1300)
  })

  it('cash given by user2 reduces what user2 owes', () => {
    const expenses = [
      { amount: 2000, paidBy: 'user1' as const, shared: true },
    ]
    // user2 owes 1000 from shared. user2 gave 400 cash to user1.
    const cashEntries = [{ amount: 400, paidBy: 'user2' as const }]
    const result = calculateSettlement(expenses, [], cashEntries)
    expect(result.user2Owes).toBe(600)
    expect(result.user1Owes).toBe(0)
    expect(result.creditor).toBe('user1')
    expect(result.netSettlement).toBe(600)
  })

  it('cash can flip the creditor', () => {
    // user2 owes 1000 from shared, but user2 gave 1500 cash to user1
    const expenses = [
      { amount: 2000, paidBy: 'user1' as const, shared: true },
    ]
    const cashEntries = [{ amount: 1500, paidBy: 'user2' as const }]
    const result = calculateSettlement(expenses, [], cashEntries)
    // sharedBalance = 1000 (user2 owes user1), cashBalance = -1500 (user2 gave user1 cash)
    // totalBalance = 1000 - 1500 = -500 → user1 owes user2 500
    expect(result.user1Owes).toBe(500)
    expect(result.user2Owes).toBe(0)
    expect(result.creditor).toBe('user2')
    expect(result.netSettlement).toBe(500)
  })

  it('cash entries with no shared expenses', () => {
    const cashEntries = [{ amount: 200, paidBy: 'user1' as const }]
    const result = calculateSettlement([], [], cashEntries)
    expect(result.totalShared).toBe(0)
    expect(result.user2Owes).toBe(200)
    expect(result.user1Owes).toBe(0)
    expect(result.creditor).toBe('user1')
    expect(result.netSettlement).toBe(200)
  })

  it('60/40 split: user1 pays 60% when user2 pays all', () => {
    const expenses = [
      { amount: 1000, paidBy: 'user2' as const, shared: true, splitRatio: 0.6 },
    ]
    const result = calculateSettlement(expenses, [], [], 0.6)
    // user1 should pay 60% = 600, user2 should pay 40% = 400
    // user2 paid 1000 but should only pay 400 → user1 owes 600
    expect(result.user1ShouldPay).toBe(600)
    expect(result.user2ShouldPay).toBe(400)
    expect(result.user1Owes).toBe(600)
    expect(result.user2Owes).toBe(0)
    expect(result.creditor).toBe('user2')
    expect(result.netSettlement).toBe(600)
  })

  it('per-expense splitRatio overrides the default', () => {
    const expenses = [
      { amount: 1000, paidBy: 'user1' as const, shared: true, splitRatio: 0.7 },
    ]
    // default is 0.5 but expense-level ratio is 0.7
    const result = calculateSettlement(expenses, [], [], 0.5)
    expect(result.user1ShouldPay).toBeCloseTo(700)
    expect(result.user2ShouldPay).toBeCloseTo(300)
    expect(result.user2Owes).toBeCloseTo(300)
    expect(result.creditor).toBe('user1')
  })

  it('mixed per-expense ratios calculate correctly', () => {
    const expenses = [
      { amount: 2000, paidBy: 'user1' as const, shared: true, splitRatio: 0.5 },
      { amount: 1000, paidBy: 'user2' as const, shared: true, splitRatio: 0.6 },
    ]
    const result = calculateSettlement(expenses, [], [], 0.5)
    // exp1: user1 should pay 1000, user2 should pay 1000
    // exp2: user1 should pay 600, user2 should pay 400
    // user1ShouldPay = 1600, user2ShouldPay = 1400
    // user1Paid = 2000, user2Paid = 1000
    // user1RawOwes = max(0, 1600 - 2000) = 0
    // user2RawOwes = max(0, 1400 - 1000) = 400
    expect(result.user1ShouldPay).toBe(1600)
    expect(result.user2ShouldPay).toBe(1400)
    expect(result.user2Owes).toBe(400)
    expect(result.user1Owes).toBe(0)
    expect(result.creditor).toBe('user1')
    expect(result.netSettlement).toBe(400)
  })
})
