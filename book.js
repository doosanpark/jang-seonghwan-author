// 도서 상세 페이지 — book.html?no=<YES24 goodsNo> 로 한 권을 그린다.

// 판매처 노출 순서: 갓피플을 맨 앞에 둔다.
const STORES = [
  { key: "godpeople", name: "갓피플", note: "기독교 전문" },
  { key: "kyobo", name: "교보문고", note: "" },
  { key: "aladin", name: "알라딘", note: "" },
  { key: "yes24", name: "YES24", note: "" },
];

// 책소개 첫 문단이 이 길이 이하이면 인용구(pull quote)로 크게 보여 준다.
const PULL_QUOTE_MAX = 40;
const RELATED_COUNT = 5;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

function coverUrl(book) {
  return `https://image.yes24.com/goods/${book.goodsNo}/XL`;
}

function detailUrl(book) {
  return `book.html?no=${encodeURIComponent(book.goodsNo)}`;
}

function outOfPrintBadge(book) {
  return book.outOfPrint ? '<span class="badge-outofprint">절판</span>' : "";
}

// 표지는 외부 호스트라 실패할 수 있다. 제목이 보이는 블록으로 바꿔 둔다.
function setupCoverFallback(root) {
  root.querySelectorAll("img[data-title]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const base = img.classList[0];
        const fb = document.createElement("div");
        fb.className = `${base} ${base}--fallback`;
        fb.setAttribute("aria-hidden", "true");
        fb.innerHTML = `<span>${escapeHtml(img.dataset.title || "표지 준비 중")}</span>`;
        img.replaceWith(fb);
      },
      { once: true }
    );
  });
}

function storeListHtml(book) {
  const items = STORES.filter((s) => book.links && book.links[s.key]).map((s) => {
    const note = s.note ? `<span class="store-note">${escapeHtml(s.note)}</span>` : "";
    return `
      <li>
        <a class="store-link" href="${book.links[s.key]}" target="_blank" rel="noopener noreferrer">
          <span class="store-name">${escapeHtml(s.name)}</span>${note}
          <span class="store-go" aria-hidden="true">&rarr;</span>
          <span class="sr-only">(새 창에서 열림)</span>
        </a>
      </li>`;
  });
  if (!items.length) return "";
  return `
    <section class="detail-stores" aria-labelledby="storesTitle">
      <h2 class="detail-label" id="storesTitle">구매하기</h2>
      <ul class="store-list">${items.join("")}</ul>
      <p class="note">※ 재고와 가격은 각 서점에서 확인해 주세요.</p>
    </section>`;
}

function specHtml(book) {
  const rows = [
    ["발행일", book.date],
    ["쪽수", book.pages ? `${book.pages}쪽` : ""],
    ["ISBN", book.isbn],
    ["출판사", "후밀리타스"],
  ].filter((r) => r[1]);

  return `
    <dl class="spec">
      ${rows.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join("")}
    </dl>`;
}

function descHtml(book) {
  const paras = (book.description || []).slice();
  if (!paras.length) return "";
  let pull = "";
  if (paras[0].length <= PULL_QUOTE_MAX) pull = `<p class="pull-quote">${escapeHtml(paras.shift())}</p>`;
  const body = paras.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  return `
    <section class="detail-desc" aria-labelledby="descTitle">
      <h2 class="detail-label" id="descTitle">책 소개</h2>
      ${pull}${body}
      <p class="note">※ 책소개는 YES24 상품 정보를 옮긴 것입니다.</p>
    </section>`;
}

