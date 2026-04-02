import type { Combo } from './combo-api'

export function findMatchingCombo(productIds: string[], combos: Combo[]): Combo | null {
  if (productIds.length < 2 || combos.length === 0) {
    return null
  }

  return (
    combos.find(
      (combo) =>
        productIds.includes(combo.frameProductId) && productIds.includes(combo.lensProductId)
    ) || null
  )
}