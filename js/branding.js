// Brand header override. Depends on config.js + api.js.
//
// Every page ships with "Bedah Buku" / "KPU Kabupaten Muna" hard-coded in the
// header, so it reads correctly even with the backend down. When the admin has
// set a different site name/subtitle (Pengaturan Kegiatan), /api/settings
// returns it and this swaps it in. The last value seen is remembered in
// localStorage so the next page load shows it straight away instead of
// flashing the default first.

const DEFAULT_SITE_NAME = "Bedah Buku";
const BRAND_CACHE_KEY = "siteBrand";

function brandInitials(name) {
  const words = name.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "BB";
}

function applyBrand(b) {
  if (!b || !b.siteName) return;
  document.querySelectorAll(".brand .t1").forEach((el) => { el.textContent = b.siteName; });
  if (b.siteSubtitle) {
    document.querySelectorAll(".brand .t2").forEach((el) => { el.textContent = b.siteSubtitle; });
  }
  document.querySelectorAll(".brand .brand-mark").forEach((el) => { el.textContent = brandInitials(b.siteName); });
  // Page titles are "<Halaman> — Bedah Buku" (or "Bedah Buku — KPU …" on the
  // index); rebuild from the pristine title so re-applying is idempotent.
  if (!document.documentElement.dataset.baseTitle) {
    document.documentElement.dataset.baseTitle = document.title;
  }
  let t = document.documentElement.dataset.baseTitle.replace(DEFAULT_SITE_NAME, b.siteName);
  if (b.siteSubtitle) t = t.replace("KPU Kabupaten Muna", b.siteSubtitle);
  document.title = t;
}

(function () {
  try { applyBrand(JSON.parse(localStorage.getItem(BRAND_CACHE_KEY) || "null")); } catch (e) {}
  apiGet("/api/settings").then((s) => {
    const b = { siteName: s.siteName || "", siteSubtitle: s.siteSubtitle || "" };
    applyBrand(b);
    try { localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify(b)); } catch (e) {}
  }).catch(() => {});
})();
