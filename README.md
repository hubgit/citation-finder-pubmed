Splits a block of text (e.g. copied from the bibliography section of a PDF article) into separate citations, sends each one to [a citation parser](https://github.com/hubgit/citation-parser), builds a PubMed search and displays the resulting citation.

Each extracted citation and PubMed query can be edited manually, if the citation is not matched automatically.

The app is built using [Backbone.js](http://backbonejs.org/), so each citation has a Citation model and a Citation view. All of the behaviour is in the view, the styles are in the CSS folder, and the Handlebars HTML template is in index.html.