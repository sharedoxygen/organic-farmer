/**
 * Canonical showcase user/org reference — IDs and emails only.
 * Passwords are NEVER modified by showcase seeds.
 */
export const CURRY_ISLAND_FARM_ID = '00000000-0000-0000-0000-000000000010'
export const SHARED_OXYGEN_FARM_ID = '00000000-0000-0000-0000-000000000020'

/** Christian Kinkead — Curry Island owner */
export const CURRY_OWNER = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'kinkead@curryislandmicrogreens.com',
  farmRole: 'OWNER',
}

/** Curry Island team (seed-microgreens-users.sql) */
export const CURRY_TEAM = [
  {
    id: '00000000-0000-0000-0000-000000000301',
    email: 'manager@curryisland.com',
    role: 'MANAGER',
    name: 'Emma Rodriguez',
  },
  {
    id: '00000000-0000-0000-0000-000000000302',
    email: 'grower@curryisland.com',
    role: 'TEAM_LEAD',
    name: 'James Kim',
  },
  {
    id: '00000000-0000-0000-0000-000000000303',
    email: 'harvest@curryisland.com',
    role: 'TEAM_MEMBER',
    name: 'Maria Santos',
  },
  {
    id: '00000000-0000-0000-0000-000000000304',
    email: 'maintenance@curryisland.com',
    role: 'SPECIALIST',
    name: 'David Chen',
  },
  {
    id: '00000000-0000-0000-0000-000000000305',
    email: 'packaging@curryisland.com',
    role: 'TEAM_MEMBER',
    name: 'Lisa Thompson',
  },
]

/** Jay Cee — Shared Oxygen owner (shaoxy farms) */
export const CANNABIS_OWNER = {
  id: '00000000-0000-0000-0000-000000000201',
  altId: '00000000-0000-0000-0000-000000000300',
  email: 'jay.cee@sharedoxygen.com',
  farmRole: 'OWNER',
}

/** Shared Oxygen cultivation team (task assignment IDs) */
export const CANNABIS_TEAM = [
  {
    id: '00000000-0000-0000-0000-000000000202',
    email: 'maintenance@sharedoxygen.com',
    role: 'SPECIALIST',
    name: 'Alex Torres',
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    email: 'cultivation@sharedoxygen.com',
    role: 'TEAM_LEAD',
    name: 'Sam Rivera',
  },
  {
    id: '00000000-0000-0000-0000-000000000204',
    email: 'processing@sharedoxygen.com',
    role: 'TEAM_MEMBER',
    name: 'Jordan Park',
  },
  {
    id: '00000000-0000-0000-0000-000000000205',
    email: 'quality@sharedoxygen.com',
    role: 'SPECIALIST',
    name: 'Riley Nguyen',
  },
]
