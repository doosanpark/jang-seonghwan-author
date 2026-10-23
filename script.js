// 메인 페이지 — 표지 커버플로우(히어로), 순례자의 노트 서가, 전체 도서 카탈로그, 내비게이션.
// 도서 데이터는 books-data.js(BOOKS / BOOKS_BY_DATE)를 함께 쓴다.

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 40;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

function coverUrl(book) {
  return `https://image.yes24.com/goods/${book.goodsNo}/XL`;
}

// 구매는 상세 페이지의 서점 목록에서 고르도록 하고, 여기서는 상세로만 보낸다.
function detailUrl(book) {
  return `book.html?no=${encodeURIComponent(book.goodsNo)}`;
}

function creditHtml(book) {
  return book.coAuthor ? ` <span class="book-credit">· ${escapeHtml(book.coAuthor)}</span>` : "";
}

function outOfPrintBadge(book) {
  return book.outOfPrint ? '<span class="badge-outofprint">절판</span>' : "";
}

// YES24 표지는 외부 호스트에서 불러오므로, 실패하면 제목이 보이는 대체 블록으로 교체한다.
function setupCoverFallbacks(root) {
  root.querySelectorAll("img[data-title]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const base = img.classList[0];
        const fallback = document.createElement("div");
        fallback.className = `${base} ${base}--fallback`;
        fallback.setAttribute("aria-hidden", "true");
        fallback.innerHTML = `<span>${escapeHtml(img.dataset.title || "표지 준비 중")}</span>`;
        img.replaceWith(fallback);
      },
      { once: true }
    );
  });
}

// 표지 한 장. 무한 순환을 위해 목록을 3벌 복제하므로 원본 인덱스를 data-book에 남긴다.
function coverItemHtml(book, bookIndex) {
  return `
    <li class="cf-item" data-book="${bookIndex}">
      <img class="cf-cover" src="${coverUrl(book)}" alt="" data-title="${escapeHtml(book.title)}"
           decoding="async">
    </li>
  `;
}

// 가운데 표지에 대한 설명 — 보조기기에는 이 캡션만 노출된다.
function captionHtml(book, isNewest) {
  const title = escapeHtml(book.title);
  // 부제가 없는 책에서도 자리를 비워 둬야 표지를 넘길 때 아래 버튼이 튀지 않는다.
  const subtitle = book.subtitle ? escapeHtml(book.subtitle) : "&nbsp;";
  const tag = isNewest ? "신간" : "후밀리타스 도서";

  return `
    <p class="cf-eyebrow">${tag}<span class="cf-date"> · ${escapeHtml(book.date)}</span></p>
    <h2 class="cf-title">${title}${outOfPrintBadge(book)}</h2>
    <p class="cf-subtitle">${subtitle}</p>
    <p class="cf-role">${escapeHtml(book.role)}${creditHtml(book)}</p>
    <div class="cf-cta">
      <a class="btn btn-primary" href="${detailUrl(book)}">
        자세히 보기<span class="sr-only"> — ${title}</span>
      </a>
    </div>
  `;
}

