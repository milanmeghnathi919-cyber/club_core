# Found Pre-Existing Bugs Log

Per the project protocol, functional and test-runner bugs identified during Phase 0 are documented here and **not modified** during the style overhaul:

1. **Client Linter Configuration (ESLint 9 Migration)**:
   - **Issue**: Running `npm run lint` in `client` triggers: `ESLint: 9.39.5 - ESLint couldn't find an eslint.config.(js|mjs|cjs) file`.
   - **Root Cause**: ESLint v9 requires the flat config `eslint.config.js` while the repository lacks an ESLint config file.
   - **Status**: Pre-existing configuration issue. Preserved untouched per the rule.

2. **Server Integration Test Suite (`tests/integration/*.test.js`)**:
   - **Issue**: `npm run test` in `server` fails in integration tests (`TypeError: Cannot read properties of undefined (reading 'token')` at `memberToken = loginRes.body.data.token`).
   - **Root Cause**: The test runner fixture relies on an active DB or mock token response structure differing from the seeded test helper expectation.
   - **Unit Tests**: Pure unit tests pass 100% (`clubTime.test.js` PASS, `money.test.js` PASS).
   - **Status**: Backend code is strictly forbidden from modification. Preserved untouched.
