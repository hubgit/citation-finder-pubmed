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
		return this;
	},

	action: function(event) {
		event.preventDefault();
		event.stopPropagation();

		var $node = $(event.currentTarget);
		var action = $node.data("action");

		var model = this.model;

		switch (action) {
			case "parse":
				var input = this.$("textarea[property=text]");
				this.parse(input.val()).done(function(data) {
					console.log(data);
					data.authorsList = data.authors.join("; ");

					var query = [];

					if (data.authors.length) {
						var authorsQuery = data.authors.join("[AU] AND ") + "[AU]";
						query.push(authorsQuery);
					}

					if (data.title) query.push(data.title.replace(/(\w+)/g, " $1") + "[TA]");

					if (data.year) query.push(data.year + "[DP]");
					if (data.volume) query.push(data.volume + "[VI]");

					data.query = query.join(" AND ");

					model.set({ parsed: data });
				});
			break;

			case "search":
				var input = this.$("textarea[property=query]");
				this.search(input.val());
			break;
		}
	},

	parse: function(text) {
		console.log(text);
		return $.ajax({
			url: "http://www.hubmed.org/citation-min.cgi",
			data: { text: text },
		})
	},

	search: function(text) {
		console.log(text);

		var model = this.model;

		app.services.pubmed.search(text).done(function(doc) {
			var data = {
				Count: document.evaluate("/eSearchResult/Count", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
				WebEnv: document.evaluate("/eSearchResult/WebEnv", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent,
				QueryKey: document.evaluate("/eSearchResult/QueryKey", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent
			};

			console.log(data);

			if (!data.Count) return;

			app.services.pubmed.history(data).done(function(data) {
				console.log(data);
				model.set({ article: data.items[0] });
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
		this.collection.forEach(this.add, this);
	},

	add: function(model) {
		var view = new Views.Citation({ model: model });
		this.$el.append(view.render().$el);
	},

	render: function() {
		//var html = Templates.Citations();
		//this.$el.empty().append(html);
		this.$("textarea").expandingTextarea();
	},
});

Views.Input = Backbone.View.extend({
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
		"submit": "splitCitations"
	},

	splitCitations: function(event) {
		event.preventDefault();

		var $node = $(event.currentTarget);

		var text = this.$("textarea").val();
		text = $.trim(text);

		if (text.match(/^(\d){1,3}\.\s/)) {
			text = text.replace(/\n((\d){1,3}\.\s)/ig, "-split-$1"); // numbered list with dot
		}
		else if (text.match(/^(\d){1,3}\s/)) {
			text = text.replace(/\n((\d){1,3}\s)/ig, "-split-$1"); // numbered list without dot
		}
		else if (text.match(/^\[(\d){1,3}\]\s/)) {
			text = text.replace(/\n(\[(\d){1,3}\]\s)/ig, "-split-$1"); // numbered list with square brackets
		}
	    else if (text.match(/^\# /)) {
			text = text.replace(/\n(\#\s)/ig, "-split-$1"); // numbered list with square brackets
		}
		else if (text.match(/(\d\.?).\n/)) {
			text = text.replace(/(\d\.?).\n/ig, "$1-split-"); // numbered list
		}
		else {
			text = text.replace(/\n/ig, "-split-"); // numbered list
		}

		text = text.replace(/\s+/, " ");

		var items = [];

		text.split(/-split-/g).forEach(function(item) {
			if(item.length) items.push({ text: item });
		});

		console.log(items);
		app.collections.citations.reset(items);
	}
});