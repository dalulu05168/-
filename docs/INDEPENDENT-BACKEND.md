# Independent desktop backend 2.2.1

Dedicated project: xsubbvtngsovcaexkiqi. Original site: igcmvzoxminzvcgwimwi.

The dedicated project has its own database, Auth users, public API key and three Edge Functions. Only schema and business logic were copied. No source profiles, customers, trades, positions, reservations or passwords were copied. No external database links or sync jobs were created.

Original project requests are rejected in Electron. Missing/forbidden backend configuration prevents login and installer generation. Session storage is scoped by Supabase project reference.

On explicit user authorization, project4-trading-platform (nukvroaolkxewfnqfiui) was paused to free a free-plan slot. No paid upgrade was performed. Free-plan quotas and inactivity pausing still apply.

First run: create a fresh administrator using the initialization form and the separately supplied bootstrap code. Initialization code is stored only as a SHA-256 hash server-side; it is not bundled with the client. Staff creation is restricted to active administrators and produces level2 accounts.

Verification: empty schema applied successfully; a real database transaction verified buy 10 / sell 4 produced quantity 6 and realized profit 40, and a peer account could not read the test customer or trades. Transaction rolled back. Source data was read only for metadata, and no source records were migrated. Direct Supabase HTTPS is blocked in the development sandbox; full real-account login has not been verified here.

Security advisors: system_config deliberately has RLS with no client policies (service-only bootstrap configuration). The two exposed SECURITY DEFINER RPCs are intentional business operations with explicit auth.uid and ownership checks; other definer functions have execute revoked from public/anon. See https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

Edge staff-admin performs its own bearer token validation with auth.getUser and checks active admin role. Gateway legacy-key-only verification is disabled for compatibility with modern Supabase tokens. See https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
