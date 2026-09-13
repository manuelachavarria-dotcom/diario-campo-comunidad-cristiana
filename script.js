/* ============================================================
   Diario de Campo — navegación e interactividad
   ============================================================ */
(function () {
  'use strict';

  var deck = document.getElementById('deck');
  var slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));
  var total = slides.length;
  var current = 0;
  var countUpDone = {};

  var progressFill = document.getElementById('progressFill');
  var slideNow = document.getElementById('slideNow');
  var slideTotal = document.getElementById('slideTotal');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var dotNav = document.getElementById('dotNav');
  var menuToggle = document.getElementById('menuToggle');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuClose = document.getElementById('menuClose');
  var menuList = document.getElementById('menuList');
  var tourBtn = document.getElementById('tourBtn');
  var notesToggle = document.getElementById('notesToggle');
  var notesPanel = document.getElementById('notesPanel');
  var notesText = document.getElementById('notesText');

  slideTotal.textContent = pad(total);

  // Build dot navigation
  slides.forEach(function (slide, i) {
    var dot = document.createElement('button');
    dot.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1) + ': ' + (slide.dataset.title || ''));
    dot.addEventListener('click', function () { goTo(i); });
    dotNav.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(dotNav.children);

  // Build section menu
  slides.forEach(function (slide, i) {
    var li = document.createElement('li');
    li.innerHTML = '<span class="m-num">' + pad(i + 1) + '</span><span class="m-title">' + (slide.dataset.title || '') + '</span>';
    li.addEventListener('click', function () { goTo(i); closeMenu(); });
    menuList.appendChild(li);
  });
  var menuItems = Array.prototype.slice.call(menuList.children);

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function render() {
    slides.forEach(function (slide, i) {
      slide.classList.remove('is-active', 'is-prev');
      if (i === current) slide.classList.add('is-active');
      else if (i < current) slide.classList.add('is-prev');
    });
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === current); });
    menuItems.forEach(function (m, i) { m.classList.toggle('is-active', i === current); });
    slideNow.textContent = pad(current + 1);
    progressFill.style.width = ((current + 1) / total * 100) + '%';
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    if (tourBtn) tourBtn.disabled = current === 1;

    var notesEl = slides[current].querySelector('.speaker-notes');
    notesText.textContent = notesEl ? notesEl.textContent.trim() : '';

    runSlideEffects(current);
    var focusTarget = slides[current].querySelector('h1, h2');
    if (focusTarget) { /* no forced focus to avoid scroll jumps */ }
  }

  function goTo(index) {
    if (index < 0 || index > total - 1 || index === current) return;
    current = index;
    render();
  }
  function next() { goTo(Math.min(current + 1, total - 1)); }
  function prev() { goTo(Math.max(current - 1, 0)); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Keyboard navigation
  window.addEventListener('keydown', function (e) {
    if (menuOverlay.classList.contains('is-open')) {
      if (e.key === 'Escape') closeMenu();
      return;
    }
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        e.preventDefault(); next(); break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault(); prev(); break;
      case 'Home':
        e.preventDefault(); goTo(0); break;
      case 'End':
        e.preventDefault(); goTo(total - 1); break;
      case 'm':
      case 'M':
        toggleMenu(); break;
      case 'n':
      case 'N':
        toggleNotes(); break;
      case 'Escape':
        if (notesPanel.classList.contains('is-open')) toggleNotes();
        break;
    }
  });

  // Touch / swipe navigation
  var touchStartX = null, touchStartY = null;
  deck.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
    touchStartX = null; touchStartY = null;
  }, { passive: true });

  // Menu overlay
  function openMenu() {
    menuOverlay.classList.add('is-open');
    menuOverlay.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    menuOverlay.classList.remove('is-open');
    menuOverlay.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    if (menuOverlay.classList.contains('is-open')) closeMenu(); else openMenu();
  }
  menuToggle.addEventListener('click', toggleMenu);
  menuClose.addEventListener('click', closeMenu);
  menuOverlay.addEventListener('click', function (e) {
    if (e.target === menuOverlay) closeMenu();
  });

  // Speaker notes panel
  function toggleNotes() {
    var isOpen = notesPanel.classList.toggle('is-open');
    notesPanel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    notesToggle.setAttribute('aria-pressed', isOpen ? 'true' : 'false');
  }
  notesToggle.addEventListener('click', toggleNotes);

  // Animated count-up numbers, triggered once per slide on activation
  function runSlideEffects(index) {
    if (countUpDone[index]) return;
    countUpDone[index] = true;
    var slide = slides[index];
    var counters = slide.querySelectorAll('.stat-number[data-count]');
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var duration = 1100;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
    });
  }

  // Generic "jump to slide" triggers: map pins, agenda items, compare bars, cover CTA...
  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function () {
      var target = parseInt(el.getAttribute('data-goto'), 10);
      if (!isNaN(target)) goTo(target);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var target = parseInt(el.getAttribute('data-goto'), 10);
        if (!isNaN(target)) goTo(target);
      }
    });
  });

  // Network diagram: satellite nodes reveal a short caption on the "lo que no se ve" slide
  var netNotes = {
    jac: 'Junta de Acción Comunal: se articula con las iglesias en actividades y en las novenas de fin de año.',
    alcaldia: 'Alcaldía de Itagüí: su enlace de comunidades cristianas facilitó el acceso ordenado a las tres sedes.',
    pavida: 'Fundación PAVIDA: trabaja el núcleo familiar en El Porvenir y se articula con la sede Simón Bolívar.',
    familias: 'Las familias son destinatarias transversales de programas en las tres sedes visitadas.',
    ninez: 'Niños y niñas ocupan un lugar protagónico en los tres sitios: comedores, escuelas y proyectos propios.',
    lideres: 'Pastores y líderes orientan, acompañan y promueven la participación de manera cercana y sostenida.'
  };
  var netCaptionText = document.getElementById('netCaptionText');
  var netCaptionLabel = netCaptionText ? netCaptionText.previousElementSibling : null;
  document.querySelectorAll('.net-satellite').forEach(function (node) {
    node.addEventListener('click', function () {
      var key = node.getAttribute('data-note');
      document.querySelectorAll('.net-satellite').forEach(function (n) { n.classList.remove('is-selected'); });
      node.classList.add('is-selected');
      if (netCaptionText && netNotes[key]) {
        netCaptionText.textContent = netNotes[key];
        if (netCaptionLabel) { var lbl = node.querySelector('text'); netCaptionLabel.textContent = lbl ? lbl.textContent : node.textContent; }
      }
    });
  });

  // Concept chips: reveal a short field-note per concept
  var chipCaptionText = document.getElementById('chipCaptionText');
  var chipCaptionLabel = chipCaptionText ? chipCaptionText.previousElementSibling : null;
  document.querySelectorAll('.chip[data-note]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-selected'); });
      chip.classList.add('is-selected');
      if (chipCaptionText) {
        chipCaptionText.textContent = chip.getAttribute('data-note');
        if (chipCaptionLabel) chipCaptionLabel.textContent = chip.textContent;
      }
    });
  });

  render();
})();