// 가운데 표지를 크게 강조하고 양옆을 흘려보내는 커버플로우 캐러셀.
// 목록을 3벌 이어 붙인 뒤 가운데 벌에서 움직이고, 끝에 닿으면 애니메이션 없이
// 같은 위치의 가운데 벌로 되돌려 끊김 없이 순환하는 것처럼 보이게 한다.
function setupCoverflow(list) {
  const root = document.getElementById("cfRoot");
  const track = document.getElementById("cfTrack");
  const caption = document.getElementById("cfCaption");
  const prevBtn = document.getElementById("cfPrev");
  const nextBtn = document.getElementById("cfNext");
  const playBtn = document.getElementById("cfPlay");
  const playIcon = document.getElementById("cfPlayIcon");
  const hero = document.getElementById("heroSlider");
  if (!root || !track || !caption || !list.length) return;

  const n = list.length;
  const COPIES = 3;
  const items = [];
  for (let c = 0; c < COPIES; c += 1) items.push(...list.map((book, i) => coverItemHtml(book, i)));
  track.innerHTML = items.join("");
  setupCoverFallbacks(track);

  const cells = Array.from(track.children);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 자동 넘김은 사용자 의도(wantsPlay)와 일시 중단 사유(suspends)를 나눠 관리한다.
  // 마우스를 올리거나 포커스가 들어오면 멈추되, 사용자가 직접 끈 상태를 되살리지는 않는다.
  const suspends = new Set();
  let wantsPlay = !reduceMotion;
  let index = n; // 가운데 벌의 첫 번째 책에서 시작
  let timer = null;

  function syncAutoplay() {
    clearInterval(timer);
    timer = null;
    const running = wantsPlay && suspends.size === 0;
    if (running) timer = setInterval(() => go(index + 1), AUTOPLAY_MS);
    // 자동으로 넘어가는 동안에는 낭독을 방해하지 않도록 live 영역을 꺼둔다.
    caption.setAttribute("aria-live", running ? "off" : "polite");
    playBtn.setAttribute("aria-label", wantsPlay ? "자동 넘김 멈추기" : "자동 넘김 시작하기");
    playIcon.innerHTML = wantsPlay ? "&#10073;&#10073;" : "&#9654;";
  }

  function render() {
    root.style.setProperty("--cf-i", index);
    const active = index % n;
    cells.forEach((cell, i) => cell.classList.toggle("is-active", i === index));
    caption.innerHTML = captionHtml(list[active], active === 0);
  }

  // 같은 책이 놓인 가운데 벌의 자리로 애니메이션 없이 되돌린다. 보이는 그림은 그대로다.
  function snapToMiddle() {
    index = n + (((index % n) + n) % n);
    track.classList.add("is-jumping");
    render();
    void track.offsetWidth; // 위치를 즉시 반영시킨 뒤 전환을 다시 켠다
    track.classList.remove("is-jumping");
  }

  function go(next) {
    // 연타로 복제 구간 밖까지 밀려나면 빈 화면이 되므로 먼저 가운데로 되돌린다.
    if (next < 0 || next >= cells.length) {
      const dir = next < 0 ? -1 : 1;
      snapToMiddle();
      next = index + dir;
    }
    index = next;
    render();
  }

  function goByUser(next) {
    go(next);
    syncAutoplay(); // 조작 직후에는 타이머를 처음부터 다시 센다.
  }

  // 바깥쪽 벌까지 흘러갔으면 전환이 끝난 뒤 조용히 가운데 벌로 되돌린다.
  track.addEventListener("transitionend", (e) => {
    if (e.target !== track || e.propertyName !== "transform") return;
    if (index >= n * 2 || index < n) snapToMiddle();
  });

  prevBtn.addEventListener("click", () => goByUser(index - 1));
  nextBtn.addEventListener("click", () => goByUser(index + 1));

  // 옆 표지를 누르면 가운데로, 가운데 표지를 누르면 그 책의 상세 페이지로 간다.
  track.addEventListener("click", (e) => {
    const cell = e.target.closest(".cf-item");
    if (!cell) return;
    const pos = cells.indexOf(cell);
    if (pos === index) window.location.href = detailUrl(list[index % n]);
    else goByUser(pos);
  });

  playBtn.addEventListener("click", () => {
    wantsPlay = !wantsPlay;
    syncAutoplay();
  });

  const suspend = (reason, on) => {
    if (on) suspends.add(reason);
    else suspends.delete(reason);
    syncAutoplay();
  };

  hero.addEventListener("mouseenter", () => suspend("hover", true));
  hero.addEventListener("mouseleave", () => suspend("hover", false));
  hero.addEventListener("focusin", () => suspend("focus", true));
  hero.addEventListener("focusout", () => suspend("focus", false));
  document.addEventListener("visibilitychange", () => suspend("hidden", document.hidden));

  hero.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goByUser(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goByUser(index + 1);
    }
  });

  let touchStartX = null;
  track.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true }
  );
  track.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > SWIPE_THRESHOLD) goByUser(index + (dx < 0 ? 1 : -1));
      touchStartX = null;
    },
    { passive: true }
  );

  if (reduceMotion) playBtn.hidden = true;
  render();
  syncAutoplay();
}

// ---------------------------------------------------------------
// 순례자의 노트 시리즈 서가 — 연도별 표지를 최신판부터 나란히 놓는다.
// ---------------------------------------------------------------
const SERIES_TITLE = "순례자의 노트";

function seriesYear(book) {
  const m = String(book.subtitle || "").match(/\d{4}/);
  return m ? m[0] : book.date.slice(0, 4);
}

