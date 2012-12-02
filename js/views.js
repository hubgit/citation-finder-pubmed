var Views = {};

Views.Citation = Backbone.View.extend({
	tagName: "li",

	className: "citation",

	events: {
		"submit form": "runSearch"
	},

	initialize: function() {
		this.render();
		this.model.on("change", this.render, this);
	},

	render: function() {
		var data = this.model.toJSON();
		var html = Templates.Citation(data);

		this.$el.empty().append(html);
		this.$("[property=creators]").formatAuthors(5, "creator");
		this.$("button").addClass("btn");

		return this;
	},

	runSearch: function(event) {
		event.preventDefault();

		var model = this.model;
		model.set("article", null);

		var node = this.$("[data-action=search]");
		node.html("searching&hellip;");

		var query = model.get("text");

		this.search(query)
			.done(function(data) {
				node.html("search");
				model.set("article",  data);
			})
			.fail(function() {
				node.html("search");
				model.set("article",  null);
			});
	},

	search: function(text) {
		var model = this.model;

		return $.Deferred(function(dfd) {
			app.services.pubmed.search(text).done(function(doc) {
				var id = document.evaluate("/eSearchResult/IdList/Id", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				if (!id) {
					dfd.reject();
					return dfd.promise();
				}

				app.services.pubmed.fetch(id.textContent).done(function(data) {
					var items = app.services.pubmed.parse(data);
					dfd.resolve(items[0]);
					return dfd.promise();
				});
			});
		});
	},
});

Views.Citations = Backbone.View.extend({
	tagName: "ol",

	initialize: function() {
		this.collection.on("reset", this.reset, this);
		this.collection.on("add", this.add, this);
	},

	reset: function() {
		this.$el.empty();
		this.collection.forEach(this.add, this);
	},

	add: function(model) {
		var view = new Views.Citation({ model: model });
		this.$el.append(view.render().$el);
	}
});

Views.Input = Backbone.View.extend({
	id: "input",
	tagName: "form",

	initialize: function() {
		this.render();
	},

	render: function() {
		var html = Templates.Input();
		this.$el.empty().append(html);
		this.$("textarea").expandingTextarea();
	},

	events: {
		"submit": "splitCitations",
	},

	splitCitations: function(event) {
		event.preventDefault();

		var $node = $(event.currentTarget);

		var text = this.$("textarea").val();
		text = $.trim(text);

		if (text.match(/^\d{1,3}\.\s/)) {
			text = text.replace(/(\n|^)\d{1,3}\.\s/g, "-split-"); // numbered list with dot
		}
		else if (text.match(/^\d{1,3}\s/)) {
			text = text.replace(/(\n|^)\d{1,3}\s/g, "-split-"); // numbered list without dot
		}
		else if (text.match(/^\[\d{1,3}\]\s/)) {
			text = text.replace(/(\n|^)\[\d{1,3}\]\s/g, "-split-"); // numbered list with square brackets
		}
		else if (text.match(/^\# /)) {
			text = text.replace(/(\n|^)\#\s/g, "-split-"); // un-numbered list with hash
		}
		else if (text.match(/\d\.?.\n/)) {
			text = text.replace(/\d\.?.\n/g, "-split-"); // numbered list
		}
		else {
			text = text.replace(/\n/g, "-split-"); // un-numbered list
		}

		text = text.replace(/\s+/, " ");

		var items = [];

		text.split(/-split-/g).forEach(function(item) {
			item = item.replace(/[\n\r]+/g, " ");
			item = $.trim(item);
			item = item.replace(/\.$/, "");
			item = item.replace(/(\d+)\s*[-–]\s*(\d+)$/, "$1-$2"); // remove extra spaces in pagination

			if (item.length) {
				items.push({ text: item });
			}
		});

		app.collections.citations.reset(items);

		app.views.citations.$("button[data-action=search]").click();

		app.views.download.$el.show();
	}
});

Views.Download = Backbone.View.extend({
	events: {
		"click #download-all button": "downloadAll"
	},

	initialize: function() {
		this.render();
	},

	render: function() {
		this.$el.html(Templates.Download());
	},

	downloadAll: function(event) {
		var button = $(event.target);

		var pmids = $("article[data-pmid]").map(function() {
			return $(this).data("pmid");
		});

		var params = {
			format: button.data("format"),
			id: pmids.toArray().join(",")
		};

		window.location.href  = "http://pubmed.macropus.org/articles/?" + $.param(params);
	},
});