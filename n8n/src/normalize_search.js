const job = $('Loop Jobs').first().json;
const q = (job.payload && job.payload.q) || '';
const words = norm(q).split(' ').filter(w => w.length > 2);
const relevant = (title, authors) => {
  const hay = norm(title) + ' ' + norm((authors || []).join(' '));
  return words.length === 0 || words.filter(w => hay.includes(w)).length >= Math.ceil(words.length * 0.6);
};
const ADAPTATION = /\[(adaptation|abridged|graphic novel|retold)|\b(adapted|retold|abridged|graphic novel|study guide|sparknotes|cliffsnotes)\b/i;
const cleanTitle = t => String(t || '').replace(/\s*\[[^\]]*\]\s*/g, ' ').replace(/\s+/g, ' ').trim();
// Open Library lists every translation's language; keep the book's own (English when present).
const mainLang = list => {
  const l = (list || []).map(lang);
  return l.includes('en') ? ['en'] : l.slice(0, 1);
};
const docs = [];

const g = safe('Gutendex Search');
for (const b of ((g && g.results) || []).slice(0, 8)) {
  if (relevant(b.title, (b.authors || []).map(a => a.name)))
    docs.push(fromGutendex(b));
}

const ol = safe('Open Library Search');
for (const d of ((ol && ol.docs) || []).slice(0, 6)) {
  if (!d.title || !relevant(d.title, d.author_name) || ADAPTATION.test(d.title) || !(d.author_name || []).length)
    continue;
  const isPublic = d.ebook_access === 'public';
  const ia = (d.ia || [])[0];
  const formats = [];
  if (isPublic && ia) {
    formats.push({ format: 'pdf', url: 'https://archive.org/download/' + ia + '/' + ia + '.pdf', source: 'internet-archive' });
    formats.push({ format: 'epub', url: 'https://archive.org/download/' + ia + '/' + ia + '.epub', source: 'internet-archive' });
    formats.push({ format: 'html', url: 'https://archive.org/details/' + ia, source: 'internet-archive' });
  }
  const isbn = d.isbn || [];
  const ids = [{ kind: 'openlibrary', value: String(d.key).replace('/works/', '') }];
  const i13 = isbn.find(x => x.length === 13);
  const i10 = isbn.find(x => x.length === 10);
  if (i13)
    ids.push({ kind: 'isbn13', value: i13 });
  if (i10)
    ids.push({ kind: 'isbn10', value: i10 });
  docs.push({
    source: 'openlibrary',
    title: cleanTitle(d.title),
    subtitle: d.subtitle || null,
    firstPublishedYear: d.first_publish_year || null,
    languages: mainLang(d.language),
    coverUrl: d.cover_i ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-L.jpg' : null,
    isPublicDomain: isPublic,
    popularity: popularity((d.want_to_read_count || 0) + (d.ratings_count || 0), 80),
    authors: (d.author_name || []).map((name, i) => ({ name, olKey: (d.author_key || [])[i] || null })),
    subjects: (d.subject || []).slice(0, 15),
    formats,
    identifiers: ids,
  });
}

const gb = safe('Google Books Search');
for (const it of ((gb && gb.items) || []).slice(0, 6)) {
  const v = it.volumeInfo || {};
  const a = it.accessInfo || {};
  if (!v.title || !relevant(v.title, v.authors) || ADAPTATION.test(v.title + ' ' + (v.subtitle || '')) || !(v.authors || []).length)
    continue;
  const ids = [{ kind: 'google', value: it.id }];
  for (const x of v.industryIdentifiers || []) {
    if (x.type === 'ISBN_13')
      ids.push({ kind: 'isbn13', value: x.identifier });
    if (x.type === 'ISBN_10')
      ids.push({ kind: 'isbn10', value: x.identifier });
  }
  const formats = [];
  if (a.publicDomain) {
    if (a.epub && a.epub.downloadLink)
      formats.push({ format: 'epub', url: https(a.epub.downloadLink), source: 'google-books' });
    if (a.pdf && a.pdf.downloadLink)
      formats.push({ format: 'pdf', url: https(a.pdf.downloadLink), source: 'google-books' });
    if (a.webReaderLink)
      formats.push({ format: 'html', url: https(a.webReaderLink), source: 'google-books' });
  }
  const year = parseInt(String(v.publishedDate || '').slice(0, 4), 10);
  docs.push({
    source: 'google-books',
    title: cleanTitle(v.title),
    subtitle: v.subtitle || null,
    description: clean(v.description),
    firstPublishedYear: Number.isFinite(year) ? year : null,
    languages: v.language ? [v.language] : [],
    coverUrl: v.imageLinks ? https(v.imageLinks.thumbnail || v.imageLinks.smallThumbnail) : null,
    isPublicDomain: !!a.publicDomain,
    popularity: popularity(v.ratingsCount, 90),
    authors: (v.authors || []).map(name => ({ name })),
    subjects: v.categories || [],
    formats,
    identifiers: ids,
  });
}

const cr = safe('CrossRef Lookup');
for (const w of ((cr && cr.message && cr.message.items) || [])) {
  if (!['book', 'monograph', 'edited-book', 'reference-book'].includes(w.type))
    continue;
  const t = baseTitle((w.title || [])[0]);
  const match = docs.find(d => baseTitle(d.title) === t);
  if (match && w.DOI)
    match.identifiers.push({ kind: 'doi', value: String(w.DOI).toLowerCase() });
}

return output(docs);
