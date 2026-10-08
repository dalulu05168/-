# Three-project dashboard visual QA

Source visual truth: user-supplied dark speedometer dashboard attachment, 1200×800 px, 2026-10-08. This is a visual style reference adapted to the user's CRM requirements, not a content-for-content clone.
Implementation: qa-project-1920.png, qa-project-1280.png, qa-project-390.png and qa-project-main.png. Browser viewport sizes match their filenames; deviceScaleFactor 1. State: isolated account-owned project records, 6.99% remaining, Chinese presentation, editable owner view. English and Romanian variants and supervisor view were also exercised.

Comparison: the reference's dark panel palette, blue borders, semicircular luminous dial, dominant number, adjacent chart and metric strip are implemented. The screenshot's sidebar is deliberately omitted and BV branding is retained. Reference AI charts are replaced by project reservation history. The reference blue needle becomes amber below 20%, as required by the user's earlier threshold rule.

Comparison history:
- P2: initial fixed-aspect canvas and unconstrained chart panel pushed records out of a 720p viewport. Fixed desktop presentation grid to fit the viewport, constrained the trend plot and sized the gauge to available vertical space. Revised 1280×720 and 1920×1080 captures show the complete gauge and record panel.
- P2: labels near the dial's highest point were clipped in compact layouts. Reduced the radius based on available height; final captures show every 0/5/10/15/20/40/60/80/100% label.

Typography: large centered financial values, 12px left-aligned panel headings, 8px shared subtitles, explicit standard font fallbacks; no title centering. Layout: responsive two-panel desktop grid, four metrics and scrollable records within the full-screen surface; stacked mobile layout. Palette: consistent #040812 page background and #080f1b modules, restrained blue strokes, amber low-remaining state. Assets: existing BV identity plus Bootstrap edit/return icons; gauge and line plot are live data visualizations, not decorative image substitutes. Copy: account-entered names and notes are retained, no fabricated production values; Chinese, English and Romanian interface variants are complete for the new feature.

Primary interactions: dashboard configuration, three presentation entries, reservation create/update, read-only descendant inspection, return/Esc and migration-missing state tested in an isolated browser. Console errors: none. Production database migration and publication are operational steps and remain pending user execution.

final result: passed
