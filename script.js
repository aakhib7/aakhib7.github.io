(function () {
  var root = document.documentElement;

  // ---------- Menu ----------
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');

  function setMenu(open) {
    menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    if (open) {
      var first = menu.querySelector('a');
      if (first) first.focus();
    }
  }

  if (btn && menu) {
    btn.addEventListener('click', function () {
      setMenu(menu.hidden);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
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
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showState(i) {
    states.forEach(function (li, j) {
      li.classList.toggle('on', j === i);
      li.classList.toggle('done', j < i);
    });
  }

  if (states.length) {
    if (reduce) {
      showState(states.length - 1);
    } else {
      var i = 0;
      showState(0);
      var timer = setInterval(function () {
        i += 1;
        showState(i);
        if (i >= states.length - 1) clearInterval(timer);
      }, 650);
    }
  }

  // ---------- Bengaluru clock ----------
  var hh = document.querySelector('.clock .hh');
  var mm = document.querySelector('.clock .mm');

  function tick() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata'
      }).formatToParts(new Date());
      parts.forEach(function (p) {
        if (p.type === 'hour') hh.textContent = p.value;
        if (p.type === 'minute') mm.textContent = p.value;
      });
    } catch (e) {}
  }

  if (hh && mm) {
    tick();
    setInterval(tick, 15000);
  }

  // Hide the small name once past the hero; the corner wordmarks carry it
  function onScroll() {
    document.body.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.6);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var yy = document.getElementById('yy');
  if (yy) yy.textContent = String(new Date().getFullYear()).slice(-2);
})();
