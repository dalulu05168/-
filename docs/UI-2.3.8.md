# 2.3.8 — purposeful motion and truthful data feedback

The dashboard, market and allocation pages fade in over 220ms. Existing card/ring hover motion remains; the project monitor no longer sweeps or pulses continuously. Value changes briefly highlight for 650ms and then stop. Initial values do not highlight, unchanged values do not repeat, and each metric/ticker/allocation has a distinct identity to prevent false flashing. Reduced-motion preferences disable page/value motion and press movement.

A small status uses the existing dashboard caption, market heading and monitor identity area. It reports pending/error/success from the actual data loading paths and the time of successful retrieval. Offline state takes precedence; network restoration shows refresh-required until that scope is refreshed. Errors remain explicit. The navigation status indicator also reflects offline/error/pending states. This adds no empty top toolbar.

Market feedback distinguishes provider-reported market state, real-time/delayed metadata, exchange quote timestamp and retrieval timestamp. Unknown market states are not inferred from prices or time of day. Prior-day timestamps include a date. Selecting a cached quote uses its original retrieval timestamp. No new polling, WebSocket push, backend tables, policies or credentials are introduced; the existing 60-second market refresh is retained.

Checks cover initial/no-repeat/one-shot change feedback, actual event states, synthetic offline/recovery/error conditions, delayed/closed and real-time-source labels, reduced motion and desktop/mobile layouts. Existing navigation/typography, compact spacing/bottom alignment and project/customer export checks remain applicable. Browser checks use explicit simulated fixtures; no business data is changed.
