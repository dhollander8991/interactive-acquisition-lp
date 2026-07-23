# Interactive acquisition landing pages — Casino & Sports

Two mobile-first interactive concepts built on one shared engine. No frameworks, no
animation libraries, no webfonts, no raster images. All page content is fetched from
`config.json` at runtime.

> **On the data.** Offers, fixtures and terms in `config.json` are illustrative and do not
> represent live Entain promotions. The compliance strings and market-specific requirements
> (entities, regulators, wagering rules) are drawn from observed production examples.

| | |
|---|---|
| **Casino** | `index.html` — pick your welcome offer |
| **Sports** | `sports.html` — pick a fixture, unlock a free bet on it |
| **A/B test** | append `?variant=A` or `?variant=B` to either page |
| **Total payload** | ~22 KB uncompressed across all five files |

Run locally with any static server — `python3 -m http.server` from the project root.

---

## Strategy & Competitors

### How the research was done, and what it couldn't reach

Worth stating up front, because it shaped the findings. Gambling acquisition funnels are
geo-gated at three layers simultaneously: Google won't serve gambling ads into
non-permitted markets, the app stores region-lock the apps, and the operator sites
themselves block by IP. Paid landing pages are not indexed and cannot be reached without
clicking a live ad in a permitted geography.

So the research used what is publicly reachable: the **Google Ads Transparency Center**
(UK and DE), **Apple's web App Store listings** across storefronts, published **landing
page URL structures**, and direct capture of the pages that did resolve. One methodological
note — advertiser-name search returns entity collisions (a search for one operator returned
an unrelated construction firm sharing a trading name), so every finding was verified
against the landing-page domain rather than the advertiser label.

Operators reviewed: bwin, Ladbrokes, Coral, PartyPoker, Foxy Bingo (Entain); bet365, Paddy
Power, Betfair, PokerStars, LeoVegas, 888casino, Tipico (competitors), across UK, DE and SE.

### What the market is actually doing

**1. Acquisition pages are static. Universally.** Every operator page I reached resolves to
the same pattern: photographic hero, one offer, one CTA. bwin's live sports LP is a static
hero plus a three-step explainer — *Registrieren → Einzahlen → Verdoppeln* — rendered as
plain text. Not one tier-1 operator runs an interactive acquisition page.

Note that this **contradicts the affiliate marketing literature**, which describes
spin-to-win and scratch-card pre-landers as standard practice. That material describes
affiliate tactics, not licensed operator practice. The primary research corrected the
secondhand source.

**2. But the mechanic exists — behind registration.** Three operators run free-to-play
games as *retention* products:

- **Ladbrokes 1-2-Free** — predict three correct scores, share of a £10k pot. One entry per
  player per week, entry closes before first kickoff.
- **Paddy Power Cash Cup** — daily free-to-play, £750k across the tournament.
- **bet365 Prize Matcher** — daily free-to-play, win free spins, golden chips or free bets.

**3. bwin has none of it.** Its app listing sells bonus, market count, sponsorships, price
boosts and live betting. No free-to-play mechanic anywhere — in a market where two direct
rivals have one.

**4. Germany is fought differently.** Ad volume in the German archive runs an order of
magnitude below the UK (Tipico Games 60 ads, PokerStars DE 55, against ~2k each for
bet365 and Ladbrokes in the UK). German advertising restrictions cap the spend lever, which
means the page itself carries proportionally more of the acquisition load.

### The gap, and what I built

> The mechanic is proven. Entain already owns it. It runs on Ladbrokes in the UK. It has
> not been ported to bwin in Germany, and nobody in the category has moved it forward from
> retention into acquisition.

That framing is the concept. Not inventing a mechanic — **distributing one the group
already operates**, into the market where the page has to work hardest. Which is precisely
what a config-driven, one-engine-many-skins build is for.

Both concepts run the same state machine:

```
fetch config → spinner (1.5s) → one locked choice → reveal → offer + CTA
```

**Casino:** three welcome offers, you pick one. **Sports:** three World Cup fixtures, you
pick one, the free bet attaches to that fixture. Same engine, same lock, same A/B hook —
different data and theme.

### How it improves on what's in the market

**The interaction is honest.** No spin, no scratch, no simulated win. You see all three
options, you choose one, and — the design decision I'd defend hardest — **the options you
didn't pick stay on screen, dimmed rather than removed.** Nothing was randomised away from
you. This isn't only an ethics position: CAP Code rule 16.3.12 (strengthened October 2022,
guidance updated 2025) prohibits gambling ads of strong appeal to under-18s, and the
supporting guidance explicitly names *animation styles closely connected to youth culture*
as an indicator. A cartoon prize wheel is the exact register the regulator described.
bet365 and Ladbrokes independently reached the same conclusion — both label their mechanics
"FREE GAME" / "FREE TO PLAY" and neither simulates a wager pre-registration.

**Interactive without the payload.** The reason nobody ships interactive acquisition pages
is presumably weight — and weight is a revenue problem, not just a technical one: page speed
feeds Google Ads Quality Score, so a slow page raises cost-per-click as well as losing
conversions. This build is ~22 KB total, uncompressed, with zero third-party requests.
Interactivity was never the thing that made pages heavy; the libraries were.

**Compliance is a data field, not decoration.** Every bwin app frame carries the same
four-part strip — 18+ | Suchtrisiko | buwei.de | Lizenziert (Whitelist) | AGB gelten. Every
Paddy Power frame carries "Take Time to Think." Not a footer, not once per page: on every
surface, per market. So `config.json` carries `ageLimit`, `message`, `helpUrl`, `licence`
and per-offer `terms` as first-class fields. Switching `casino` (UK) to `sports` (DE)
changes the legal entity's disclosure set, the currency, the offer structure and the locale
in one data swap.

