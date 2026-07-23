(function () {
  'use strict';

  const SPINNER_MS = 1500;
  const vertical = document.body.dataset.vertical;

  /* One-shot lock, set synchronously before any async work — a second tap
     during the reveal must not register a second choice. Two more layers
     back it up: disabled buttons and pointer-events on the resolved list. */
  let locked = false;

  const loader = document.getElementById('loader');
  const choiceList = document.getElementById('choices');
  const result = document.getElementById('result');

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fill = (selector, value) => {
    const node = document.querySelector(selector);
    if (node && value != null) node.textContent = value;
  };

  const readVariant = () => {
    const raw = new URLSearchParams(window.location.search).get('variant');
    return raw && raw.trim().toUpperCase() === 'B' ? 'B' : 'A';
  };

  const renderText = (cfg) => {
    const variant = readVariant();

    document.documentElement.lang = cfg.locale;
    document.title = `${cfg.headline[variant]} — ${cfg.brand}`;
    document.body.dataset.variant = variant;

    fill('.wordmark', cfg.brand);
    fill('.age-badge', cfg.compliance.ageLimit);
    fill('.eyebrow', cfg.eyebrow);
    fill('.headline', cfg.headline[variant]);
    fill('.subhead', cfg.subhead);
    fill('.prompt', cfg.prompt);

    /* Trust line rides inside the subhead's reserved block so its late
       paint cannot shift the widget. */
    const subhead = document.querySelector('.subhead');
    if (subhead && cfg.trustline) subhead.append(spanFor('trustline', cfg.trustline));

    if (cfg.steps && !document.querySelector('.result-steps')) {
      const strip = document.createElement('ol');
      strip.className = 'result-steps';
      cfg.steps.forEach((step) => {
        const li = document.createElement('li');
        li.textContent = step;
        strip.appendChild(li);
      });
      result.insertBefore(strip, document.querySelector('.cta'));
    }

    fill('.rg-message', cfg.compliance.message);
    fill('.licence', cfg.compliance.licence);
    fill('.terms-toggle-label', cfg.compliance.termsLabel);

    const help = document.querySelector('.rg-link');
    if (help) {
      help.textContent = cfg.compliance.helpLabel;
      help.href = cfg.compliance.helpUrl;
    }

    const termsList = document.querySelector('.terms-body ul');
    if (termsList) {
      termsList.innerHTML = '';
      cfg.choices.forEach((choice) => {
        const li = document.createElement('li');
        li.textContent = `${choice.title} — ${choice.terms}`;
        termsList.appendChild(li);
      });
      const general = document.createElement('li');
      general.textContent = cfg.offer.wagering;
      termsList.appendChild(general);
    }
  };

  const spanFor = (className, text) => {
    const node = document.createElement('span');
    node.className = className;
    node.textContent = text;
    return node;
  };

  const renderChoices = (cfg) => {
    choiceList.innerHTML = '';

    cfg.choices.forEach((choice) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice';
      button.setAttribute('aria-pressed', 'false');
      button.dataset.id = choice.id;

      button.append(spanFor('choice-kicker', choice.kicker));
      if (choice.figure) button.append(spanFor('choice-figure', choice.figure));

      /* An em-dash in the label marks a fixture — set the teams large with
         a vs between them, the matchday-billboard treatment. */
      const label = choice.label || choice.title;
      if (label.includes(' — ')) {
        const [home, away] = label.split(' — ');
        const fixture = document.createElement('span');
        fixture.className = 'choice-title choice-title--fixture';
        fixture.append(spanFor('team', home), spanFor('vs', 'vs'), spanFor('team', away));
        button.append(fixture);
      } else {
        button.append(spanFor('choice-title', label));
      }

      button.append(spanFor('choice-detail', choice.detail));

      if (choice.days) {
        const chips = document.createElement('span');
        chips.className = 'day-chips';
        for (let d = 1; d <= choice.days; d += 1) chips.append(spanFor('day-chip', `D${d}`));
        button.append(chips);
      }
      button.addEventListener('click', () => choose(cfg, choice));

      li.appendChild(button);
      choiceList.appendChild(li);
    });
  };

  const choose = (cfg, choice) => {
    if (locked) return;
    locked = true;

    choiceList.querySelectorAll('.choice').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.id === choice.id));
      button.disabled = true;
    });

    choiceList.classList.add('is-resolved');

    fill('.result-title', choice.title);
    fill('.result-terms', choice.terms);

    const cta = document.querySelector('.cta');
    if (cta) {
      cta.textContent = cfg.cta;
      cta.href = `${cfg.ctaHref}?offer=${encodeURIComponent(choice.id)}`;
    }

    result.hidden = false;
    requestAnimationFrame(() => {
      /* The reveal can land below the fold — bring it into view. nearest
         scrolls the minimum distance, so no jump when already visible. */
      result.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'nearest'
      });
      requestAnimationFrame(() => result.classList.add('is-shown'));
    });
  };

  const dismissLoader = () => {
    loader.classList.add('is-leaving');
    window.setTimeout(() => { loader.hidden = true; }, 280);
  };

  const termsToggle = document.querySelector('.terms-toggle');
  if (termsToggle) {
    termsToggle.addEventListener('click', () => {
      const body = document.querySelector('.terms-body');
      const open = termsToggle.getAttribute('aria-expanded') === 'true';
      termsToggle.setAttribute('aria-expanded', String(!open));
      body.hidden = open;
    });
  }

  /* Two-stage boot. The config fetch doubles as the simulated API call, so
     the spinner covers real async work rather than a bare timer. Text paints
     the moment config resolves; the widget alone waits out the full 1.5s,
     so the required delay never puts a floor under first paint. */
  const config = fetch('config.json').then((response) => {
    if (!response.ok) throw new Error(`config ${response.status}`);
    return response.json();
  });

  config.then((data) => renderText(data[vertical])).catch(() => {});

  Promise.all([config, delay(SPINNER_MS)])
    .then(([data]) => {
      renderChoices(data[vertical]);
      dismissLoader();
    })
    .catch(() => {
      fill('.loader-label', 'Offers unavailable. Please refresh.');
      loader.querySelector('.spinner').remove();
    });
})();
