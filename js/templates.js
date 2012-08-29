var Templates = {};

$(function() {
    $("[data-template]").each(function loadTemplate() {
        var template = $(this);
        Templates[template.data("template")] = Handlebars.compile(template.html());
    });
});

Handlebars.registerHelper("pluralise", $.pluralise);

Handlebars.registerHelper("authorList", function(items) {
	return items.join("; ");
});

Handlebars.registerHelper("pubmedQuery", function(data) {
	var query = [];

	if (data.authors.length) {
		var authorsQuery = data.authors.join("[AU] AND ") + "[AU]";
		query.push(authorsQuery);
	}

	if (data.title) {
		query.push(data.title.replace(/(\w+)/g, " $1") + "[TA]");
	}

	if (data.year) {
		query.push(data.year + "[DP]");
	}

	if (data.volume) {
		query.push(data.volume + "[VI]");
	}

	return query.join(" AND ");
});