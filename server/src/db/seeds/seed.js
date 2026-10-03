import seedCore from './seed.core.js'
import seedCommerce from './seed.commerce.js'

export const runSeeds = async () => {
  console.log('🚀 Running Champions Club database seeds...\n')
  try {
    await seedCore()
    console.log('')
    await seedCommerce()
    console.log('\n✨ Database seeding completed successfully!')
  } catch (err) {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  }
}

// If invoked directly
if (process.argv[1]?.endsWith('seed.js')) {
  runSeeds().then(() => process.exit(0))
}

export default runSeeds
