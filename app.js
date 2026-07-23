/* ============================================================
   Shared engine. Both verticals run this file unchanged —
   the only difference between the two pages is the config key
   on <body data-vertical> and the theme class.
   ============================================================ */

(function () {
  'use strict';

  var SPINNER_MS = 1500;
  var vertical = document.body.dataset.vertical;

  /* One-shot lock. Set before any async work begins, so a second
     tap during the reveal cannot register a second choice. */
  var locked = false;

  var loader = document.getElementById('loader');
  var choiceList = document.getElementById('choices');
  var result = document.getElementById('result');

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function fill(selector, value) {
    var node = document.querySelector(selector);
    if (node && value != null) node.textContent = value;
  }

  /* ---- A/B ------------------------------------------------
     ?variant=B serves the challenger headline; anything else
     falls through to control. Both headlines live in config,
     so a new test is a data change, not a deploy.            */

  function readVariant() {
    var raw = new URLSearchParams(window.location.search).get('variant');
    return raw && raw.trim().toUpperCase() === 'B' ? 'B' : 'A';
  }

  /* ---- Stage one: text -----------------------------------
     Runs the moment config lands, well before the 1.5s gate.
     Keeps the largest text block off the artificial delay.   */

  function renderText(cfg) {
    var variant = readVariant();

    document.documentElement.lang = cfg.locale;
    document.title = cfg.headline[variant] + ' — ' + cfg.brand;
    document.body.dataset.variant = variant;

    fill('.wordmark', cfg.brand);
    fill('.age-badge', cfg.compliance.ageLimit);
    fill('.eyebrow', cfg.eyebrow);
    fill('.headline', cfg.headline[variant]);
    fill('.subhead', cfg.subhead);
    fill('.prompt', cfg.prompt);

    fill('.rg-message', cfg.compliance.message);
    fill('.licence', cfg.compliance.licence);
    fill('.terms-toggle-label', cfg.compliance.termsLabel);

    var help = document.querySelector('.rg-link');
    if (help) {
      help.textContent = cfg.compliance.helpLabel;
      help.href = cfg.compliance.helpUrl;
    }

    var termsList = document.querySelector('.terms-body ul');
    if (termsList) {
      termsList.innerHTML = '';
      cfg.choices.forEach(function (choice) {
        var li = document.createElement('li');
        li.textContent = choice.title + ' — ' + choice.terms;
        termsList.appendChild(li);
      });
      var general = document.createElement('li');
      general.textContent = cfg.offer.wagering;
      termsList.appendChild(general);
    }
  }

  /* ---- Stage two: the interactive widget ------------------ */

  function renderChoices(cfg) {
    choiceList.innerHTML = '';

    cfg.choices.forEach(function (choice) {
      var li = document.createElement('li');

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice';
      button.setAttribute('aria-pressed', 'false');
      button.dataset.id = choice.id;

      var kicker = document.createElement('span');
      kicker.className = 'choice-kicker';
      kicker.textContent = choice.kicker;

      var title = document.createElement('span');
      title.className = 'choice-title';
      title.textContent = choice.title;

      var detail = document.createElement('span');
      detail.className = 'choice-detail';
      detail.textContent = choice.detail;

      button.append(kicker, title, detail);
      button.addEventListener('click', function () { choose(cfg, choice); });

      li.appendChild(button);
      choiceList.appendChild(li);
    });
  }

  /* One pick per visit, mirroring the single-entry rule these
     free-to-play mechanics use in production. */

  function choose(cfg, choice) {
    if (locked) return;
    locked = true;

    Array.prototype.forEach.call(
      choiceList.querySelectorAll('.choice'),
      function (button) {
        var picked = button.dataset.id === choice.id;
        button.setAttribute('aria-pressed', String(picked));
        button.disabled = true;
      }
    );

    /* Unpicked options stay on screen, dimmed rather than removed:
       the user can see nothing was randomised away from them. */
    choiceList.classList.add('is-resolved');

    fill('.result-title', choice.title);
    fill('.result-terms', choice.terms);

    var cta = document.querySelector('.cta');
    if (cta) {
      cta.textContent = cfg.cta;
      cta.href = cfg.ctaHref + '?offer=' + encodeURIComponent(choice.id);
    }

    result.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { result.classList.add('is-shown'); });
    });
  }

  function dismissLoader() {
    loader.classList.add('is-leaving');
    window.setTimeout(function () { loader.hidden = true; }, 280);
  }

  /* ---- Terms open in place -------------------------------- */

  var termsToggle = document.querySelector('.terms-toggle');
  if (termsToggle) {
    termsToggle.addEventListener('click', function () {
      var body = document.querySelector('.terms-body');
      var open = termsToggle.getAttribute('aria-expanded') === 'true';
      termsToggle.setAttribute('aria-expanded', String(!open));
      body.hidden = open;
    });
  }

  /* ---- Boot ----------------------------------------------
     The config fetch doubles as the simulated API call, so the
     spinner covers real async work rather than a bare timer.
     Text paints on arrival; the widget waits out the full
     1.5s even when the fetch returns sooner.                 */

  var config = fetch('config.json').then(function (response) {
    if (!response.ok) throw new Error('config ' + response.status);
    return response.json();
  });

  config
    .then(function (data) { renderText(data[vertical]); })
    .catch(function () {});

  Promise.all([config, delay(SPINNER_MS)])
    .then(function (settled) {
      renderChoices(settled[0][vertical]);
      dismissLoader();
    })
    .catch(function () {
      fill('.loader-label', 'Offers unavailable. Please refresh.');
      loader.querySelector('.spinner').remove();
    });
})();
