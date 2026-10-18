# Silver/gold text and complete PNG exports — 2.3.0

Primary text uses bright silver, secondary text uses neutral silver-grey, and links/key figures use gold instead of blue. Project allocation figures share a gold foreground while the three ring strokes remain gold/green/blue; percentage text is silver. Chart axis and legend text use silver.

Market metrics use inline SVG icons with distinct gold, mint, coral, silver and lavender colors. Header, card, metadata strip and alternating table rows have distinct dark navy layers. Project chart stretches to the adjacent summary height, reducing unused space. Existing compact headers, 1 CSS mm gaps and original logo files are retained.

PNG export now targets the business section rather than the application shell. The cloned export layout excludes navigation/actions, uses a content-driven height, adds a complete branded project header and renders SVG/white logo lettering at export density. Export status is cleared when switching pages. The customer report logo is bounded to 160×120 CSS pixels. No records are sent to an external image service.

Verification: 22 automated tests passed; actual project and customer download flows generated 3840×4218 and 3840×4469 PNGs with the simulated fixture. Images were visually inspected for complete logo, rings, charts and tables. scripts/desktop-export-qa.cjs verifies PNG downloads, gold figures, distinct nonblack icons, status cleanup, original UI retention and bounded logo. Previews and export examples contain explicitly simulated data, not live customer records. No backend configuration or database records were changed.
