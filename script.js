(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  /* Scroll progress bar + back-to-top button */
  const bar = document.createElement("span");
  bar.className = "header__progress";
  bar.setAttribute("aria-hidden", "true");
  $(".header").append(bar);

  const topBtn = document.createElement("button");
  topBtn.className = "to-top";
  topBtn.type = "button";
  topBtn.setAttribute("aria-label", "Back to top");
  topBtn.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
  topBtn.addEventListener("click", () => scrollTo({ top: 0 }));
  document.body.append(topBtn);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--p", max > 0 ? scrollY / max : 0);
      topBtn.classList.toggle("show", scrollY > 600);
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Scroll reveal for cards, staggered within each grid */
  const targets = $$(
    ".hobbies__item,.favorites__item,.dreams__item,.gallery__item,.facts__item," +
      ".trivia__item,.timeline__item,.photo-card,.about__motto,.dreams__highlight,.contact__form"
  );
  targets.forEach((el) => {
    el.classList.add("reveal");
    const p = el.parentElement;
    const i = p.matches("ul,ol,dl") ? [...p.children].indexOf(el) : 0;
    el.style.setProperty("--i", Math.min(i, 5));
  });
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((el) => io.observe(el));
  }

  /* Profile card tilt (mouse only) */
  const card = $(".page__sidebar");
  if (card && !reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", x * 10 + "deg");
      card.style.setProperty("--rx", -y * 10 + "deg");
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
    });
  }

  /* Hero typewriter (home page). Hidden text reserves space so nothing jumps. */
  const accent = $(".hero__line--accent");
  if (accent && !reduce) {
    const full = accent.textContent.trim();
    accent.innerHTML =
      '<span class="sr-only"></span><span aria-hidden="true"><span class="type__on"></span><span class="type__off"></span></span>';
    $(".sr-only", accent).textContent = full;
    const on = $(".type__on", accent);
    const off = $(".type__off", accent);
    off.textContent = full;
    let n = 0;
    setTimeout(function tick() {
      n++;
      on.textContent = full.slice(0, n);
      off.textContent = full.slice(n);
      if (n < full.length) setTimeout(tick, 45);
      else setTimeout(() => accent.classList.add("hero__line--done"), 1800);
    }, 400);
  }

  /* Toast + demo contact form */
  let toastEl, toastTimer;
  const toast = (msg) => {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.append(toastEl);
    }
    toastEl.textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 4000);
  };
  const form = $(".contact__form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.elements.name.value.trim();
      toast(`Thanks${name ? ", " + name : ""}! This form is a demo, so nothing was sent.`);
      form.reset();
    });
  }

  /* Gallery lightbox: click a photo, then use arrows or Esc */
  const imgs = $$(".gallery__img");
  if (imgs.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Photo viewer");
    lb.innerHTML =
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Close">&times;</button>' +
      '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous photo">&lsaquo;</button>' +
      '<figure class="lightbox__fig"><img class="lightbox__img" alt="" /><figcaption class="lightbox__cap"></figcaption></figure>' +
      '<button class="lightbox__btn lightbox__next" type="button" aria-label="Next photo">&rsaquo;</button>';
    document.body.append(lb);
    const big = $(".lightbox__img", lb);
    const cap = $(".lightbox__cap", lb);
    let cur = 0;
    let opener = null;

    const show = (i) => {
      cur = (i + imgs.length) % imgs.length;
      const im = imgs[cur];
      const li = im.closest("li");
      const t = $(".gallery__label", li);
      const c = $(".gallery__caption", li);
      big.src = im.currentSrc || im.src;
      big.alt = im.alt;
      cap.textContent = t && c ? `${t.textContent.trim()}: ${c.textContent.trim()}` : im.alt;
    };
    const open = (i) => {
      opener = document.activeElement;
      show(i);
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      $(".lightbox__close", lb).focus();
    };
    const close = () => {
      lb.classList.remove("open");
      document.body.style.overflow = "";
      if (opener) opener.focus();
    };

    imgs.forEach((im, i) => {
      im.tabIndex = 0;
      im.setAttribute("role", "button");
      im.addEventListener("click", () => open(i));
      im.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(i);
        }
      });
    });
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target.closest(".lightbox__close")) close();
      else if (e.target.closest(".lightbox__prev")) show(cur - 1);
      else if (e.target.closest(".lightbox__next")) show(cur + 1);
    });
    addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
  }
})();