**The wagering requirement renders next to the offer claim**, not below the fold, and full
terms open in an inline expander rather than a link that exits the funnel — matching bwin's
own `TEILNAHMEBEDINGUNGEN` pattern. That's a conversion decision as much as a compliance one:
sending someone off-page to read terms costs you the disclosure *and* the registration.

**Design direction.** Editorial rather than arcade — serif display, hairline rules, a single
metal accent per vertical. The serif is drawn from racing form guides and matchday
programmes, which is native to this subject's world and deliberately not the register CAP
guidance flags.

### The A/B test is one observed live

Not invented. Ladbrokes was running three creative variations where the description was
byte-identical and only the headline moved:

- **A** — "Bet £5 & Get £30 Welcome Bonus" (qualifying condition in the headline)
- **B** — "Get £30 Welcome Bonus Here" (condition removed)

A single-variable test on whether disclosing the friction up front suppresses clicks or
pre-qualifies better traffic. Paddy Power runs the same shape on a different axis — "60 Free
Spins, No Deposit" against "260 Free Spins Welcome Offer": lead with the credible
no-friction number, or the big total.

`?variant=B` implements that structure. Both headlines live in `config.json`, so a new test
is a data change rather than a deploy.

---

## Next Steps

If I had another week, in priority order.

**1. Instrumentation first — nothing else is worth doing without it.** Right now the A/B
test can be *served* but not *read*. I'd add a consistent event schema
(`page_view` → `choice_made` → `cta_click`) with the variant on every event, pushed to
`dataLayer` for GA4, plus persisted variant assignment so a returning user stays in their
bucket. Ten variants you can't measure is ten guesses, not ten experiments.

**2. A pre-flight check that lints the built page before it goes live.** Four gates, one
pass: Google Ads landing-page policy conformance (a disapproved ad stops the campaign
regardless of how good the page is), a Core Web Vitals budget, GA4 event-schema presence,
and the market's gambling compliance rules — age gate, RG link resolving to the correct
regional body, wagering requirement adjacent to the offer claim, no prohibited language.

This isn't hypothetical. While researching, I found a **live bwin ad, last shown 21 July
2026, whose copy states the offer runs "bis 31/12/2025"** — seven months past expiry, on a
creative shown 30–35k times. Whether the stale artifact is the creative or the page,
`offer.validUntil` already exists in the config; the check would assert against it and fail
the build. Detecting expiry belongs in a pipeline, not in a human's memory.

**3. Real fixture data.** The sports concept hard-codes three fixtures in config. It should
read from a fixtures feed, with kickoff as a genuine entry deadline — Ladbrokes' 1-2-Free
closes entry before first kickoff, which is honest scarcity rather than a manufactured
countdown timer.

**4. Variant generation from the seed page.** With the engine config-driven, generating the
next test variant is a data operation. The discipline that matters: each variant changes
exactly **one** thing, or the result is confounded and a win teaches you nothing about why.

**5. Quantified social proof.** Paddy Power surfaces "Backed 22,455 times" on bet builders —
a number, not an adjective. The reveal panel is the natural home for something equivalent.

**6. Server-rendered first paint.** Currently the headline arrives with the config fetch. In
a CMS-backed build the offer copy would render server-side and the widget would hydrate,
removing the fetch from the critical path entirely.

---

## Technical notes

### The requirement that fights itself

The brief asks for a 1.5s spinner *and* treats performance as a priority. Gating the whole
page render behind a fixed delay would put a floor of 1.5s under LCP and hand back the
performance the rest of the build is protecting.

The brief says the delay is before the page becomes **interactive** — not before it renders.
So the engine boots in two stages: text content paints the moment the config resolves, and
the widget is gated for the full 1.5s independently. Reading the requirement literally
satisfies both.

The config fetch also *is* the simulated API call —
`Promise.all([fetch, delay(1500)])` — so the spinner covers real async work rather than a
bare timer, and a slow network extends the wait rather than breaking the contract.

### Double-submission

Three defences, because the failure is silent: a module-level `locked` flag set
synchronously before any async work; every button `disabled` on resolve; and
`pointer-events: none` on the resolved container. Verified with an automated triple-click —
only the first registers.

### Performance

No webfonts (system stack), no raster images (CSS and inline SVG only), no third-party
requests, one CSS file and one deferred JS file. Widget height is reserved up front so the
spinner-to-content swap causes no layout shift, and the headline block reserves two lines so
config arrival can't reflow the page. `prefers-reduced-motion` is respected; focus is
visible throughout. The favicon is an inline data URI to avoid a request.

The demo pages are left indexable so all four Lighthouse categories can be audited on the
live URL. A production paid landing page would carry `noindex` — these pages aren't meant to
be crawled — but that trades away the SEO category, so it's omitted here deliberately.

### On SASS

The brief allows "modern CSS/SASS". I used plain CSS with custom properties and no build
step — the two themes are token overrides on a single class, which is what I'd have used
SASS variables for. Nothing to compile means nothing to bundle, which is consistent with the
performance argument.

### Requirements checklist

| Requirement | Where |
|---|---|
| No external libraries | Zero dependencies; `app.js` is vanilla |
| Dynamic data, nothing hardcoded | `config.json` drives copy, offers, terms, compliance, locale |
| Double-click prevention | `locked` flag + `disabled` + `pointer-events: none` |
| 1.5s loading spinner | `Promise.all([fetch, delay(1500)])`, widget-scoped |
| A/B test via URL param | `?variant=A` / `?variant=B` |
| Mobile-first | Built and tested at 390×844 |
| Site speed | ~22 KB total, no third-party requests |
