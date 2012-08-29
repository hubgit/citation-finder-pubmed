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
		console.log(data);
		var html = Templates.Citation(data);

		this.$el.empty().append(html);
		this.$("[property=creators]").formatAuthors(5, "creator");
		this.$("button").addClass("btn");
		//this.$("textarea").expandingTextarea();
		return this;
	},

	action: function(event) {
		event.preventDefault();
		event.stopPropagation();

		var node = $(event.currentTarget);
		var action = node.data("action");

		var model = this.model;

		switch (action) {
			case "parse":
				node.html("parsing&hellip;");
				var input = this.$("textarea[property=text]");
				this.parse(input.val()).done(function(data) {
					node.html("parse");
					model.set("parsed", data);
				});
			break;

			case "search":
				node.html("searching&hellip;");
				var input = this.$("textarea[property=query]");
				this.search(input.val()).done(function() {
					node.html("search");
				});
			break;
		}
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
				var data = {
					Count: document.evaluate("/eSearchResult/Count", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
					Id: document.evaluate("/eSearchResult/IdList/Id", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
				};

				if (!data.Count) return;

				app.services.pubmed.fetch({ id: data.Id }).done(function(data) {
					model.set({ article: data[0] });
					dfd.resolve();
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
		//this.render();
	},

	reset: function() {
		this.$el.empty();
		console.log(this.collection);
		this.collection.forEach(this.add, this);
	},

	add: function(model) {
		var view = new Views.Citation({ model: model });
		this.$el.append(view.render().$el);
	},

	render: function() {
		//var html = Templates.Citations();
		//this.$el.empty().append(html);
		//this.$("textarea").expandingTextarea();
	},
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