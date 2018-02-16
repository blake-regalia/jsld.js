/* eslint-disable */
const serializer = require('../main/serializer.js');

@ // possible mode types for this file are:
@ // NT: N-Triples
@ // NQ: N-Quads

class @{FORMAT}_serializer extends serializer.human {
	constructor(h_config) {
		super(h_config, serializer.triples);

		// n3 methods
		this.n3_node = this.n3_node_verbose;
	}

	get comment() {
		return this.hash_comment;
	}

	blank_line() {
		this.push('\n');
	}

	from_term(h_term) {
		return h_term.verbose();
	}

	data(k_leaf, s_object) {
		@if QUADS
			let k_parent = k_leaf.parent;
			this.push(`${k_parent.term} ${k_leaf.term} ${s_object} ${k_parent.parent.term} .\n`);
		@else
			this.push(`${k_leaf.parent.term} ${k_leaf.term} ${s_object} .\n`);
		@end
	}

	close() {
		this.push(null);
	}
};

module.exports = function(h_config) {
	return new @{FORMAT}_serializer(h_config);
};