# Desktop UI 2.2.0

- Removed page-level headings; moved dashboard/customer/personnel/trade/position and market controls into the top toolbar, preserving their existing event handlers.
- Reduced desktop navigation width to 164 CSS pixels; retained icon navigation and mobile navigation.
- Preserved transparent logo assets and pillar artwork; displayed the existing lettering in white using a clipped duplicate of the same image.
- Replaced project canvas controls with SVG circular progress rings: gold, green and blue. Each ring uses the actual remaining / total share ratio and retains project selection.
- Rearranged market view into a compact stock list alongside quote details and chart. Country and symbol controls are in the top toolbar.
- Module gaps remain 1 CSS millimetre (approximately 3.78 CSS pixels); physical screen distance depends on display scaling.

Validation: 20 automated tests passed. Both roles passed all 34 desktop/mobile module navigation checks. Dashboard interval, customer form, customer navigation and project navigation passed for both roles. Preview screenshots use explicitly simulated data, with no production writes. Real-account login was not revalidated in this environment.
