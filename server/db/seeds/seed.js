import runSeeds from '../../src/db/seeds/seed.js'

runSeeds().then(() => process.exit(0)).catch((err) => {
  console.error(err)
  process.exit(1)
})
