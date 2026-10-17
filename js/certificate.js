// Shared certificate rendering + download logic, used by presensi.html,
// edit.html, and sertifikat.html. Depends on config.js (API_BASE) and
// preload.js (CERT_PRELOAD).
// Requires jsPDF to be loaded on the page for downloadCertPdf to work.
//
// The backend only ever sends the positioning and the exact strings to draw.
// Everything below — loading the template image, badging the text onto it,
// and turning the result into a JPG or PDF — happens here in the browser.

function loadImageViaFetch(url) {
  return new Promise(async (resolve, reject) => {
    try {
      // EXTRA_HEADERS is defined in api.js (ngrok-skip-browser-warning).
      // Without it the image fetch hits ngrok's HTML interstitial and the
      // browser blocks it as a CORS failure even though the server allows *.
      const res = await fetch(url, { mode: "cors", headers: EXTRA_HEADERS });
      if (!res.ok) throw new Error("Gagal memuat gambar template sertifikat.");
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal memuat gambar template sertifikat."));
      img.src = objUrl;
    } catch (e) {
      reject(e);
    }
  });
}

// Loads a template image that is committed into this site, by relative path.
// Same-origin, so the canvas stays untainted and toDataURL (JPG/PDF) works.
function loadImageLocal(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar template preload tidak dapat dibaca."));
    img.src = path;
  });
}

// Returns true when CERT_PRELOAD (written by the backend's static generator)
// holds a usable local copy of the template this particular participant
// needs. Only the ACTIVE cert type is ever preloaded, so a participant
// registered under some other design must not use it — hence the id check.
function preloadMatches(data) {
  const p = typeof CERT_PRELOAD !== "undefined" ? CERT_PRELOAD : null;
  if (!p || !p.imagePath) return false;
  // An older backend doesn't send certTypeId; without it we can't prove the
  // preloaded design is the right one, so don't risk the wrong template.
  if (typeof data.certTypeId !== "number") return false;
  return p.certTypeId === data.certTypeId;
}

// The template image, preferring the preloaded local copy when it is the
// right one for this participant. Any failure — feature off, different cert
// type, file missing because the generated static/ folder was never pushed —
// falls back to fetching from the backend exactly as before, so a forgotten
// re-push degrades performance rather than breaking the page.
async function loadCertTemplateImage(data) {
  if (preloadMatches(data)) {
    try {
      return await loadImageLocal(CERT_PRELOAD.imagePath);
    } catch (e) {
      console.warn("Preload sertifikat gagal dipakai, memuat dari backend:", e.message);
    }
  }
  return loadImageViaFetch(API_BASE + data.template.imageUrl);
}

// The cert-number line. With numbering switched off server-side, certNo is a
// fixed string shared by everyone rather than a per-participant number — it
// still reads as a number line ("No. ..."). An empty value means there is
// nothing to say there, so the line is skipped rather than printing a bare
// "No.".
function certLineText(data) {
  const certNo = (data.certNo || "").trim();
  return certNo ? "No. " + certNo : "";
}

// Fills the "Nomor Sertifikat: ..." line above the canvas, and hides that
// whole row when there is nothing to show — which is what an empty
// cert_prefix means on a profile running without numbering.
function showCertNoRow(data) {
  const certNo = (data.certNo || "").trim();
  const row = document.getElementById("certNoRow");
  const text = document.getElementById("certNoText");
  if (text) text.textContent = certNo;
  if (row) row.style.display = certNo ? "" : "none";
}

// Draws the certificate (template image + nama + certNo) onto the given
// canvas element, per the sertifikat API response shape.
async function renderCertificateToCanvas(data, canvas) {
  const img = await loadCertTemplateImage(data);
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const color = data.template.textColor === "light" ? "#FFFFFF" : "#20241F";
  const scale = canvas.width / 1000;
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.font = `700 ${data.template.nameSize * scale}px Georgia, 'Times New Roman', serif`;
  ctx.fillText(data.nama, canvas.width / 2, canvas.height * (data.template.nameY / 100));
  const certLine = certLineText(data);
  if (certLine) {
    ctx.font = `italic ${data.template.certSize * scale}px Georgia, 'Times New Roman', serif`;
    ctx.fillText(certLine, canvas.width / 2, canvas.height * (data.template.certY / 100));
  }
}

function safeFileName(n) {
  return n.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
}

// Fire-and-forget: records a download for the Statistik tab in the admin
// panel. Never blocks or fails the actual download on the visitor's end.
function logCertDownload(email, type) {
  apiSend("POST", "/api/sertifikat/" + encodeURIComponent(email) + "/download", { type }).catch(() => {});
}

function downloadCertJpg(canvas, nama, email) {
  const link = document.createElement("a");
  link.download = `sertifikat_${safeFileName(nama)}.jpg`;
  link.href = canvas.toDataURL("image/jpeg", 0.95);
  link.click();
  logCertDownload(email, "jpg");
}

function downloadCertPdf(canvas, nama, email) {
  const img = canvas.toDataURL("image/jpeg", 0.95);
  const { jsPDF } = window.jspdf;
  const isLandscape = canvas.width >= canvas.height;
  const doc = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });
  doc.addImage(img, "JPEG", 0, 0, canvas.width, canvas.height);
  doc.save(`sertifikat_${safeFileName(nama)}.pdf`);
  logCertDownload(email, "pdf");
}
