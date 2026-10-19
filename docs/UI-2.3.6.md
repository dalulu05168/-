# 2.3.6 — unified surfaces, navigation docking and motion

The shell and navigation share one vertically matched deep-blue gradient. Panel, table/header, control and monitor surfaces use closely related blues to reduce abrupt contrast while retaining readable silver text, gold accents and the project ring colors. Original logo assets and backend settings are unchanged.

All page action slots, global search and user controls dock below the navigation menu on desktop. Controls retain their DOM nodes and handlers. Smaller layouts place them below the top bar. A fixed, keyboard-accessible navigation toggle hides/reveals navigation, updates aria-expanded, reclaims content width, persists the device preference through a narrowly scoped Electron preload/IPC bridge (browser previews use localStorage) and moves controls into a reachable top toolbar while hidden. It triggers chart/layout resizing. The toggle remains reachable while navigation is hidden.

The project monitor now uses evenly spaced data columns with an aligned identity area and clock. Major cards/panels across all pages share a subtle lift, gradient shift, border light and shadow on hover; focus remains visible and reduced-motion preferences disable movement. Existing ring interactions remain.

Browser checks cover both roles and all page navigation; additional checks cover all admin views at 1440/1060/768/390 widths, action docking, hide/expand, reload persistence, no overflow and no page errors. Project/customer PNG export checks retain ring color, layout and complete export coverage. Windows smoke acceptance also checks the packaged preference bridge by reading, changing, reading back and restoring the preference in its isolated smoke-test profile. No public preview images were uploaded.

Typography is now uniformly 13px/400, including titles, subtitles, numbers, form controls, table headings and chart labels. Headings share silver color, left alignment, 42px minimum header height and 6px/14px padding; module grids retain 1mm gaps. Logos, icons and ring semantic colors remain.
