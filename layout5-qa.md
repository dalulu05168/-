# Shared main-page style and layout correction QA — 2026-10-07

Design grounding: Canva DAHXR1tf72s, user's marked level-two dashboard/report/allocation screenshots. Canva read-only reference; source and browser debugging performed locally.

Corrections:
- Level-two and level-one order-mix legends moved into subtitle row. Doughnut scales removed; level-two summary height no longer clips fourth row.
- Reports owner chart starts at zero, max rounded up to at least 10, tick step 10; max bar width remains 36px.
- Main panel headings/subtitles are left-aligned. Financial metric cards, table cells and allocation information centered. Allocation identity split into symbol/company blocks, quote placed centrally.
- Scrollbar hidden on main/detail/table containers; scrolling retained so lower records remain accessible.
- Allocation quote merge preserves valid security-info history when market history is empty. Disconnected chart instances recreated. Charts resize and redraw after navigation completes; allocation animation disabled.
- Asset version bumped to 20261007-layout5.

Verified with isolated Chromium and real Chart.js, no real customer read/write requests:
- Initial allocation canvas 1352x450 with 265200 nontransparent pixels.
- Real public PL history fallback: 40 data points and painted canvas after market returned empty history.
- Missing quote, symbol mismatch, recovery and 20% threshold checks passed.
- Share board at 2048/1920/1280/390 widths: no horizontal overflow and 13 index tiles contained.
- Reports: y max 10 for one person, tick step 10, ownership bar width 36px, doughnut has no axes.
- Level two at 1280x733: legend inside heading; subtitle 8px; four summary rows visible, each at least 34px. At 1024 and 390: no horizontal overflow, five metric footers contained, all summary rows at least 35px.
- Customer and market regression checks passed. JavaScript syntax and existing security-info tests passed.
- Screenshots visually reviewed; authentication views use fixtures, no production client operations exercised.

Final user clarification: section headings match main-page 12px left-aligned type; subtitles 8px; table content 10px. All major modules, headings, chart surfaces and financial rows use solid #061722 without transparent or pale-blue variants. Main trend legend (new customers/trade records and green/purple color keys) placed above canvas alongside subtitle, built-in legend disabled. Main right-side usage summary fully contained after compact spacing. Checked computed heading alignment, subtitle fonts, module colors and external legend geometry in Chromium. Additional page-standard checks cover customers, personnel, trades, positions and settings.
