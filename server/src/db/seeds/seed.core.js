import bcrypt from 'bcryptjs'
import memoryStore from '../../utils/memoryStore.js'
import { toClubDate } from '../../utils/clubTime.js'
import { addDays, format, subDays } from 'date-fns'

export const seedCore = async () => {
  console.log('--- SEEDING CORE DATA ---')
  const today = toClubDate()
  const nowIso = new Date().toISOString()

  // 1. Settings
  const settingsDoc = {
    id: 'settings-global-id',
    data: {
      openTime: '06:00',
      closeTime: '22:00',
      slotMinutes: 30,
      sessionMinutes: 60,
      bookingWindowDays: 14,
      cancelCutoffHours: 2,
      socialDay: 5,
      socialStart: '18:00',
      socialEnd: '22:00',
      lowStockDefault: 5,
      onlineOrderHoldMinutes: 30,
      deliveryFee: 50,
      taxRates: {
        court: 18,
        membership: 18,
        shop: 18,
        barFood: 5,
        barDrink: 18,
      },
      club: {
        name: 'Champions Club',
        address: '123 Sports Way, Indiranagar, Bengaluru, Karnataka 560038',
        phone: '+91 98765 43210',
        email: 'info@championsclub.in',
        timezone: 'Asia/Kolkata',
      },
    },
    updated_at: nowIso,
  }
  memoryStore.collections.settings = [settingsDoc]

  // 2. Plans
  const plans = [
    {
      id: 'plan-gold-001',
      name: 'Gold Membership',
      code: 'GOLD',
      court_discount_pct: 100,
      shop_discount_pct: 15,
      bar_discount_pct: 15,
      duration_days: 365,
      max_bookings_per_day: 4,
      price: 15000,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: 'plan-silver-002',
      name: 'Silver Membership',
      code: 'SILVER',
      court_discount_pct: 30,
      shop_discount_pct: 10,
      bar_discount_pct: 10,
      duration_days: 365,
      max_bookings_per_day: 2,
      price: 8000,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: 'plan-junior-003',
      name: 'Junior Membership',
      code: 'JUNIOR',
      court_discount_pct: 50,
      shop_discount_pct: 10,
      bar_discount_pct: 10,
      duration_days: 365,
      max_bookings_per_day: 2,
      price: 5000,
      is_active: true,
      created_at: nowIso,
    },
  ]
  memoryStore.collections.plans = [...plans]

  // 3. Courts
  const courts = [
    {
      id: 'court-tennis-1',
      name: 'Tennis Court 1 (Clay)',
      sport: 'tennis',
      hourly_rate: 800,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0',
      created_at: nowIso,
    },
    {
      id: 'court-tennis-2',
      name: 'Tennis Court 2 (Hard)',
      sport: 'tennis',
      hourly_rate: 800,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0',
      created_at: nowIso,
    },
    {
      id: 'court-padel-1',
      name: 'Padel Panoramic 1',
      sport: 'padel',
      hourly_rate: 1200,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67',
      created_at: nowIso,
    },
    {
      id: 'court-badminton-1',
      name: 'Badminton Court 1',
      sport: 'badminton',
      hourly_rate: 400,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea',
      created_at: nowIso,
    },
    {
      id: 'court-badminton-2',
      name: 'Badminton Court 2',
      sport: 'badminton',
      hourly_rate: 400,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea',
      created_at: nowIso,
    },
    {
      id: 'court-cricket-1',
      name: 'Box Cricket Arena',
      sport: 'cricket',
      hourly_rate: 1500,
      is_active: true,
      image_url: 'https://images.unsplash.com/photo-1531415074868-036b107e775a',
      created_at: nowIso,
    },
  ]
  memoryStore.collections.courts = [...courts]

  // 4. Users
  const adminHash = await bcrypt.hash('Admin@123', 10)
  const staffHash = await bcrypt.hash('Staff@123', 10)
  const memberHash = await bcrypt.hash('Member@123', 10)

  const users = [
    {
      id: 'usr-owner-001',
      email: 'owner@championsclub.in',
      name: 'Rajesh Sharma',
      phone: '+919876500001',
      role: 'owner',
      password_hash: adminHash,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: 'usr-frontdesk-002',
      email: 'frontdesk@championsclub.in',
      name: 'Priya Patel',
      phone: '+919876500002',
      role: 'front_desk',
      password_hash: staffHash,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: 'usr-bar-003',
      email: 'bar@championsclub.in',
      name: 'Vikram Singh',
      phone: '+919876500003',
      role: 'bar_staff',
      password_hash: staffHash,
      is_active: true,
      created_at: nowIso,
    },
    {
      id: 'usr-member-004',
      email: 'member@championsclub.in',
      name: 'Arun Kumar',
      phone: '+919876500004',
      role: 'member',
      password_hash: memberHash,
      is_active: true,
      created_at: nowIso,
    },
  ]
  memoryStore.collections.users = [...users]

  // 5. 10 Demo Members
  const demoMembers = [
    {
      id: 'mem-001',
      user_id: 'usr-member-004',
      member_code: 'MEM-2026-000001',
      full_name: 'Arun Kumar',
      email: 'member@championsclub.in',
      phone: '+919876500004',
      planId: 'plan-gold-001',
      status: 'active',
      daysOffset: 180,
    },
    {
      id: 'mem-002',
      user_id: null,
      member_code: 'MEM-2026-000002',
      full_name: 'Rohan Mehta',
      email: 'rohan.mehta@example.com',
      phone: '+919876500005',
      planId: 'plan-silver-002',
      status: 'active',
      daysOffset: 7, // Expiring in 7 days
    },
    {
      id: 'mem-003',
      user_id: null,
      member_code: 'MEM-2026-000003',
      full_name: 'Neha Gupta',
      email: 'neha.gupta@example.com',
      phone: '+919876500006',
      planId: 'plan-silver-002',
      status: 'expired',
      daysOffset: -10, // Expired 10 days ago
    },
    {
      id: 'mem-004',
      user_id: null,
      member_code: 'MEM-2026-000004',
      full_name: 'Kabir Verma',
      email: 'kabir.verma@example.com',
      phone: '+919876500007',
      dob: '2010-05-15', // Under 18
      planId: 'plan-junior-003',
      status: 'active',
      daysOffset: 200,
    },
    {
      id: 'mem-005',
      user_id: null,
      member_code: 'MEM-2026-000005',
      full_name: 'Ananya Rao',
      email: 'ananya.rao@example.com',
      phone: '+919876500008',
      planId: 'plan-gold-001',
      status: 'active',
      daysOffset: 300,
    },
    {
      id: 'mem-006',
      user_id: null,
      member_code: 'MEM-2026-000006',
      full_name: 'Sanjay Nair',
      email: 'sanjay.nair@example.com',
      phone: '+919876500009',
      planId: 'plan-silver-002',
      status: 'active',
      daysOffset: 120,
    },
    {
      id: 'mem-007',
      user_id: null,
      member_code: 'MEM-2026-000007',
      full_name: 'Meera Kapoor',
      email: 'meera.kapoor@example.com',
      phone: '+919876500010',
      planId: 'plan-gold-001',
      status: 'active',
      daysOffset: 60,
    },
    {
      id: 'mem-008',
      user_id: null,
      member_code: 'MEM-2026-000008',
      full_name: 'Rahul Dravid Jr',
      email: 'rahul.jr@example.com',
      phone: '+919876500011',
      planId: 'plan-silver-002',
      status: 'active',
      daysOffset: 240,
    },
    {
      id: 'mem-009',
      user_id: null,
      member_code: 'MEM-2026-000009',
      full_name: 'Pooja Hegde',
      email: 'pooja.hegde@example.com',
      phone: '+919876500012',
      dob: '2011-08-20', // Under 18
      planId: 'plan-junior-003',
      status: 'active',
      daysOffset: 150,
    },
    {
      id: 'mem-010',
      user_id: null,
      member_code: 'MEM-2026-000010',
      full_name: 'Karan Johar',
      email: 'karan.johar@example.com',
      phone: '+919876500013',
      planId: null, // Walk-in member with no membership
      status: 'none',
      daysOffset: null,
    },
  ]

  memoryStore.collections.members = []
  memoryStore.collections.memberships = []

  for (const m of demoMembers) {
    memoryStore.collections.members.push({
      id: m.id,
      user_id: m.user_id,
      member_code: m.member_code,
      full_name: m.full_name,
      email: m.email,
      phone: m.phone,
      dob: m.dob || null,
      created_at: nowIso,
      updated_at: nowIso,
    })

    if (m.planId) {
      const startDate = m.daysOffset < 0 
        ? format(subDays(new Date(), Math.abs(m.daysOffset) + 365), 'yyyy-MM-dd')
        : format(subDays(new Date(), 365 - m.daysOffset), 'yyyy-MM-dd')
      const endDate = format(addDays(new Date(), m.daysOffset), 'yyyy-MM-dd')

      memoryStore.collections.memberships.push({
        id: `mship-${m.id}`,
        member_id: m.id,
        plan_id: m.planId,
        start_date: startDate,
        end_date: endDate,
        status: m.status,
        payment_id: null,
        created_at: nowIso,
      })
    }
  }

  console.log('✅ Core Seed completed:')
  console.log(`- Settings initialized`)
  console.log(`- Plans: ${plans.length}`)
  console.log(`- Courts: ${courts.length}`)
  console.log(`- Users: ${users.length}`)
  console.log(`- Members: ${demoMembers.length}`)
  console.log(`- Active Memberships: ${memoryStore.collections.memberships.filter(m => m.status === 'active').length}`)
  console.log('\n--- CREDENTIALS TABLE ---')
  console.table([
    { Role: 'owner', Email: 'owner@championsclub.in', Password: 'Admin@123' },
    { Role: 'front_desk', Email: 'frontdesk@championsclub.in', Password: 'Staff@123' },
    { Role: 'bar_staff', Email: 'bar@championsclub.in', Password: 'Staff@123' },
    { Role: 'member', Email: 'member@championsclub.in', Password: 'Member@123' },
  ])
}

export default seedCore
