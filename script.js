(function () {
  var root = document.documentElement;
  var MOTION = root.classList.contains('motion');

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  // ---------- Menu ----------
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  var closeTimer;

  function setMenu(open) {
    clearTimeout(closeTimer);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      // next frame so the wipe and link stagger transition from closed
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          menu.classList.add('open');
        });
      });
      var first = menu.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    } else {
      menu.classList.remove('open');
      closeTimer = setTimeout(function () {
        menu.hidden = true;
      }, MOTION ? 550 : 0);
    }
  }

  if (btn && menu) {
    each(menu.querySelectorAll('.menu-links a'), function (a, i) {
      a.style.setProperty('--i', i);
    });
    btn.addEventListener('click', function () {
      setMenu(btn.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        btn.focus();
      }
    });
  }

  // ---------- Theme ----------
  var themeBtn = document.querySelector('.theme-btn');

  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function labelTheme() {
    if (themeBtn) themeBtn.textContent = currentTheme() === 'dark' ? 'Switch to light' : 'Switch to dark';
  }

  if (themeBtn) {
    labelTheme();
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
      labelTheme();
    });
  }

  // ---------- Payment status: created -> settled, once ----------
  var states = document.querySelectorAll('.states li');

  function showState(i) {
    each(states, function (li, j) {
      li.classList.toggle('on', j === i);
      li.classList.toggle('done', j < i);
    });
  }

  if (states.length) {
    if (!MOTION) {
      showState(states.length - 1);
    } else {
      var si = 0;
      showState(0);
      setTimeout(function () {
        var timer = setInterval(function () {
          si += 1;
          showState(si);
          if (si >= states.length - 1) clearInterval(timer);
        }, 650);
      }, 700);
    }
  }

  // ---------- Bengaluru clock ----------
  var hh = document.querySelector('.clock .hh');
  var mm = document.querySelector('.clock .mm');

  function setDigits(el, value) {
    if (el.textContent === value) return;
    var first = el.textContent === '--';
    el.textContent = value;
    if (MOTION && !first) {
      el.classList.remove('roll');
      void el.offsetWidth;
      el.classList.add('roll');
    }
  }

  function tick() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata'
      }).formatToParts(new Date());
      parts.forEach(function (p) {
        if (p.type === 'hour') setDigits(hh, p.value);
        if (p.type === 'minute') setDigits(mm, p.value);
      });
    } catch (e) {}
  }

  if (hh && mm) {
    tick();
    setInterval(tick, 5000);
  }

  // ---------- Hide the small name once past the hero ----------
  function onScrollName() {
    document.body.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.6);
  }
  window.addEventListener('scroll', onScrollName, { passive: true });
  onScrollName();

  var yy = document.getElementById('yy');
  if (yy) yy.textContent = String(new Date().getFullYear()).slice(-2);

  if (!MOTION) return;

  // =====================================================================
  // Motion
  // =====================================================================

  // Stagger indexes
  function indexChildren(selector, childSelector) {
    each(document.querySelectorAll(selector), function (parent) {
      each(parent.querySelectorAll(childSelector), function (el, i) {
        el.style.setProperty('--i', i);
      });
    });
  }

  indexChildren('.stagger', '.ln');
  indexChildren('.rows', ':scope > li, :scope > div');
  indexChildren('.figures', ':scope > div');
  indexChildren('.pillars', ':scope > div');
  indexChildren('.steps', ':scope > li');

  // Report: wrap each printed line so it can appear in turn
  var code = document.querySelector('.report code');
  if (code) {
    var lines = code.innerHTML.split('\n');
    code.innerHTML = lines
      .map(function (line, i) {
        var cls = 'rl' + (line.indexOf('decision') !== -1 ? ' rl-decision' : '');
        var body = line.length ? line : ' ';
        if (i === lines.length - 1) body += '<span class="caret" aria-hidden="true"></span>';
        return '<span class="' + cls + '" style="--i:' + i + '">' + body + '</span>';
      })
      .join('');
  }

  // Footer wordmark: one span per letter
  var mark = document.querySelector('.wordmark');
  if (mark) {
    var text = mark.textContent;
    mark.textContent = '';
    for (var c = 0; c < text.length; c++) {
      var span = document.createElement('span');
      span.className = 'ch';
      span.style.setProperty('--i', c);
      span.textContent = text[c] === ' ' ? ' ' : text[c];
      mark.appendChild(span);
    }
  }

  // Count the figures towards their final values
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    var from = el.hasAttribute('data-from') ? parseFloat(el.getAttribute('data-from')) : 0;
    var dur = 1400;
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = String(from);
    requestAnimationFrame(frame);
  }

  // Reveal on scroll
  var targets = document.querySelectorAll(
    '.stagger:not(.hero-title), .split-head, .rows, .figures, .pillars, .report, .wordmark'
  );

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('in');
        if (el.classList.contains('figures')) each(el.querySelectorAll('.num'), countUp);
        io.unobserve(el);
      });
    },
    { threshold: 0, rootMargin: '0px 0px -12% 0px' }
  );

  each(targets, function (el) {
    io.observe(el);
  });

  function revealAll() {
    each(targets, function (el) {
      el.classList.add('in');
    });
  }
  window.addEventListener('beforeprint', revealAll);
  // Automated renderers (link previews, screenshot tools) never scroll,
  // so show them the finished page instead of hidden sections.
  if (navigator.webdriver) revealAll();

  // Marquee: drifts on its own, speeds up and follows the direction you scroll
  var marquee = document.querySelector('.marquee');
  var tracks = marquee ? marquee.querySelectorAll('.marquee-track') : [];
  if (tracks.length) {
    var x = 0;
    var dir = -1;
    var boost = 0;
    var lastY = window.scrollY;
    var lastT = performance.now();
    var width = tracks[0].offsetWidth;
    var hovering = false;

    window.addEventListener('resize', function () {
      width = tracks[0].offsetWidth;
    });
    marquee.addEventListener('mouseenter', function () {
      hovering = true;
    });
    marquee.addEventListener('mouseleave', function () {
      hovering = false;
    });

    window.addEventListener(
      'scroll',
      function () {
        var y = window.scrollY;
        var delta = y - lastY;
        lastY = y;
        if (delta !== 0) dir = delta > 0 ? -1 : 1;
        boost = Math.min(18, boost + Math.abs(delta) * 0.06);
      },
      { passive: true }
    );

    (function loop(t) {
      var dt = Math.min(64, t - lastT);
      lastT = t;
      var base = width / 48000; // px per ms: one full track in 48s
      var speed = hovering ? 0 : base * (1 + boost) * dt;
      boost *= 0.92;
      x += dir * speed;
      if (x <= -width) x += width;
      if (x > 0) x -= width;
      var tf = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      tracks[0].style.transform = tf;
      tracks[1].style.transform = tf;
      requestAnimationFrame(loop);
    })(lastT);
  }

  // ---------------------------------------------------------------
  // Scroll-driven motion: everything here is a pure function of scroll
  // position, so it plays forward going down and reverses going up.
  // ---------------------------------------------------------------
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var settled = !!navigator.webdriver; // automated renderers get the final layout

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  function smooth(t) {
    return t * t * (3 - 2 * t);
  }
  // 0 when the element's top is at the bottom of the screen,
  // 1 once its top reaches `endAt` of the viewport height
  function enter(rect, endAt) {
    return smooth(clamp01((vh - rect.top) / (vh * (1 - endAt))));
  }

  var heroLines = document.querySelectorAll('.hero-title .ln');
  var heroTitle = document.querySelector('.hero-title');
  var staggers = document.querySelectorAll('.stagger:not(.hero-title)');
  var heads = document.querySelectorAll('.split-head');
  var steps = document.querySelector('.steps');
  var stepItems = steps ? steps.querySelectorAll(':scope > li') : [];
  var corners = document.querySelectorAll('.corner');
  var foot = document.querySelector('.wordmark');

  function update() {
    var drift = vw < 700 ? 0.22 * vw : 0.12 * vw;

    // Hero: lines part in alternating directions as you scroll away
    var out = settled ? 0 : clamp01(window.scrollY / (vh * 0.9));
    each(heroLines, function (ln, i) {
      var d = (i % 2 ? -1 : 1) * out * drift * (0.6 + i * 0.18);
      ln.style.translate = d.toFixed(1) + 'px 0';
    });
    if (heroTitle) heroTitle.style.opacity = String(1 - out * 0.65);

    // Section headlines: lines converge onto the grid as they come up
    each(staggers, function (h) {
      var r = h.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) return;
      var e = settled ? 1 : enter(r, 0.45);
      each(h.querySelectorAll('.ln'), function (ln, i) {
        var d = (i % 2 ? -1 : 1) * (1 - e) * drift;
        ln.style.translate = d.toFixed(1) + 'px 0';
      });
    });

    // Two-part titles ("Work" / "20–26") start together and part to the edges
    each(heads, function (h) {
      var r = h.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) return;
      var e = settled ? 1 : enter(r, 0.5);
      var parts = h.querySelectorAll('.display');
      var gap = h.clientWidth;
      if (parts.length === 2) {
        var close = (1 - e) * Math.max(0, gap - parts[0].offsetWidth - parts[1].offsetWidth - 40) * 0.5;
        parts[0].style.translate = close.toFixed(1) + 'px 0';
        parts[1].style.translate = (-close).toFixed(1) + 'px 0';
      } else if (parts.length === 1) {
        parts[0].style.translate = ((1 - e) * drift * 0.5).toFixed(1) + 'px 0';
      }
    });

    // Process: the rules draw and steps light up in order as you scroll past
    if (steps) {
      var sr = steps.getBoundingClientRect();
      var p = settled ? 1 : clamp01((vh * 0.88 - sr.top) / (vh * 0.55));
      var n = stepItems.length;
      each(stepItems, function (li, i) {
        var s = clamp01(p * n - i);
        li.style.setProperty('--s', s.toFixed(3));
        li.classList.toggle('lit', s >= 1);
      });
    }

    // Corner wordmarks drift apart over the length of the page
    var max = document.documentElement.scrollHeight - vh;
    var page = max > 0 ? window.scrollY / max : 0;
    if (corners.length === 2) {
      corners[0].style.translate = (-page * 0.04 * vw).toFixed(1) + 'px 0';
      corners[1].style.translate = (page * 0.04 * vw).toFixed(1) + 'px 0';
    }

    // Footer wordmark tightens as the page ends
    if (foot) {
      var fr = foot.getBoundingClientRect();
      var fe = settled ? 1 : enter(fr, 0.3);
      foot.style.letterSpacing = (-0.065 + (1 - fe) * 0.05).toFixed(4) + 'em';
    }
  }

  var queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      update();
    });
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', function () {
    vw = window.innerWidth;
    vh = window.innerHeight;
    queue();
  });
  window.addEventListener('beforeprint', function () {
    settled = true;
    update();
  });
  update();

  // Magnetic buttons (mouse and trackpad only)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    each(document.querySelectorAll('.circle, .pill, .menu-btn'), function (el) {
      el.classList.add('magnet');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + mx * 0.28 + 'px,' + my * 0.38 + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
      });
    });
  }
})();
