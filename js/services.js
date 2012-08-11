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
			usehistory: "y",
			retmax: 0,
			term: term
		};

		return this.get({ url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", data: data });
	};

	this.history = function(data) {
		data = { total: data.Count, history: data.WebEnv + "|" + data.QueryKey };
		return this.get({ url: this.url, data: data });
	};
};

PubMed.prototype = new Service();