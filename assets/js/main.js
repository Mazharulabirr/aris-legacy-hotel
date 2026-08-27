/* ARIS LEGACY HOTEL — interactions */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky nav ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var solid = null, queued = false;
    var setSolid = function () {
      queued = false;
      var want = window.scrollY > 40;
      if (want !== solid) { solid = want; nav.classList.toggle('solid', want); }
    };
    setSolid();
    window.addEventListener('scroll', function () {
      if (!queued) { queued = true; requestAnimationFrame(setSolid); }
    }, { passive: true });
  }

  /* ---------- Mobile drawer ---------- */
  var burger = document.querySelector('.burger');
  var drawer = document.querySelector('.drawer');
  if (burger && drawer) {
    var links = drawer.querySelectorAll('a');
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      links.forEach(function (a, i) {
        a.style.transitionDelay = open ? (0.06 + i * 0.055) + 's' : '0s';
      });
    });
    links.forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) burger.click();
    });
  }

  /* ---------- Rest ambient motion that has scrolled out of view ---------- */
  var ambient = document.querySelectorAll('.hero-media img, .scroll-cue, .marq-track');
  if (ambient.length && !reduce && 'IntersectionObserver' in window) {
    var aio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle('anim-rest', !en.isIntersecting);
      });
    }, { rootMargin: '140px' });
    ambient.forEach(function (el) { aio.observe(el); });
  }

  /* ---------- Scroll reveal ---------- */
  var rvs = document.querySelectorAll('.rv');
  if (rvs.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      rvs.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -9% 0px', threshold: 0.06 });
      rvs.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Animated counters ---------- */
  var nums = document.querySelectorAll('[data-count]');
  if (nums.length) {
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var pre = el.getAttribute('data-pre') || '';
      var suf = el.getAttribute('data-suf') || '';
      if (reduce) { el.textContent = pre + target.toFixed(dec) + suf; return; }
      var dur = 1500, t0 = null;
      var step = function (ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + (target * e).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) {
      nums.forEach(run);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      nums.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- Tabs (floor plans) ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = group.querySelectorAll('.tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', String(on));
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
      });
    });
  });

  /* ---------- Design-series showcase ---------- */
  document.querySelectorAll('[data-showcase]').forEach(function (sc) {
    var slides = Array.prototype.slice.call(sc.querySelectorAll('.sc-slide'));
    var thumbs = Array.prototype.slice.call(sc.querySelectorAll('.sc-thumb'));
    var strip  = sc.querySelector('.sc-thumbs');
    var cur    = sc.querySelector('.sc-cur');
    var stage  = sc.querySelector('.sc-stage');
    if (slides.length < 2) return;
    var i = 0;

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      thumbs.forEach(function (t, k) {
        t.classList.toggle('on', k === i);
        t.setAttribute('aria-current', k === i ? 'true' : 'false');
      });
      if (cur) cur.textContent = pad(i + 1);
      var t = thumbs[i];
      if (t && strip) {
        strip.scrollTo({
          left: t.offsetLeft - strip.clientWidth / 2 + t.clientWidth / 2,
          behavior: reduce ? 'auto' : 'smooth'
        });
      }
    }

    var prev = sc.querySelector('.sc-prev');
    var next = sc.querySelector('.sc-next');
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    if (next) next.addEventListener('click', function () { go(i + 1); });
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); }); });

    /* arrow keys once focus is anywhere inside this showcase.
       Stand down while the lightbox has the screen — it owns the arrows then. */
    sc.addEventListener('keydown', function (e) {
      if (document.querySelector('.lightbox.open')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
    });

    /* swipe */
    if (stage) {
      var x0 = null;
      stage.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 42) go(dx < 0 ? i + 1 : i - 1);
        x0 = null;
      }, { passive: true });
    }

    go(0);
  });

  /* ---------- Lightbox ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-lb]'));
  if (items.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML =
      '<button class="lb-close" aria-label="Close viewer">&#10005;</button>' +
      '<button class="lb-nav lb-prev" aria-label="Previous image">&#8592;</button>' +
      '<button class="lb-nav lb-next" aria-label="Next image">&#8594;</button>' +
      '<div><img alt=""><div class="lb-cap"></div></div>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lb-cap');
    var idx = 0;

    var show = function (i) {
      idx = (i + items.length) % items.length;
      var src = items[idx].getAttribute('data-lb');
      var inner = items[idx].querySelector('img');
      lbImg.src = src || (inner ? inner.src : '');
      lbImg.alt = inner ? inner.alt : '';
      lbCap.textContent = items[idx].getAttribute('data-cap') || (inner ? inner.alt : '');
    };
    var open = function (i) {
      show(i);
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    var close = function () {
      lb.classList.remove('open');
      document.body.style.overflow = '';
    };

    items.forEach(function (el, i) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('click', function () { open(i); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- Countdown to grand opening ---------- */
  var cd = document.querySelector('[data-countdown]');
  if (cd) {
    var target = new Date(cd.getAttribute('data-countdown')).getTime();
    var slots = cd.querySelectorAll('b');
    var tick = function () {
      var d = target - Date.now();
      if (d < 0) d = 0;
      var day = Math.floor(d / 864e5);
      var hr = Math.floor(d / 36e5) % 24;
      var mn = Math.floor(d / 6e4) % 60;
      var sc = Math.floor(d / 1e3) % 60;
      var v = [day, hr, mn, sc];
      slots.forEach(function (s, i) {
        s.textContent = i === 0 ? String(v[i]) : String(v[i]).padStart(2, '0');
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Enquiry forms (front-end only) ---------- */
  document.querySelectorAll('form[data-enquiry]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('[name="name"]') || {}).value || 'there';
      var ok = form.querySelector('.form-ok');
      if (!ok) {
        ok = document.createElement('p');
        ok.className = 'form-ok';
        form.appendChild(ok);
      }
      ok.textContent = 'Thank you, ' + name.split(' ')[0] +
        '. Your enquiry has been recorded. A member of the Aris Legacy development office will respond within two business days.';
      form.querySelectorAll('input,textarea,select').forEach(function (f) { f.value = ''; });
      ok.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  });

  /* ---------- Cookie notice ---------- */
  var notice = document.getElementById('cookie-notice');
  var KEY = 'aris-consent';

  var readConsent = function () {
    var m = document.cookie.match(/(?:^|;\s*)aris-consent=([^;]*)/);
    if (m) return decodeURIComponent(m[1]);
    /* file:// and private modes drop cookies; fall back so the card does not
       reappear on every page of the same visit */
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  };

  var writeConsent = function (v) {
    try {
      document.cookie = KEY + '=' + encodeURIComponent(v) + ';path=/;max-age=' +
        (60 * 60 * 24 * 182) + ';samesite=lax' +
        (location.protocol === 'https:' ? ';secure' : '');
    } catch (e) {}
    try { window.localStorage.setItem(KEY, v); } catch (e) {}
  };

  /* Anything added later — analytics, embeds, pixels — asks this first. */
  window.arisConsent = {
    get: readConsent,
    analytics: function () { return readConsent() === 'all'; }
  };

  if (notice) {
    var showNotice = function () {
      notice.hidden = false;
      document.body.classList.add('consent-open');
      requestAnimationFrame(function () { notice.classList.add('in'); });
    };
    var settle = function (value) {
      writeConsent(value);
      notice.classList.remove('in');
      document.body.classList.remove('consent-open');
      window.setTimeout(function () { notice.hidden = true; }, reduce ? 0 : 520);
      document.dispatchEvent(new CustomEvent('aris:consent', { detail: value }));
    };

    notice.querySelectorAll('[data-consent]').forEach(function (b) {
      b.addEventListener('click', function () { settle(b.getAttribute('data-consent')); });
    });
    if (!readConsent()) showNotice();

    document.querySelectorAll('[data-cookie-reopen]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        showNotice();
        var first = notice.querySelector('[data-consent]');
        if (first) first.focus();
      });
    });
  }

  /* ---------- Current year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
