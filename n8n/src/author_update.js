const job = $('Loop Jobs').first().json;
const p = job.payload || {};
const target = norm(p.name);
const ol = safe('Open Library Author');
const wiki = safe('Wikipedia Summary');
const oa = ((ol && ol.docs) || []).find(d => norm(d.name) === target) || null;
const year = s => {
  const m = String(s || '').match(/\d{3,4}/);
  return m ? Number(m[0]) : null;
};
const literary = /(writer|novelist|poet|author|playwright|dramatist|philosopher|essayist|journalist|historian|scientist|critic|translator|theologian|naturalist|economist)/i;
let bio = '';
let photo = null;
if (wiki && wiki.type === 'standard' && literary.test((wiki.description || '') + ' ' + String(wiki.extract || '').slice(0, 400))) {
  bio = wiki.extract || '';
  photo = (wiki.thumbnail && wiki.thumbnail.source) || null;
}
const update = {
  authorId: p.authorId,
  bio: bio.slice(0, 2000),
  photoUrl: photo,
  olKey: oa ? oa.key : null,
  birthYear: oa ? year(oa.birth_date) : null,
  deathYear: oa ? year(oa.death_date) : null,
};
return [{ json: { update: JSON.stringify(update).split('$bv$').join('') } }];
