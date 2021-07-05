/* eslint indent: 0, padded-blocks: 0 */
import chai from 'chai';
const expect = chai.expect;

import stream from 'readable-stream';

import w3c_rdf_specification from '../interface/w3c-rdf-specification.mjs';
import graphy_reader_interface from '../interface/content-reader.mjs';

import util from './util.mjs';

const R_WANTS_PREFIX = /^\s*[(:_[]/;

export class ReaderSuite {
	constructor(gc_suite, f_suite) {
		let s_prefix_string = '';
		if(gc_suite.prefixes) {
			const h_prefixes = gc_suite.prefixes;
			for(const [s_prefix_id, p_iri] of Object.entries(h_prefixes)) {
				s_prefix_string += `@prefix ${s_prefix_id}: <${p_iri}> .\n`;
			}
		}

		this._f_reader = (...a_args) => gc_suite.reader.run(...a_args);
		this._dc_reader = gc_suite.reader;
		this._s_prefix_string = s_prefix_string;
		this._si_module = 'content';
		this._si_class = `${gc_suite.syntax}Reader`;
		this._si_export = `@graphy/${this._si_module}:${this._si_class}`;
		this._gc_suite = gc_suite;

		describe(this._si_export, () => {
			f_suite(this);
		});
	}

	errors(h_tree) {
		describe('emits read error for:', () => {
			util.map_tree(h_tree, (s_label, f_leaf) => {
				// destructure leaf node
				const {
					input: st_input,
					config: gc_read={},
					char: s_char=null,
					string: s_string=null,
					state: s_err_state=null,
					debug: b_debug=false,
				} = f_leaf();

				it(s_label, (fke_test) => {

					// feed input one character at a time
					this._f_reader(stream.Readable.from([...st_input]), {
						debug: b_debug,
						...gc_read,

						// ignore data events
						data() {},

						// expect error
						error(e_parse) {
							expect(e_parse).to.be.an('error');
							if(s_char) {
								let s_match = 'Failed to parse a valid token';

								if('\n' === s_char) {
									s_match = 'line feed character';
								}

								expect(e_parse.message).to.have.string(s_match);
								if(s_err_state) {
									expect(/Expected (\w+)/.exec(e_parse.message)[1]).to.equal(s_err_state);
								}
							}
							else if(s_string) {
								expect(e_parse.message).to.have.string(s_string);
							}
							fke_test();
						},

						// watch for eof
						eof() {
							debugger; st_input;  // for debugging
							fke_test(new Error('should have caught an error'));
						},
					}).catch(() => {});
				});
			});
		});
	}

	allows(h_tree) {
		const g_modes = {
			'validation enabled (not tolerant)': {
				tolerant: false,
			},
			'validation disabled (tolerant)': {
				tolerant: true,
			}, 
		};

		for(const [s_mode, gc_read] of Object.entries(g_modes)) {
			describe(s_mode, () => {
				util.map_tree(h_tree, (s_label, f_leaf) => {
					// destructure leaf node
					let [st_input, a_validate, b_debug=false] = f_leaf();

					// input wants prefixes
					if(this._s_prefix_string && R_WANTS_PREFIX.test(st_input)) {
						st_input = this._s_prefix_string+st_input;
					}

					// create test case
					it(s_label, (fke_test) => {
						const a_quads = [];

						// feed input one character at a time
						this._f_reader(stream.Readable.from([...st_input]), {
							debug: b_debug,
							...gc_read,

							// watch for errors
							error(e_read) {
								fke_test(e_read);
							},

							// expect data
							data(g_quad) {
								a_quads.push(g_quad);
							},

							// wait for end
							eof() {
								util.validate_quads(a_quads, a_validate);
								fke_test();
							},
						});
					});
				});
			});
		}
	}

	interfaces(f_interface) {  // eslint-disable-line class-methods-use-this
		describe('graphy reader interface', () => {
			f_interface(graphy_reader_interface);
		});
	}

	specification() {
		describe('w3c rdf specification', async() => {
			await w3c_rdf_specification({
				package: `content.${this._gc_suite.alias}.read`,
				reader: this._f_reader,
				reader_class: this._dc_reader,
				export: this._si_export,
				manifest: this._gc_suite.manifest,
			});
		});
	}
}

export default ReaderSuite;
