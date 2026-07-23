# Project rules

- `const`/`let` only — never `var`.
- Comments explain **why** only. No comments narrating what the code does.
- No build tooling, no dependencies. Total payload stays under ~30 KB uncompressed.

## Never remove

- The two-stage boot: text paints the moment config resolves; the widget alone
  is gated for the full 1.5s.
- The triple double-click lock: synchronous `locked` flag, `disabled` buttons,
  `pointer-events: none` on the resolved list.
- The dimmed-but-visible unchosen options — nothing is randomised away from
  the user, and they can see that.
- The inline terms expander — terms must not require leaving the page.
