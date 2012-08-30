$.ajaxSetup({ cache: false });

var app = {};

var init = function() {
	app.services = {
		pubmed: new PubMed({ queue: true }),
	};

	app.models = {
		input: new Models.Input,
	};

	app.collections = {
		citations: new Collections.Citations({ model: Models.Citation }),
	};

	app.views = {
		input: new Views.Input({ model: app.models.input, id: "input" }),
		citations: new Views.Citations({ collection: app.collections.citations, id: "citations" }),
	};

	app.views.input.$el.appendTo("body");
	app.views.citations.$el.appendTo("body");
};

$(init);
