var Views = {};

Views.Citation = Backbone.View.extend({
	tagName: "li",

	className: "citation",

	events: {
		"click [data-action]": "action"
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
		//this.$("textarea").expandingTextarea();

		if (!this.model.get("parsed")) {
			this.runParse();
		}

		return this;
	},

	action: function(event) {
		event.preventDefault();
		event.stopPropagation();

		var action = $(event.currentTarget).data("action");

		switch (action) {
			case "parse":
				this.runParse();
			break;

			case "search":
				this.runSearch();
			break;
		}
	},

	runParse: function() {
		var model = this.model;
		var view = this;

		var node = this.$("[data-action=parse]");
		node.html("parsing&hellip;");

		var query = this.$("textarea[property=text]").val();

		this.parse(query)
			.done(function(data) {
				node.html("parse");
				model.set({ parsed: data, article: null });
				view.runSearch();
			})
			.fail(function(data) {
				node.html("parse");
			});
	},

	runSearch: function() {
		var node = this.$("[data-action=search]");
		node.html("searching&hellip;");

		var model = this.model;

		var query = this.$("textarea[property=query]").val();

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

	parse: function(text) {
		return $.ajaxQueue({
			url: "http://www.hubmed.org/citation-min.cgi",
			data: { text: text },
		})
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

				app.services.pubmed.fetch({ id: id.textContent }).done(function(data) {
					dfd.resolve(data[0]);
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
		//this.$("textarea").expandingTextarea();
	},

	events: {
		"submit": "splitCitations"
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
			text = text.replace(/(\n|^)\#\s/g, "-split-"); // numbered list with square brackets
		}
		else if (text.match(/\d\.?.\n/)) {
			text = text.replace(/\d\.?.\n/g, "-split-"); // numbered list
		}
		else {
			text = text.replace(/\n/g, "-split-"); // numbered list
		}

		text = text.replace(/\s+/, " ");

		var items = [];

		text.split(/-split-/g).forEach(function(item) {
			item = $.trim(item);

			if (item.length) {
				items.push({ text: item });
			}
		});

		app.collections.citations.reset(items);
	}
});