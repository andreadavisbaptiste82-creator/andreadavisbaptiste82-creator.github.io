
  // ---- Spine nav: build dots for each reel (only runs on pages with reels) ----
  const reels = Array.from(document.querySelectorAll('.reel'));
  const spine = document.getElementById('spine');

  if (spine && reels.length) {
    reels.forEach((reel) => {
      const idx = reel.dataset.index;
      const btn = document.createElement('button');
      btn.setAttribute('aria-label', 'Jump to video ' + idx);
      btn.dataset.target = reel.id;
      const tip = document.createElement('span');
      tip.className = 'tip';
      tip.textContent = '0' + idx + ' — ' + (reel.querySelector('.reel-eyebrow b')?.textContent || '').trim();
      btn.appendChild(tip);
      btn.addEventListener('click', () => {
        document.getElementById(reel.id).scrollIntoView({behavior:'smooth', block:'center'});
      });
      spine.appendChild(btn);
    });

    const spineButtons = Array.from(spine.querySelectorAll('button'));

    // ---- Active spine dot tracking ----
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const i = reels.indexOf(entry.target);
        if(entry.isIntersecting && i > -1){
          spineButtons.forEach(b => b.classList.remove('active'));
          spineButtons[i].classList.add('active');
        }
      });
    }, { threshold: 0.5 });

    reels.forEach(r => activeObserver.observe(r));
  }

  // ---- Reveal on scroll (reels) ----
  if (reels.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.18 });

    reels.forEach(r => revealObserver.observe(r));
  }

  // ---- Architecture flow reveal ----
  const flowItems = document.querySelectorAll('.flow-stage, .flow-arrow');
  const flowObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        flowItems.forEach((el, i) => {
          setTimeout(() => el.classList.add('visible'), i * 90);
        });
        flowObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  const archSection = document.getElementById('archFlow');
  if(archSection) flowObserver.observe(archSection);

  // ---- Watch the Functional Prototype: scroll to and play the real video ----
  const watchPrototypeBtn = document.getElementById('watchPrototypeBtn');
  const responsibleAiVideo = document.getElementById('responsibleAiVideo');
  if(watchPrototypeBtn && responsibleAiVideo){
    watchPrototypeBtn.addEventListener('click', function(e){
      e.preventDefault();
      responsibleAiVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      responsibleAiVideo.play();
    });
  }

  // ---- Watch Grace in Action: scroll to and play her real video ----
  const watchGraceBtn = document.getElementById('watchGraceBtn');
  const graceVideo = document.getElementById('graceVideo');
  if(watchGraceBtn && graceVideo){
    watchGraceBtn.addEventListener('click', function(e){
      e.preventDefault();
      graceVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      graceVideo.play();
    });
  }

  // ---- Accessible mobile navigation menu ----
  (function(){
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('toplinks');
    if(!navToggle || !navMenu) return;

    function closeMenu(){
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    }
    function openMenu(){
      navMenu.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close menu');
    }

    navToggle.addEventListener('click', function(){
      const isOpen = navMenu.classList.contains('is-open');
      if(isOpen){ closeMenu(); } else { openMenu(); }
    });

    navMenu.addEventListener('click', function(e){
      if(e.target.closest('a')){ closeMenu(); }
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && navMenu.classList.contains('is-open')){
        closeMenu();
        navToggle.focus();
      }
    });

    document.addEventListener('click', function(e){
      if(!navMenu.contains(e.target) && !navToggle.contains(e.target)){
        closeMenu();
      }
    });

    window.addEventListener('resize', function(){
      if(window.innerWidth > 860){ closeMenu(); }
    });
  })();

  // ---- LIGHTWEIGHT EVENT TRACKING ----------------------------------------
  // Sends data-track events through gtag() when (and only when) gtag has been
  // configured on this page (see the ANALYTICS comment in <head>). If no
  // analytics tool is installed, every function below simply no-ops — this
  // script never throws and never blocks the page.
  (function(){
    function sendTrackEvent(label, params){
      if (typeof window.gtag !== 'function') return; // fail safely: analytics not configured
      try {
        window.gtag('event', label, params || {});
      } catch (err) {
        // fail safely: never let tracking break the page
      }
    }

    // Clicks on links/buttons carrying a data-track label
    // (résumé, strategy-asset view/download, email, LinkedIn, etc.)
    document.addEventListener('click', function(e){
      const el = e.target.closest('a[data-track], button[data-track]');
      if(!el) return;
      sendTrackEvent(el.getAttribute('data-track'), {
        event_category: 'engagement',
        event_label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 120),
        link_url: el.getAttribute('href') || ''
      });
    });

    // Video plays (all reel videos, the Grace demo, and the responsible-AI prototype)
    document.querySelectorAll('video[data-track="video-play"]').forEach(function(video){
      video.addEventListener('play', function(){
        const label =
          video.closest('.reel')?.querySelector('.reel-title')?.textContent ||
          video.getAttribute('aria-label') ||
          video.id ||
          'video';
        sendTrackEvent('video-play', {
          event_category: 'engagement',
          event_label: label.trim().slice(0, 120)
        });
      });
    });

    // Expandable sections (Project Case Study, View Supporting Perspectives, etc.)
    document.querySelectorAll('details[data-track]').forEach(function(det){
      det.addEventListener('toggle', function(){
        if(!det.open) return; // only track the expand, not the collapse
        sendTrackEvent(det.getAttribute('data-track'), {
          event_category: 'engagement',
          event_label: (det.querySelector('summary')?.textContent || '').trim().slice(0, 120)
        });
      });
    });
  })();

  // ---- Active nav state ----------------------------------------------------
  // Each <body> carries data-page="home|corporate|k12|research|about|contact"
  // and each top-nav link carries a matching data-page attribute. This avoids
  // parsing location.pathname, which is fragile across GitHub Pages URL forms.
  (function(){
    const current = document.body.getAttribute('data-page');
    if (!current) return;
    document.querySelectorAll('.toplinks a[data-page]').forEach(function(link){
      if (link.getAttribute('data-page') === current) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  })();

  // ---- Contact form: progressive enhancement (safe no-op until a real
  // Formspree ID is configured; native form POST still works either way) ----
  (function(){
    const form = document.getElementById('contactForm');
    if (!form) return;
    const successEl = document.getElementById('formSuccess');
    const errorEl = document.getElementById('formError');

    form.addEventListener('submit', function(e){
      const action = form.getAttribute('action') || '';
      if (action.includes('REPLACE_FORM_ID')) {
        // Formspree not configured yet — let the page-level notice handle it,
        // but don't let the browser attempt a doomed network request.
        e.preventDefault();
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = 'This form is not yet connected. Please use the email link below, or check back soon.';
          errorEl.setAttribute('tabindex', '-1');
          errorEl.focus();
        }
        return;
      }
      e.preventDefault();
      fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function(response){
        if (response.ok) {
          if (successEl) { successEl.hidden = false; successEl.setAttribute('tabindex','-1'); successEl.focus(); }
          if (errorEl) errorEl.hidden = true;
          form.reset();
        } else {
          if (errorEl) { errorEl.hidden = false; errorEl.textContent = 'Something went wrong. Please try again or use the email link below.'; errorEl.setAttribute('tabindex','-1'); errorEl.focus(); }
        }
      }).catch(function(){
        if (errorEl) { errorEl.hidden = false; errorEl.textContent = 'Something went wrong. Please try again or use the email link below.'; errorEl.setAttribute('tabindex','-1'); errorEl.focus(); }
      });
    });
  })();
