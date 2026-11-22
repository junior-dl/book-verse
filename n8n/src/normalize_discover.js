const page = safe('Gutendex Page');
const docs = ((page && page.results) || []).map(fromGutendex);
return output(docs);
