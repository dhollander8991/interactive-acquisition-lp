# Project rules

- `const`/`let` only — never `var`.
- Comments explain **why** only. No comments narrating what the code does.
- No build tooling, no dependencies. Total payload stays under ~30 KB uncompressed.

## Never remove

- The two-stage boot: text paints the moment config resolves; the widget alone
  is gated for the full 1.5s.
- The double-click animation guard: a synchronous transient lock covering the
  resolve transition, so a rapid double-tap registers exactly one selection.
  Selection stays editable after — the commitment point is the CTA, not the
  pick.
- The dimmed-but-visible unchosen options — nothing is randomised away from
  the user, and they can see that (and switch to them until the CTA commit).
- The inline terms expander — terms must not require leaving the page.
