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
})();
