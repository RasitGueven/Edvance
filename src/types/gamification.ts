// Gamification-Types: Badges (Rarity + Catalog + Schüler-Badges) + Streak-Repair-Inventory.
// Backend: migrations/034_badge_rarity.sql + 035_streak_repair_inventory.sql.

export type BadgeRarity = 'bronze' | 'silver' | 'gold' | 'platinum'
export type BadgeForm = 'round' | 'shield'

export type Badge = {
  id: string
  label: string
  description: string | null
  rarity: BadgeRarity
  form: BadgeForm
  klasse: number | null
  trigger: string | null
  created_at: string
}

export type StudentBadge = {
  student_id: string
  badge_id: string
  awarded_at: string
}

export type StreakRepairInventory = {
  student_id: string
  tokens: number
  earned_total: number
  used_total: number
  updated_at: string
}
