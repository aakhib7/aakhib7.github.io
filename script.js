(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // Theme toggle: follows the system setting until the visitor picks one
  var toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      if (!current) {
        current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
    });
  }

  // Reveal sections as they scroll into view
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (item) {
      observer.observe(item);
    });
  } else {
    items.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

  // Never leave content hidden: reveal everything shortly after load and before
  // printing, so screenshots, link previews and recruiter tools see the full page.
  function revealAll() {
    items.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }
  window.addEventListener('load', function () {
    setTimeout(revealAll, 1200);
  });
  window.addEventListener('beforeprint', revealAll);

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