function setupSeries(list) {
  const shelf = document.getElementById("seriesShelf");
  const latestLink = document.getElementById("seriesLatest");
  const series = list.filter((b) => b.title === SERIES_TITLE);
  if (!shelf || !series.length) return;

  shelf.innerHTML = series
    .map((book, i) => {
      const year = escapeHtml(seriesYear(book));
      const tag = book.outOfPrint ? '<span class="shelf-tag">절판</span>' : "";
      return `
        <li class="shelf-item${i === 0 ? " is-latest" : ""}">
          <a class="shelf-link" href="${detailUrl(book)}">
            <span class="shelf-cover">
              <img class="shelf-img" src="${coverUrl(book)}" alt="" data-title="${escapeHtml(book.title)} ${year}"
                   loading="lazy" decoding="async">
            </span>
            <span class="shelf-year">${year}${tag}</span>
            <span class="sr-only">${escapeHtml(book.title)} — ${escapeHtml(book.subtitle || "")}</span>
          </a>
        </li>`;
    })
    .join("");
  setupCoverFallbacks(shelf);

  if (latestLink) {
    latestLink.href = detailUrl(series[0]);
    latestLink.textContent = `${seriesYear(series[0])}년판 보기`;
  }
}

// ---------------------------------------------------------------
// 전체 도서 카탈로그 — 주제 칩으로 걸러 본다.
// ---------------------------------------------------------------
const CATEGORY_ORDER = ["말씀묵상", "영성", "신학", "교회론", "기도"];

function bookCardHtml(book) {
  const title = escapeHtml(book.title);
  const subtitle = book.subtitle ? `<span class="book-card-sub">${escapeHtml(book.subtitle)}</span>` : "";
  const credit = book.coAuthor ? ` · ${escapeHtml(book.coAuthor)}` : "";
  const category = book.category ? escapeHtml(book.category) : "도서";
  return `
    <li class="book-card" data-category="${escapeHtml(book.category || "")}">
      <a class="book-card-link" href="${detailUrl(book)}">
        <span class="book-card-cover">
          <img class="book-cover" src="${coverUrl(book)}" alt="" data-title="${title}"
               loading="lazy" decoding="async">
        </span>
        <span class="book-card-body">
          <span class="book-card-cat">${category}${outOfPrintBadge(book)}</span>
          <h3 class="book-card-title">${title}</h3>
          ${subtitle}
          <span class="book-card-meta">${escapeHtml(book.role)}${credit} · ${escapeHtml(book.date.slice(0, 7))}</span>
        </span>
      </a>
    </li>`;
}

function setupCatalogue(list) {
  const grid = document.getElementById("bookGrid");
  const filters = document.getElementById("bookFilters");
  const count = document.getElementById("bookCount");
  const status = document.getElementById("bookStatus");
  if (!grid) return;

  grid.innerHTML = list.map(bookCardHtml).join("");
  setupCoverFallbacks(grid);
  if (count) count.textContent = list.length;

  if (!filters) return;
  const present = new Set(list.map((b) => b.category).filter(Boolean));
  const categories = ["전체", ...CATEGORY_ORDER.filter((c) => present.has(c))];
  filters.innerHTML = categories
    .map(
      (c, i) =>
        `<button type="button" class="chip" data-filter="${escapeHtml(c)}" aria-pressed="${i === 0}">${escapeHtml(c)}</button>`
    )
    .join("");

  const cards = Array.from(grid.children);
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    const value = btn.dataset.filter;
    filters.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    let shown = 0;
    cards.forEach((card) => {
      const match = value === "전체" || card.dataset.category === value;
      card.hidden = !match;
      if (match) shown += 1;
    });
    if (count) count.textContent = shown;
    if (status) status.textContent = `${value} ${shown}권`;
  });
}

function setupNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  const setOpen = (open) => {
    links.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  };

  toggle.addEventListener("click", () => {
    setOpen(!links.classList.contains("open"));
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

// '홈'(과 로고)은 헤더 위치가 아니라 문서 맨 위로 올리고, 주소창에 #top을 남기지 않는다.
function setupHomeLinks() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-home]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", window.location.pathname + window.location.search);
    });
  });
}

function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  setupCoverflow(BOOKS_BY_DATE);
  setupSeries(BOOKS_BY_DATE);
  setupCatalogue(BOOKS_BY_DATE);
  setupNav();
  setupHomeLinks();
  setYear();
});
