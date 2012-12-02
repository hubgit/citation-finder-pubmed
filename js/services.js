var Service = function() {};

Service.prototype.get = function(options) {
	options = $.extend({ cache: true }, options);
	options.data = $.extend({}, this.defaults, options.data);

	var method = options.queue ? $.ajaxQueue : $.ajax;
	return method(options);
};

var PubMed = function(options) {
	this.defaults = $.extend({}, options);

	this.url = $("link[rel='service.pubmed']").attr("href");

	this.search = function(term) {
		var data = {
			db: "pubmed",
			usehistory: "n",
			retmax: 1,
			term: term,
			dataType: "xml",
			retmode: "xml"
		};

		return this.get({ url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", data: data });
	};

	this.fetch = function(id) {
		var data = {
			db: "pubmed",
			id: id,
			retmode: "xml"
		};

		return this.get({
			url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
			data: data,
			dataType: "xml",
		});
	};

	this.parse = function(doc) {
		var items = Jath.parse(itemTemplate, doc);

		if (items.length) {
			return $.map(items, function(item) {
				item.title = item.title.replace(/\.$/, "");

				return item;
			});
		}
	};

	var itemTemplate = [
		"eSummaryResult/DocSum",
		{
			pmid: "Item[@Name='ArticleIds']/Item[@Name='pubmed']",
			doi: "Item[@Name='ArticleIds']/Item[@Name='doi']",
			title: "Item[@Name='Title']",
			creator: [
				"Item[@Name='AuthorList']/Item[@Name='Author']",
				{ name: "." }
			],
			journal: "Item[@Name='Source']",
			citation: "Item[@Name='SO']",
		}
	];
};

PubMed.prototype = new Service();