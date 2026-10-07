Page transitions and language review — 2026-10-07

- Navigation fades out over 180 ms and in over 220 ms, without moving the content. Async page rendering is serialized; the latest navigation wins. Reduced-motion preference disables fades.
- Reviewed Chinese, English and Romanian financial labels, actions, compound subtitles and count legends. Corrected Romanian grammar and diacritics, English plurals, account manager wording, cost basis, realized/unrealized P/L and Romanian time terminology. Client notes and service content are excluded from translation.
- All shared panel subtitles and inline legends use 8 px, normal weight and consistent line height. Titles remain left-aligned and module backgrounds remain solid navy.
- Browser checks passed for 27 language/page combinations, three customer-detail language variants, actual intermediate fade opacity, rapid navigation, reduced motion and subtitle sizing. Authentication and customer records were fixtures; database calls were intercepted.
