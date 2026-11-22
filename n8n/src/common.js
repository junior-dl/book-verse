function safe(name) {
  try {
    const j = $(name).first().json;
    return j && !j.error ? j : null;
  }
  catch (e) {
    return null;
  }
}
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const baseTitle = t => norm(String(t || "").split(";")[0].split(":")[0].replace(/^\s*(the|a|an)\s+/i, ""));
const popularity = (n, k) => Math.min(1000, Math.round(Math.log(1 + (Number(n) || 0)) * k));
const https = u => (u ? String(u).replace(/^http:\/\//, "https://") : null);
const clean = s => (s ? String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : null);
const LANG = { eng: "en", fre: "fr", fra: "fr", ger: "de", deu: "de", spa: "es", ita: "it", por: "pt", rus: "ru", jpn: "ja", chi: "zh", zho: "zh", dut: "nl", nld: "nl", lat: "la", gre: "el", swe: "sv", fin: "fi", dan: "da", nor: "no", pol: "pl", tgl: "tl", fil: "tl" };
const lang = l => LANG[l] || String(l || "").slice(0, 2);

function fromGutendex(b) {
  const f = b.formats || {};
  const formats = [];
  const add = (mime, format) => {
    if (f[mime] && String(f[mime]).startsWith("https://") && !formats.some(x => x.format === format))
      formats.push({ format, url: f[mime], source: "gutenberg" });
  };
  add("application/epub+zip", "epub");
  add("application/x-mobipocket-ebook", "mobi");
  add("application/pdf", "pdf");
  add("text/plain; charset=utf-8", "txt");
  add("text/plain; charset=us-ascii", "txt");
  add("text/plain", "txt");
  add("text/html", "html");
  add("text/html; charset=utf-8", "html");
  return {
    source: "gutendex",
    title: b.title,
    description: (b.summaries || [])[0] || null,
    languages: b.languages || [],
    coverUrl: f["image/jpeg"] || null,
    isPublicDomain: b.copyright !== true,
    popularity: popularity(b.download_count, 70),
    authors: (b.authors || []).map(a => ({ name: a.name, birthYear: a.birth_year, deathYear: a.death_year })),
    subjects: (b.subjects || []).concat((b.bookshelves || []).map(s => String(s).replace(/^Category:\s*/, ""))),
    formats,
    identifiers: [{ kind: "gutenberg", value: String(b.id) }],
  };
}

function output(docs) {
  const payload = JSON.stringify(docs.filter(d => d && d.title).slice(0, 20)).split("$bv$").join("");
  return [{ json: { docs: payload, count: docs.length } }];
}
