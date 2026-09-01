// Book data for author 장성환 (Jang Seong-hwan)
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

function renderBooks() {
  const grid = document.getElementById("bookGrid");
  if (!grid) return;

  grid.innerHTML = books
    .map((book) => {
      const coverUrl = `https://image.yes24.com/goods/${book.goodsNo}/XL`;
      const link = `https://www.yes24.com/product/goods/${book.goodsNo}`;
      const outOfPrintBadge = book.outOfPrint
        ? '<span class="badge-outofprint">절판</span>'
        : "";

      return `
        <article class="book-card">
          <img class="book-cover" src="${coverUrl}" alt="${book.title} 표지" loading="lazy">
          <div class="book-body">
            <p class="book-role">${book.role}</p>
            <h3 class="book-title">${book.title}${outOfPrintBadge}</h3>
            <p class="book-subtitle">${book.subtitle}</p>
            <p class="book-meta">발행일 ${book.date}</p>
            <a class="book-link" href="${link}" target="_blank" rel="noopener noreferrer">YES24에서 보기 &rarr;</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function setupNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });
}

function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  renderBooks();
  setupNav();
  setYear();
});
