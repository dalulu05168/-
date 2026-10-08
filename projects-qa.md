Three private allocation projects — 2026-10-08

Implemented three editable project slots per account. The dashboard configuration controls remain next to the existing main-page actions for administrators; staff dashboards have the same three-project entry strip. Each project opens a separate full-screen presentation surface with BV branding, project information and a return control, with the CRM navigation hidden. Browser full-screen is requested from the user's open action and CSS full-screen remains available if that API is denied.

The reference is the user-supplied 1200 × 800 dark instrument dashboard. The layout adapts its gauge, adjacent chart and bottom metrics to reservation information, retaining the supplied BV identity and removing the reference's navigation and unrelated AI metrics. Modules use near-black navy with blue borders; remaining values below 20% use amber. The explicitly labelled 0–20% interval occupies 60% of the dial so low balances are readable; numbers remain real percentages. Drawn charts use real project snapshots, with an honest empty state if there are none.

Browser validation used local isolated records and blocked all production Supabase traffic. Passed: admin/Level 1/Level 2 entries, nine language/project combinations, 1920×1080, 1280×720 and 390×844 widths, full-screen gauge rendering, 8px subtitles, left-aligned titles, full desktop record-panel visibility, name/quantity editing, reservation snapshot create/update, supervisor read-only controls, exit restoration and closed behavior when the database schema is missing. No JavaScript errors.

PostgreSQL tests run the migration twice and exercise authenticated identities with actual RLS: owner writes, recursive ancestor reads, peer denial, unrelated administrator denial, disabled-account denial, forged-owner rejection, RPC capacity/date validation, direct reservation write rejection and atomic remaining-balance updates. Chart scale and project validation tests also pass. Existing security-info tests pass.

Production schema application is a separate required step: the user is executing migrations/20261008_allocation_projects.sql in Supabase SQL Editor. The frontend is not considered live-complete until the migration and deployment are confirmed.

## Three-project portfolio window — 2026-10-08

The three owner-scoped projects now remain visible together. Project selection changes only the lower reservation trend, details, and ledger. Existing project editing and reservation RPCs are retained. No totals are combined across currencies. Empty project slots remain editable, with no generated data.

The reference theme uses charcoal surfaces and pale blue controls throughout the main CRM, customer detail, login, modal and full-screen project views. Low remaining allocation keeps an orange warning; financial gains/losses retain semantic colours. Screenshot mode hides identity, internal project labels and all edit/navigation controls; Esc restores controls.

Validation: syntax checks and existing npm tests passed. Isolated jsdom DOM checks passed for Chinese, English and Romanian: three visible projects, selected chart/ledger data isolation, company title symbol validation, screenshot restore, independent project editing, supervisor read-only, blank slots and schema failure. These checks do not replace a production browser visual inspection. Canva API returned Unknown tool; no Canva design was created. Deployment pending.

## Brighter 16:9 desktop layout — 2026-10-08

A shared 1600×900 frame now scales within desktop viewports (minimum 900×500). The outer page does not scroll. Tables, market listings, team cards, service history and holdings breakdown use pagination; small screens retain the responsive layout. Customer screenshot mode preserves client identity while hiding action controls and internal ownership.

All panels use brighter charcoal surfaces, legible muted text, twelve-pixel gaps and a white gradient one-pixel hover outline. Rendering remains data-driven; customer order history no longer truncates to ten rows.

Validation passed: existing npm tests, three-language project DOM checks, five viewport fit calculations, navigation through every one of 113 fixture table rows, preserved action handlers, all 21 fixture holdings across three currencies, screenshot name visibility, mobile row restoration, and HTTP serving of the new viewport module. These are DOM and server checks, not a logged-in production browser visual audit.

## Panoramic project energy rings — 2026-10-08

The three true remaining-progress rings use stable project colours: yellow #ffe43b, vivid blue #3984ff and ice blue #83edff. Canvas strokes and percentages have soft glow; CSS smoke halos rotate gently and strengthen below 20%. Reduced-motion preferences stop animation and screenshot mode pauses it. No percentages or records are fabricated.

The rings are native keyboard-accessible selection buttons; the repeated project detail/edit actions and two Romanian-time subtitles are removed. Quantity configuration stays on the dashboard. Owners can rename only the selected project through the details panel; the update includes both project ID and authenticated owner ID filters. Supervisors remain read-only under the existing database RLS. Matching-colour project names appear in the upper-left of the detail panel.

All roles use the same panoramic logo/header layout. The screenshot control moves into this header and is restored to the normal toolbar on exit. Existing native full-screen support remains gesture-based.

Validation: existing npm tests, three-language isolated DOM tests (three ring colours, ring selection, selected ledger, name-only save and owner filter, screenshot restore, blank slots and supervisor read-only), and desktop-frame/pagination checks passed. No logged-in production browser visual audit was available. Canva create-design returned Unknown tool.
