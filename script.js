// 장성환(저자·사진) 참여 도서 — YES24 goodsNo 기준
const books = [
  {
    goodsNo: "169669169",
    title: "순례자의 노트",
    subtitle: "2026년 말씀묵상 & 기도훈련집",
    role: "저자",
    date: "2025.12.15",
    outOfPrint: false,
  },
  {
    goodsNo: "175527591",
    title: "십자가 영성",
    subtitle: "믿음과 사랑으로 일상을 살아가는 40가지 이야기",
    role: "사진",
    coAuthor: "글 이효재",
    date: "2026.01.22",
    outOfPrint: false,
  },
  {
    goodsNo: "140543644",
    title: "순례자의 노트",
    subtitle: "2025년 말씀묵상 & 기도훈련집",
    role: "저자",
    date: "2024.12.21",
    outOfPrint: false,
  },
  {
    goodsNo: "124143290",
    title: "순례자의 노트",
    subtitle: "2024 말씀묵상 & 기도훈련집",
    role: "저자",
    date: "2023.12.13",
    outOfPrint: false,
  },
  {
    goodsNo: "116468638",
    title: "순례자의 노트",
    subtitle: "2023년 말씀묵상 & 기도훈련집",
    role: "저자",
    date: "2022.12.20",
    outOfPrint: true,
  },
  {
    goodsNo: "105503888",
    title: "순례자의 노트",
    subtitle: "2022년 말씀묵상 & 기도훈련집",
    role: "저자",
    date: "2021.12.10",
    outOfPrint: true,
  },
];

// 후밀리타스에서 펴낸 그 외 도서 — 장성환은 참여 저자가 아니므로 저자명을 함께 표기한다.
const humilitasBooks = [
  {
    goodsNo: "182281390",
    title: "인간, 신을 닮은 짐",
    subtitle: "",
    role: "정순혁 저",
    date: "2026.03.12",
    outOfPrint: false,
  },
  {
    goodsNo: "139912594",
    title: "나는 기도라",
    subtitle: "기도의 시작과 성장",
    role: "정순혁 저",
    date: "2024.11.29",
    outOfPrint: false,
  },
  {
    goodsNo: "118759248",
    title: "세상 사는 하늘 백성",
    subtitle: "교회론: 교회의 본질 이해",
    role: "정순혁 저",
    date: "2023.05.03",
    outOfPrint: false,
  },
  {
    goodsNo: "111102681",
    title: "신의 지혜 신의 존재",
    subtitle: "하나님의 존재 확인",
    role: "정순혁 저",
    date: "2022.07.30",
    outOfPrint: false,
  },
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

// YES24 표지는 외부 호스트에서 불러오므로, 실패하면 제목이 보이는 대체 블록으로 교체한다.
function setupCoverFallbacks(grid) {
  grid.querySelectorAll(".book-cover").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const fallback = document.createElement("div");
        fallback.className = "book-cover book-cover--fallback";
        fallback.setAttribute("aria-hidden", "true");
        fallback.innerHTML = `<span>${escapeHtml(img.dataset.title || "표지 준비 중")}</span>`;
        img.replaceWith(fallback);
      },
      { once: true }
    );
  });
}

function bookCardHtml(book) {
  const coverUrl = `https://image.yes24.com/goods/${book.goodsNo}/XL`;
  const link = `https://www.yes24.com/product/goods/${book.goodsNo}`;
  const title = escapeHtml(book.title);
  const subtitle = book.subtitle ? escapeHtml(book.subtitle) : "";
  const role = escapeHtml(book.role);
  const date = escapeHtml(book.date);
  const credit = book.coAuthor
    ? ` <span class="book-credit">· ${escapeHtml(book.coAuthor)}</span>`
    : "";
  const badge = book.outOfPrint ? '<span class="badge-outofprint">절판</span>' : "";
  const subtitleHtml = subtitle ? `<p class="book-subtitle">${subtitle}</p>` : "";
  const alt = subtitle ? `${title} — ${subtitle} 표지` : `${title} 표지`;

  return `
    <article class="book-card">
      <img class="book-cover" src="${coverUrl}" alt="${alt}"
           data-title="${title}" loading="lazy" decoding="async">
      <div class="book-body">
        <p class="book-role">${role}${credit}</p>
        <h3 class="book-title">${title}${badge}</h3>
        ${subtitleHtml}
        <p class="book-meta">발행일 ${date}</p>
        <a class="book-link" href="${link}" target="_blank" rel="noopener noreferrer">
          YES24에서 보기 <span aria-hidden="true">&rarr;</span>
          <span class="sr-only">(${title}, 새 창에서 열림)</span>
        </a>
      </div>
    </article>
  `;
}

function renderGrid(gridId, list) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = list.map(bookCardHtml).join("");
  setupCoverFallbacks(grid);
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

function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  renderGrid("bookGrid", books);
  renderGrid("humilitasGrid", humilitasBooks);
  setupNav();
  setYear();
});
