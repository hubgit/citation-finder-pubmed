var Service = function() {};

Service.prototype.get = function(options) {
	options = $.extend({ cache: true }, options);
	options.data = $.extend({}, this.defaults, options.data);

	var method = options.queue ? $.ajaxQueue : $.ajax;
	return method(options);
};

var PubMed = function(options) {
	this.defaults = $.extend({}, options);

	this.search = function(term) {
		var data = {
			db: "pubmed",
			usehistory: "n",
			retmax: 1,
			term: term
		};

		return this.get({ url: "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", data: data });
	};

	this.fetch = function(data) {
		return this.get({ url: this.url, data: data });
	};
};

PubMed.prototype = new Service();