/**
 * Mail connectivity test — authenticates against Google SMTP without sending.
 *
 *   npm run mail:test
 *
 * Useful when you want to confirm the app password works but do not want a
 * real email landing in an inbox yet.
 */
import config from '../config/index.js'
import { isMailConfigured, verifyMail } from '../utils/mailer.js'

const PLACEHOLDER = /^(YOUR-|PASTE_|your-|replace-with)/i

async function main() {
  console.log('\nGoogle SMTP test\n')

  const { user, pass, host, port } = config.mail

  if (!user || !pass) {
    console.log('  FAIL  EMAIL_USER / EMAIL_PASS not set in .env')
    console.log('        Google pass key / app password: https://myaccount.google.com/apppasswords\n')
    process.exit(1)
  }

  if (PLACEHOLDER.test(user) || PLACEHOLDER.test(pass)) {
    console.log(`  FAIL  still placeholders`)
    console.log(`        EMAIL_USER=${user}`)
    console.log('        replace EMAIL_PASS with a 16-character Google pass key / app password\n')
    process.exit(1)
  }

  console.log(`  account: ${user}`)
  console.log('  service: Google Gmail')
  console.log(`  passkey: ${'*'.repeat(pass.replace(/\s+/g, '').length)} (${pass.replace(/\s+/g, '').length} chars)\n`)

  try {
    await verifyMail()
    console.log('  PASS  authenticated with Google SMTP\n')
    console.log('  Verification emails will be delivered to real inboxes.\n')
    process.exit(0)
  } catch (err) {
    console.log(`  FAIL  ${err.message.split('\n')[0]}\n`)

    const code = err.responseCode ?? err.code
    if (code === 535 || /invalid login|authentication/i.test(err.message)) {
      console.log('  535 = the app password / pass key is wrong, revoked, or belongs to another account.\n')
      console.log('  Check:')
      console.log('    1. EMAIL_PASS is the Google APP password / pass key, not your Google account password')
      console.log('    2. The app password still exists at myaccount.google.com/apppasswords')
      console.log('    3. EMAIL_USER is the Google account the app password was generated for')
      console.log('    4. Spaces in the pass key are stripped automatically before use\n')
    } else if (code === 421 || /ECONNREFUSED|ETIMEDOUT|getaddrinfo/i.test(err.message)) {
      console.log('  Could not reach smtp.gmail.com. Check network or firewall.\n')
    } else {
      console.log('  See nodemailer docs: https://nodemailer.com/smtp/testing\n')
    }

    process.exit(1)
  }
}

void isMailConfigured
main()