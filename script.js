(function () {
  var root = document.documentElement;
  var MOTION = root.classList.contains('motion');
  var settled = !!navigator.webdriver; // link previews / screenshot tools get the finished page

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  // ---------- Theme ----------
  var themeBtn = document.querySelector('.theme-toggle');
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
    });
  }

  // ---------- Mobile menu ----------
  var menuBtn = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      setMenu(menu.hidden);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  // ---------- Nav: border on scroll, active section ----------
  var nav = document.getElementById('nav');
  var links = document.querySelectorAll('.nav-links a');
  var sections = [];
  each(links, function (a) {
    var s = document.querySelector(a.getAttribute('href'));
    if (s) sections.push([a, s]);
  });

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 8);
    var y = window.scrollY + 120;
    var current = null;
    sections.forEach(function (pair) {
      if (pair[1].offsetTop <= y) current = pair[0];
    });
    each(links, function (a) {
      a.classList.toggle('active', a === current);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Go-live card: steps tick through, then the badge goes live ----------
  var steps = document.querySelectorAll('.golive-steps li');
  var badge = document.querySelector('.golive .badge');
  function goLive() {
    if (badge) {
      badge.setAttribute('data-state', 'live');
      badge.textContent = 'Live';
    }
  }
  if (!MOTION || settled) {
    each(steps, function (li) {
      li.classList.add('done');
    });
    goLive();
  } else {
    var i = 0;
    setTimeout(function next() {
      if (i < steps.length) {
        steps[i].classList.add('done');
        i += 1;
        setTimeout(next, 520);
      } else {
        goLive();
      }
    }, 1100);
  }

  if (!MOTION) return;

  // ---------- Reveal + count-ups ----------
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    var from = el.hasAttribute('data-from') ? parseFloat(el.getAttribute('data-from')) : 0;
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / 1400);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(from + (to - from) * e));
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = String(from);
    requestAnimationFrame(frame);
  }

  // stagger siblings inside the same grid
  each(document.querySelectorAll('.metrics-grid, .roles-grid, .expertise-grid, .timeline, .process, .skills'), function (g) {
    each(g.querySelectorAll('.reveal'), function (el, k) {
      el.style.setProperty('--d', k * 70 + 'ms');
    });
  });

  var reveals = document.querySelectorAll('.reveal');
  function show(el) {
    el.classList.add('in');
    each(el.querySelectorAll('.num'), countUp);
  }

  if (settled) {
    each(reveals, function (el) {
      el.classList.add('in');
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            show(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    );
    each(reveals, function (el) {
      io.observe(el);
    });
  }

  window.addEventListener('beforeprint', function () {
    each(reveals, function (el) {
      el.classList.add('in');
    });
  });

  // ---------- Process line fills with scroll ----------
  var process = document.querySelector('.process');
  function fill() {
    if (!process) return;
    if (settled) {
      process.style.setProperty('--fill', 1);
      return;
    }
    var r = process.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh * 0.85 - r.top) / (r.height + vh * 0.25);
    process.style.setProperty('--fill', Math.max(0, Math.min(1, p)).toFixed(3));
  }
  var queued = false;
  window.addEventListener(
    'scroll',
    function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        fill();
      });
    },
    { passive: true }
  );
  fill();

  // ---------- Subtle tilt on the hero portrait (mouse only) ----------
  var visual = document.querySelector('.hero-visual');
  if (visual && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var portrait = visual.querySelector('.portrait img');
    visual.addEventListener('pointermove', function (e) {
      var r = visual.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      portrait.style.transform = 'perspective(900px) rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' + (-y * 5).toFixed(2) + 'deg)';
    });
    visual.addEventListener('pointerleave', function () {
      portrait.style.transform = '';
    });
    portrait.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.7, 0.1, 1)';
  }
})();
