import { calcInclusiveTax, calcExclusiveTax, round2 } from '../../src/utils/money.js'

describe('money Utility (BR-16 Tax Calculation)', () => {
  test('round2 rounds correctly to two decimal places', () => {
    expect(round2(10.555)).toBe(10.56)
    expect(round2(10.554)).toBe(10.55)
    expect(round2(100)).toBe(100.0)
  })

  test('calcInclusiveTax computes correct tax from gross amount (BR-16)', () => {
    // ₹4249.15 gross with 18% tax -> tax = 4249.15 * 18 / 118 = 648.18
    const tax = calcInclusiveTax(4249.15, 18)
    expect(tax).toBe(648.18)

    // Cold coffee ₹270 with 18% tax -> tax = 270 * 18 / 118 = 41.19
    const drinkTax = calcInclusiveTax(270, 18)
    expect(drinkTax).toBe(41.19)
  })

  test('calcExclusiveTax computes correct tax added on net amount', () => {
    const tax = calcExclusiveTax(1000, 18)
    expect(tax).toBe(180)
  })
})
