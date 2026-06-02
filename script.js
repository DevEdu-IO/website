// Lightweight HTML includes: any element with [data-include="file.html"] is
// replaced by the contents of that file. This keeps the nav and footer in a
// single partial each (partials/nav.html, partials/footer.html) and shared
// across every page — no build step, just a static fetch.
(function () {
  function enhance() {
    var page = location.pathname.split("/").pop() || "index.html";
    var onHome = page === "index.html";

    // On the homepage, turn "index.html#section" links into bare "#section"
    // so they scroll smoothly instead of reloading the page.
    if (onHome) {
      document.querySelectorAll('.nav__links a[href^="index.html#"]').forEach(function (a) {
        a.setAttribute("href", a.getAttribute("href").slice("index.html".length));
      });
    }

    // Highlight the nav link for the current page.
    document.querySelectorAll(".nav__links a[data-page]").forEach(function (a) {
      if (a.getAttribute("data-page") === page) a.classList.add("active");
    });

    // On the homepage, clicking the brand should smooth-scroll back to the top
    // (and let the bar return to it), not reload the page.
    var brand = document.querySelector(".nav .brand");
    if (onHome && brand) {
      brand.setAttribute("href", "#top");
      // The sticky header is always on screen, so an #top anchor won't scroll.
      // Scroll to the very top explicitly instead.
      brand.addEventListener("click", function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Scroll-spy: on the homepage, highlight the section currently in view.
    // While you're up at the top (no section yet), the bar lives under the brand.
    if (onHome) {
      var anchors = Array.prototype.slice.call(
        document.querySelectorAll('.nav__links a[href^="#"]')
      );
      var sections = anchors
        .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
        .filter(Boolean);

      if (sections.length) {
        var ticking = false;
        var spy = function () {
          ticking = false;
          var mark = window.scrollY + 130; // account for the sticky nav
          var currentId = null;
          sections.forEach(function (sec) {
            if (sec.offsetTop <= mark) currentId = sec.id;
          });
          anchors.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + currentId);
          });
          if (brand) brand.classList.toggle("active", currentId === null);
        };
        window.addEventListener("scroll", function () {
          if (!ticking) { ticking = true; window.requestAnimationFrame(spy); }
        }, { passive: true });
        spy();
      }
    }

    // Current year in the footer.
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    // Mobile nav toggle.
    var toggle = document.querySelector(".nav__toggle");
    var links = document.querySelector(".nav__links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { links.classList.remove("open"); });
      });
    }
  }

  var slots = Array.prototype.slice.call(document.querySelectorAll("[data-include]"));
  Promise.all(slots.map(function (el) {
    var url = el.getAttribute("data-include");
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to load " + url + " (" + r.status + ")");
        return r.text();
      })
      .then(function (html) { el.outerHTML = html; })
      .catch(function (err) { console.error(err); });
  })).then(enhance);

  // --- Donated-AI impact stats ---------------------------------------------
  // Fetches the webapp's public /api/v1/impact endpoint and counts the numbers
  // up when the band scrolls into view. The section stays hidden if the API is
  // unreachable, so the page never shows empty placeholders.
  function compact(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }
  function withCommas(n) { return n.toLocaleString("en-US"); }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function countUp(el, target, fmt, suffix) {
    suffix = suffix || "";
    if (reducedMotion()) { el.textContent = fmt(target) + suffix; return; }
    var dur = 1800, started = null;
    el.textContent = fmt(0) + suffix; // make the climb obvious from zero
    function frame(ts) {
      if (started === null) started = ts;
      var p = Math.min((ts - started) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initImpact() {
    var wrap = document.querySelector("[data-impact-endpoint]");
    if (!wrap) return;
    var section = wrap.closest("section") || wrap;
    var specs = [
      { key: "hours_donated",   fmt: withCommas, suffix: "+" },
      { key: "tokens_donated",  fmt: compact,    suffix: ""  },
      { key: "students_helped", fmt: withCommas, suffix: "+" }
    ];

    // Use the local Rails server when previewing the site on localhost.
    var endpoint = wrap.getAttribute("data-impact-endpoint");
    var localEndpoint = wrap.getAttribute("data-impact-endpoint-local");
    if (localEndpoint && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      endpoint = localEndpoint;
    }

    fetch(endpoint)
      .then(function (r) { if (!r.ok) throw new Error("impact " + r.status); return r.json(); })
      .then(function (data) {
        section.hidden = false; // reveal only once we have real numbers
        var animate = function () {
          specs.forEach(function (s) {
            var el = wrap.querySelector('[data-stat="' + s.key + '"]');
            if (el && typeof data[s.key] === "number") countUp(el, data[s.key], s.fmt, s.suffix);
          });
        };
        var io = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { animate(); obs.disconnect(); }
          });
        }, { threshold: 0.3 });
        io.observe(section);
      })
      .catch(function (err) { console.error(err); }); // leave the band hidden
  }

  initImpact();
})();
