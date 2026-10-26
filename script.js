(function () {
  var root = document.documentElement;
  var MOTION = root.classList.contains('motion');
  var settled = !!navigator.webdriver; // link previews / screenshot tools get the finished page

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
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

  // measure once (and on resize), not on every scroll event
  var tops = [];
  var maxScroll = 1;
  function measure() {
    tops = sections.map(function (pair) {
      return pair[1].getBoundingClientRect().top + window.scrollY;
    });
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  var current = null;
  var queued = false;
  function onScroll() {
    queued = false;
    var sy = window.scrollY;
    nav.classList.toggle('scrolled', sy > 8);
    nav.style.setProperty('--progress', (sy / maxScroll).toFixed(4));
    var next = null;
    tops.forEach(function (top, k) {
      if (top <= sy + 120) next = sections[k][0];
    });
    if (next !== current) {
      if (current) current.classList.remove('active');
      if (next) next.classList.add('active');
      current = next;
    }
  }
  function queueScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(onScroll);
  }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', function () {
    measure();
    queueScroll();
  });
  window.addEventListener('load', function () {
    measure();
    queueScroll();
  });
  measure();
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

  // ---------- Headline: split into words that rise in one by one ----------
  var h1 = document.querySelector('.hero h1');
  if (h1) {
    var n = 0;
    each(Array.prototype.slice.call(h1.childNodes), function (node) {
      if (node.nodeType === 1) {
        node.classList.add('w');
        node.style.setProperty('--i', n++);
        return;
      }
      if (node.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          var w = document.createElement('span');
          w.className = 'w';
          w.textContent = part;
          w.style.setProperty('--i', n++);
          frag.appendChild(w);
        }
      });
      h1.replaceChild(frag, node);
    });
  }

  // stagger siblings inside the same grid
  each(document.querySelectorAll('.metrics-grid, .roles-grid, .timeline, .skills'), function (g) {
    each(g.querySelectorAll('.reveal'), function (el, k) {
      el.style.setProperty('--d', k * 70 + 'ms');
    });
  });

  var reveals = document.querySelectorAll('.reveal');
  function show(el) {
    el.classList.add('in');
    each(el.querySelectorAll('.num'), countUp);
    // drop the staggered reveal transition so hover lifts respond immediately
    setTimeout(function () {
      el.classList.add('done');
    }, 1000 + (parseInt(el.style.getPropertyValue('--d'), 10) || 0));
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

  // ---------- Pause the drifting glows while they're off screen ----------
  var glowIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('offscreen', !entry.isIntersecting);
    });
  });
  each(document.querySelectorAll('.hero, .contact-card'), function (el) {
    glowIo.observe(el);
  });

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- Cursor spotlight on cards (mouse only) ----------
  if (finePointer) {
    each(document.querySelectorAll('.card, .metric, .timeline details, .skill-group, .project'), function (el) {
      el.classList.add('spot');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', e.clientX - r.left + 'px');
        el.style.setProperty('--my', e.clientY - r.top + 'px');
      });
    });
  }

  // ---------- Subtle tilt on the hero portrait (mouse only) ----------
  var visual = document.querySelector('.hero-visual');
  if (visual && finePointer) {
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
