// GENERATED FILE — do not edit by hand.
// Written by the bedah-buku backend (static_gen.go). Regenerate from the admin
// panel: tab "Situs Statis" → "Generasi Situs Statis".
//
// The certificate template image below is committed into this repo, so the
// published page draws the certificate without downloading the (large) image
// from the backend. The backend still supplies the positioning and the exact
// text to draw — see static/js/certificate.js.
//
// certTypeId must match the participant's own cert type, AND imageUpdatedAt
// must match that participant's template.imageUpdatedAt from the backend, for
// the local copy to be used. A mismatch on either — wrong design, or the
// right design but the admin uploaded a NEWER image since this was generated
// — falls back to fetching fresh from API_BASE, so a forgotten re-push can
// never leave a visitor looking at a stale or wrong certificate design.
const CERT_PRELOAD = {
  generatedAt: "2026-10-20T07:20:56+08:00",
  profile: "muna-bedah-buku-II",
  certTypeId: 0,
  certTypeName: "Tipe 1",
  imagePath: "assets/cert/template-1792452056.jpg",
  imageUpdatedAt: "2026-10-20T07:20:56+08:00",
};
