var app = {};

$.ajaxSetup({
    cache: false
});

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
		input: new Views.Input({ model: app.models.input }),
		citations: new Views.Citations({ collection: app.collections.citations }),
	};

	app.views.input.$el.appendTo("body");
	app.views.citations.$el.appendTo("body");

	//app.views.input.$("form").submit();
};

$(init);