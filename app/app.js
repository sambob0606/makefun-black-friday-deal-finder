import { DEALS, CHECKED_AT } from "./deals.js";

const grid = document.getElementById("dealGrid");
const detail = document.getElementById("detailView");
const countLine = document.getElementById("resultCount");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const storeSelect = document.getElementById("storeSelect");
const discountSelect = document.getElementById("discountSelect");
const sortSelect = document.getElementById("sortSelect");

function money(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

function discountPct(deal) {
  return Math.round((1 - deal.sale / deal.usual) * 100);
}

function saving(deal) {
  return deal.usual - deal.sale;
}

function verdictRank(deal) {
  if (deal.verdict.startsWith("True low")) return 0;
  if (deal.verdict.startsWith("Strong price")) return 1;
  if (deal.verdict.startsWith("Routine")) return 2;
  return 3;
}

function verdictClass(deal) {
  if (deal.verdict.startsWith("True low")) return "v-true";
  if (deal.verdict.startsWith("Strong price")) return "v-strong";
  return "v-routine";
}

function fillSelect(select, values, allLabel) {
  select.innerHTML = "";
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = allLabel;
  select.appendChild(all);
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
}

function currentFilters() {
  return {
    query: searchInput.value.trim().toLowerCase(),
    category: categorySelect.value,
    store: storeSelect.value,
    minDiscount: Number(discountSelect.value),
    sort: sortSelect.value,
  };
}

function applyFilters() {
  const f = currentFilters();
  let rows = DEALS.filter((deal) => {
    if (f.category !== "all" && deal.category !== f.category) return false;
    if (f.store !== "all" && deal.store !== f.store) return false;
    if (discountPct(deal) < f.minDiscount) return false;
    if (f.query) {
      const haystack = (deal.product + " " + deal.store + " " + deal.category + " " + deal.verdict).toLowerCase();
      if (!haystack.includes(f.query)) return false;
    }
    return true;
  });
  if (f.sort === "discount") rows.sort((a, b) => discountPct(b) - discountPct(a));
  if (f.sort === "saving") rows.sort((a, b) => saving(b) - saving(a));
  if (f.sort === "price") rows.sort((a, b) => a.sale - b.sale);
  if (f.sort === "verdict") rows.sort((a, b) => verdictRank(a) - verdictRank(b) || saving(b) - saving(a) || discountPct(b) - discountPct(a));
  return rows;
}

function cardHtml(deal) {
  const pct = discountPct(deal);
  return `<article class="card">
    <div class="card-top">
      <span class="cat">${deal.category}</span>
      <span class="pct">-${pct}%</span>
    </div>
    <h3>${deal.product}</h3>
    <p class="store-line">at <strong>${deal.store}</strong></p>
    <p class="price-line"><span class="sale">${money(deal.sale)}</span> <s>${money(deal.usual)}</s> <span class="save">save ${money(saving(deal))}</span></p>
    <p class="verdict ${verdictClass(deal)}">${deal.verdict}</p>
    <p class="evidence">${deal.evidence}</p>
    <p class="meta">Checked ${CHECKED_AT}<br>Price read: ${deal.source}</p>
    <div class="card-actions">
      <a class="buy" href="${deal.url}" target="_blank" rel="noopener">View at ${deal.store}</a>
      <a class="more" href="#/deal/${deal.id}">Why this verdict?</a>
    </div>
  </article>`;
}

function renderList() {
  detail.hidden = true;
  grid.hidden = false;
  const rows = applyFilters();
  countLine.textContent = rows.length === DEALS.length
    ? `Showing all ${rows.length} checked deals`
    : `Showing ${rows.length} of ${DEALS.length} checked deals`;
  grid.innerHTML = rows.length
    ? rows.map(cardHtml).join("")
    : `<p class="empty">No deals match those filters. Loosen the discount or clear the search.</p>`;
}

function renderDetail(id) {
  const deal = DEALS.find((d) => d.id === id);
  if (!deal) {
    renderList();
    return;
  }
  grid.hidden = true;
  detail.hidden = false;
  countLine.textContent = "Deal detail";
  const pct = discountPct(deal);
  detail.innerHTML = `<article class="detail-card">
    <a class="back" href="#/">← All deals</a>
    <div class="card-top"><span class="cat">${deal.category}</span><span class="pct">-${pct}%</span></div>
    <h3>${deal.product}</h3>
    <p class="store-line">at <strong>${deal.store}</strong></p>
    <p class="price-line big"><span class="sale">${money(deal.sale)}</span> <s>${money(deal.usual)}</s> <span class="save">save ${money(saving(deal))} (${pct}% off)</span></p>
    <p class="verdict ${verdictClass(deal)}">${deal.verdict}</p>
    <h4>Evidence</h4>
    <p>${deal.evidence}</p>
    <h4>Shopper note</h4>
    <p>${deal.note}</p>
    <h4>Check record</h4>
    <p>Checked ${CHECKED_AT}. Price read: ${deal.source}. Discount computed from the two prices above: ${money(deal.usual)} − ${money(deal.sale)} = ${money(saving(deal))}.</p>
    <div class="card-actions">
      <a class="buy" href="${deal.url}" target="_blank" rel="noopener">View at ${deal.store}</a>
    </div>
  </article>`;
}

function renderStats() {
  const avg = Math.round(DEALS.reduce((sum, d) => sum + discountPct(d), 0) / DEALS.length);
  const trueLows = DEALS.filter((d) => d.verdict.startsWith("True low")).length;
  const stores = [...new Set(DEALS.map((d) => d.store))].length;
  document.getElementById("stats").innerHTML =
    `<span><strong>${DEALS.length}</strong> deals checked</span>` +
    `<span><strong>${trueLows}</strong> true lows</span>` +
    `<span><strong>${avg}%</strong> average discount</span>` +
    `<span><strong>${stores}</strong> stores compared</span>`;
  document.getElementById("checkedLine").textContent = "Prices checked " + CHECKED_AT;
}

function route() {
  const hash = location.hash || "#/";
  const match = hash.match(/^#\/deal\/([a-z0-9-]+)/);
  if (match) {
    renderDetail(match[1]);
    return;
  }
  const params = new URLSearchParams(hash.replace(/^#\/?/, ""));
  const cat = params.get("cat");
  if (cat && [...categorySelect.options].some((o) => o.value === cat)) categorySelect.value = cat;
  const store = params.get("store");
  if (store && [...storeSelect.options].some((o) => o.value === store)) storeSelect.value = store;
  renderList();
}

fillSelect(categorySelect, [...new Set(DEALS.map((d) => d.category))].sort(), "All categories");
fillSelect(storeSelect, [...new Set(DEALS.map((d) => d.store))].sort(), "All stores");
renderStats();

for (const control of [searchInput, categorySelect, storeSelect, discountSelect, sortSelect]) {
  control.addEventListener("input", renderList);
  control.addEventListener("change", renderList);
}
window.addEventListener("hashchange", route);
route();