function detailHtml(book) {
  const title = escapeHtml(book.title);
  const subtitle = book.subtitle ? `<p class="detail-subtitle">${escapeHtml(book.subtitle)}</p>` : "";
  const author = [book.role, book.coAuthor].filter(Boolean).map(escapeHtml).join(" · ");
  const eyebrow = [book.category, book.title === "순례자의 노트" ? "연간 시리즈" : ""]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" · ") || "후밀리타스 도서";

  return `
    <div class="detail-head">
      <div class="detail-cover-wrap">
        <img class="detail-cover" src="${coverUrl(book)}"
             alt="${title} 표지" data-title="${title}" decoding="async">
      </div>
      <div class="detail-meta">
        <p class="eyebrow">${eyebrow}</p>
        <h1 class="detail-title">${title}${outOfPrintBadge(book)}</h1>
        ${subtitle}
        <p class="detail-author">${author}</p>
        ${specHtml(book)}
        ${storeListHtml(book)}
        ${descHtml(book)}
      </div>
    </div>
  `;
}

function bookCardHtml(book) {
  const title = escapeHtml(book.title);
  const subtitle = book.subtitle ? `<span class="book-card-sub">${escapeHtml(book.subtitle)}</span>` : "";
  const credit = book.coAuthor ? ` · ${escapeHtml(book.coAuthor)}` : "";
  return `
    <li class="book-card">
      <a class="book-card-link" href="${detailUrl(book)}">
        <span class="book-card-cover">
          <img class="book-cover" src="${coverUrl(book)}" alt="" data-title="${title}" loading="lazy" decoding="async">
        </span>
        <span class="book-card-body">
          <span class="book-card-cat">${escapeHtml(book.category || "도서")}${outOfPrintBadge(book)}</span>
          <h3 class="book-card-title">${title}</h3>
          ${subtitle}
          <span class="book-card-meta">${escapeHtml(book.role)}${credit} · ${escapeHtml(book.date.slice(0, 7))}</span>
        </span>
      </a>
    </li>`;
}

// 같은 주제의 책을 먼저, 나머지는 최신순으로 채운다.
function renderRelated(book) {
  const section = document.getElementById("related");
  const grid = document.getElementById("relatedGrid");
  if (!section || !grid) return;
  const others = BOOKS_BY_DATE.filter((b) => b.goodsNo !== book.goodsNo);
  const same = others.filter((b) => b.category && b.category === book.category);
  const rest = others.filter((b) => !same.includes(b));
  const picks = [...same, ...rest].slice(0, RELATED_COUNT);
  if (!picks.length) return;
  grid.innerHTML = picks.map(bookCardHtml).join("");
  setupCoverFallback(grid);
  section.hidden = false;
}

function notFoundHtml() {
  const list = BOOKS_BY_DATE.map(
    (b) =>
      `<li><a href="${detailUrl(b)}">${escapeHtml(b.title)}${b.subtitle ? ` — ${escapeHtml(b.subtitle)}` : ""}</a>
       <span class="note">${escapeHtml(b.date)}</span></li>`
  ).join("");
  return `
    <h1 class="detail-title">도서를 찾을 수 없습니다</h1>
    <p>주소가 바뀌었거나 없는 도서입니다. 아래에서 선택해 주세요.</p>
    <ul class="notfound-list">${list}</ul>
    <p class="detail-back"><a class="link-arrow" href="index.html">&larr; 홈으로 돌아가기</a></p>
  `;
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

  toggle.addEventListener("click", () => setOpen(!links.classList.contains("open")));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("detail");
  const no = new URLSearchParams(window.location.search).get("no");
  const book = no ? findBook(no) : null;

  if (book) {
    root.innerHTML = detailHtml(book);
    setupCoverFallback(root);
    renderRelated(book);
    // 쿼리 파라미터로 내용이 갈리므로 제목·공유 정보도 함께 맞춘다.
    const full = book.subtitle ? `${book.title} — ${book.subtitle}` : book.title;
    document.title = `${full} | 후밀리타스`;
    const crumb = document.getElementById("crumbTitle");
    if (crumb) crumb.textContent = book.title;
    const desc = (book.description || [])[0] || full;
    document.querySelector('meta[name="description"]').setAttribute("content", desc.slice(0, 150));
  } else {
    root.innerHTML = notFoundHtml();
    document.title = "도서를 찾을 수 없습니다 | 후밀리타스";
  }

  setupNav();
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
