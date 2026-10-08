# Found Pre-Existing Bugs Log

Per the project protocol, functional and test-runner bugs identified during Phase 0 are documented here and **not modified** during the style overhaul:

1. **Client Linter Configuration (ESLint 9 Migration)**:
   - **Issue**: Running `npm run lint` in `client` triggers: `ESLint: 9.39.5 - ESLint couldn't find an eslint.config.(js|mjs|cjs) file`.
   - **Root Cause**: ESLint v9 requires the flat config `eslint.config.js` while the repository lacks an ESLint config file.
   - **Status**: ✅ **RESOLVED** (Implementation Plan Phase 0): added `client/eslint.config.js` (flat config, React + hooks + refresh rules, `react/prop-types` off — the codebase does not use PropTypes) and fixed every surfaced error (unused imports/bindings, missing `Link` import in `BarPos.jsx`, conditional `useSelector` in `MemberLayout.jsx`, unescaped entities, empty catch). `npm run lint` in `client` now exits 0 (21 `exhaustive-deps`/fast-refresh warnings remain intentionally: adding deps would change effect timing on frozen flows).

2. **Server Integration Test Suite (`tests/integration/*.test.js`)**:
   - **Issue**: `npm run test` in `server` fails in integration tests (`TypeError: Cannot read properties of undefined (reading 'token')` at `memberToken = loginRes.body.data.token`).
   - **Root Cause**: The test runner fixture relies on an active DB or mock token response structure differing from the seeded test helper expectation.
   - **Unit Tests**: Pure unit tests pass 100% (`clubTime.test.js` PASS, `money.test.js` PASS).
   - **Status**: ✅ **RESOLVED** (Implementation Plan Phase 0). Real root cause confirmed: seeds populate the in-memory store only, while repositories query the configured Postgres *first* — stale rows in the dev database (`member@` with a different password hash, leftover `hacker@example.com` from earlier runs) contradicted the fixtures, so logins returned 401/409. Fix: `config/postgres.js` now provides a hermetic test mode (stub pool when `NODE_ENV=test`/`JEST_WORKER_ID` set, so every repository falls back to the seeded memory store; opt back into a real database with `DB_IN_TESTS=true`). This also eliminated the "Jest did not exit" warning (no sockets leak past teardown). `npm test` in `server` now exits 0: 8 suites / 25 tests, including new PDF-invariant suites.
   - **Related fix**: `npm run seed` now also upserts the four demo accounts into Postgres (idempotent, keyed on the unique email) so the documented credentials work against a real database — verified with bcrypt comparison against all four accounts (`ALL_OK: true`).
