import chai from 'chai';
const expect = chai.expect;

import crypto from 'crypto';

const hash = s => crypto.createHash('sha256').update(s).digest('base64');

import rdfjsDataModelTester from './rdfjs-data-model-test.js';

import util from '../helper/util.mjs';

const P_IRI_XSD = 'http://www.w3.org/2001/XMLSchema#';
const P_IRI_RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const P_IRI_RDFS = 'http://www.w3.org/2000/01/rdf-schema#';

function expect_original_replaced_equals(kt_original, kt_replaced, b_equals) {
	expect(kt_replaced).to.not.equal(kt_original);
	expect(kt_replaced.equals(kt_original)).to.equal(b_equals);
	expect(kt_original.equals(kt_replaced)).to.equal(b_equals);
}

const F_REPLACER_NOOP = () => [];

function test_replacements(g_reps) {
	const {
		input: kt_test,
		validate: f_validator,
		identity: f_identity,
		replace: h_replacers={},
		map: h_map,
	} = g_reps;

	for(const s_which in h_map) {
		const g_actions = h_map[s_which];

		const s_method = `replace${s_which[0].toUpperCase()+s_which.slice(1)}`;

		for(const s_action in g_actions) {
			const a_tests = g_actions[s_action];
			const b_clone = 'clones' === s_action;

			for(const a_args of a_tests) {
				it(`#${s_method}(${a_args.map(z => 'string' === typeof z? '"'+z+'"': z+'').join(', ')})`, () => {
					const kt_replaced = kt_test[s_method](...a_args);
					f_validator(kt_replaced, ...(b_clone? f_identity(): (h_replacers[s_which] || F_REPLACER_NOOP)(...a_args)));
					expect_original_replaced_equals(kt_test, kt_replaced, b_clone);
				});
			}
		}
	}
}

const H_PREFIXES = {
	'': '#',
	test: 'test#',
	test_: 'test_#',
	xsd: P_IRI_XSD,
	rdf: P_IRI_RDF,
	rdfs: P_IRI_RDFS,
};

const G_PROPERTIES_GRAPHY_TERM_GENERAL = {
	isAbleGraph: false,
	isAbleSubject: false,
	isAblePredicate: false,
	isAbleObject: false,
	isAbleDatatype: false,

	isGraphyTerm: true,
	isGraphyQuad: false,
	isDefaultGraph: false,
	isNode: false,
	isBlankNode: false,
	isLiteral: false,
};

const G_PROPERTIES_GRAPHY_TERM_NOT_NODE = {
	isNamedNode: false,
	isAbsoluteIri: false,
	isRelativeIri: false,
	isRdfTypeAlias: false,
	isAnonymousBlankNode: false,
	isEphemeralBlankNode: false,
};

const G_PROPERTIES_GRAPHY_TERM_NOT_LITERAL = {
	isLanguagedLiteral: false,
	isDatatypedLiteral: false,
	isSimpleLiteral: false,
	isNumericLiteral: false,
	isIntegerLiteral: false,
	isDoubleLiteral: false,
	isDecimalLiteral: false,
	isBooleanLiteral: false,
	isInfiniteLiteral: false,
	isNaNLiteral: false,
};

const G_PROPERTIES_GRAPHY_TERM_ALL = {
	...G_PROPERTIES_GRAPHY_TERM_GENERAL,
	...G_PROPERTIES_GRAPHY_TERM_NOT_NODE,
	...G_PROPERTIES_GRAPHY_TERM_NOT_LITERAL,
};


const H_VALIDATORS = {
	defaultGraph(kt_actual) {
		expect(kt_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_ALL,
			isAbleGraph: true,
			isDefaultGraph: true,
			termType: 'DefaultGraph',
			value: '',
		});
	},

	term(kt_actual) {
		expect(kt_actual.equals).to.be.a('function');
		expect(kt_actual.equals()).to.be.false;
		expect(kt_actual.concise).to.be.a('function');
		expect(kt_actual.concise()).to.be.a('string');
		expect(kt_actual.terse).to.be.a('function');
		expect(kt_actual.terse()).to.be.a('string');
		expect(kt_actual.star).to.be.a('function');
		expect(kt_actual.verbose).to.be.a('function');
		expect(kt_actual.isolate).to.be.a('function');
		expect(kt_actual.hash).to.be.a('function');
		expect(kt_actual.replaceIri).to.be.a('function');
		expect(kt_actual.replaceText).to.be.a('function');
		expect(kt_actual.replaceValue).to.be.a('function');
	},

	blankNode(kt_actual, s_label=null, b_anonymous=false, b_ephemeral=false) {
		expect(kt_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_ALL,
			isAbleGraph: true,
			isAbleSubject: true,
			isAbleObject: true,
			isNode: true,
			isBlankNode: true,
			isAnonymousBlankNode: b_anonymous,
			isEphemeralBlankNode: b_ephemeral,
			termType: 'BlankNode',
		});

		// validate value
		if(null !== s_label) {
			expect(kt_actual.value).to.equal(s_label);
		}

		// // validate anonymous-ness
		// if(null !== b_anonymous) {
		// 	expect(kt_actual.isAnonymous).to.equal(b_anonymous);
		// }
	},

	namedNode(kt_actual, w_desc=null) {
		let p_value = w_desc;
		let b_relative = false;
		if('object' === typeof w_desc && null !== w_desc) {
			p_value = w_desc.value;
			if('type_alias' in w_desc) expect(kt_actual.isRdfTypeAlias).to.equal(w_desc.type_alias);
			b_relative = w_desc.relative || false;
		}
		else if(P_IRI_RDF+'type' !== kt_actual.value) {
			expect(kt_actual.isRdfTypeAlias).to.be.false;
		}

		const g_include = {
			...G_PROPERTIES_GRAPHY_TERM_ALL,
		};

		delete g_include.isRdfTypeAlias;

		expect(kt_actual).to.include({
			...g_include,
			isAbleGraph: true,
			isAbleSubject: true,
			isAblePredicate: true,
			isAbleObject: true,
			isAbleDatatype: true,
			isNode: true,
			isNamedNode: true,
			isAbsoluteIri: !b_relative,
			isRelativeIri: b_relative,
			termType: 'NamedNode',
		});

		// validate value
		expect(kt_actual.value).to.equal(null === p_value? P_IRI_XSD+'string': p_value);
	},

	literal(kt_actual, g_descriptor={}, s_eval=null) {
		if(s_eval) return H_VALIDATORS[s_eval](kt_actual, g_descriptor);

		// abides general term and literal specifics
		expect(kt_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_GENERAL,
			...G_PROPERTIES_GRAPHY_TERM_NOT_NODE,
			isAbleObject: true,
			isLiteral: true,
			isDatatypedLiteral: 'datatype' in g_descriptor && (P_IRI_XSD+'string') !== g_descriptor.datatype,
			isLanguagedLiteral: !!g_descriptor.language,
			isSimpleLiteral: !g_descriptor.language && (!('datatype' in g_descriptor) || (P_IRI_XSD+'string') === g_descriptor.datatype),
			termType: 'Literal',
			language: g_descriptor.language || '',
		}).and.have.property('datatype');

		expect(kt_actual.boolean).to.be.NaN;
		expect(kt_actual.number).to.be.NaN;
		expect(kt_actual.bigint).to.be.NaN;

		// validate value
		if('value' in g_descriptor) {
			expect(kt_actual.value).to.equal(g_descriptor.value);
		}

		// check datatype
		H_VALIDATORS.namedNode(kt_actual.datatype, g_descriptor.language
			? P_IRI_RDF+'langString'
			: ('string' === typeof g_descriptor.datatype
				? g_descriptor.datatype
				: null));
	},

	integerLiteral(kt_actual, w_desc) {
		let xg_value;

		if('number' === typeof w_desc) {
			xg_value = BigInt(w_desc);
		}
		else if('bigint' === typeof w_desc) {
			xg_value = w_desc;
		}
		else if('string' === typeof w_desc) {
			xg_value = BigInt(w_desc);
		}

		if(xg_value > BigInt(Number.MAX_SAFE_INTEGER) || xg_value < BigInt(Number.MIN_SAFE_INTEGER)) {
			expect(kt_actual.number).to.be.NaN;
		}
		else {
			expect(kt_actual.number).to.equal(Number(xg_value));
		}

		// literal integer specifics
		expect(kt_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_ALL,
			isAbleObject: true,
			isLiteral: true,
			isDatatypedLiteral: true,
			isNumericLiteral: true,
			isIntegerLiteral: true,
			isNumberPrecise: true,
			termType: 'Literal',
			language: '',
			value: xg_value+'',
			bigint: xg_value,
		});

		// datatype
		H_VALIDATORS.namedNode(kt_actual.datatype, P_IRI_XSD+'integer');

		// boolean value
		expect(kt_actual.boolean, '.boolean').to.be.NaN;
	},

	doubleLiteral(kt_actual, z_value) {
		let x_value = z_value;
		let s_value = z_value+'';

		if('string' === typeof z_value) {
			if('INF' === z_value) {
				x_value = Infinity;
			}
			else if('-INF' === z_value) {
				x_value = -Infinity;
			}
			else {
				x_value = Number(z_value);
			}
		}

		let b_nan = false;
		let b_infinite = false;

		if(Number.isNaN(x_value)) {
			expect(kt_actual.number).to.be.NaN;
			b_nan = true;
		}
		else {
			expect(kt_actual.number).to.equal(x_value);

			if(!Number.isFinite(x_value)) {
				s_value = x_value > 0? 'INF': '-INF';
				b_infinite = true;
				x_value = +x_value;
			}
		}

		// literal double specifics
		expect(kt_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_ALL,
			isAbleObject: true,
			isLiteral: true,
			isDatatypedLiteral: true,
			isNumericLiteral: true,
			isNumberPrecise: !b_nan && !b_infinite,
			isDoubleLiteral: true,
			isNaNLiteral: b_nan,
			isInfiniteLiteral: b_infinite,
			termType: 'Literal',
			language: '',
			value: s_value,
		});

		// datatype
		H_VALIDATORS.namedNode(kt_actual.datatype, P_IRI_XSD+'double');

		expect(kt_actual.boolean, '.boolean').to.be.NaN;
		expect(kt_actual.bigint, '.bigint').to.be.NaN;
	},

	decimalLiteral(kt_actual, z_value) {
		let s_value = z_value+'';
		let x_value = +z_value;
		let b_precise = true;
		if('object' === typeof z_value) {
			s_value = z_value.value;
			x_value = +s_value;
			b_precise = z_value.precise;
		}

		// literal decimal specifics
		expect(kt_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_ALL,
			isAbleObject: true,
			isLiteral: true,
			isDatatypedLiteral: true,
			isNumericLiteral: true,
			isDecimalLiteral: true,
			isNumberPrecise: b_precise,
			termType: 'Literal',
			language: '',
			value: s_value,
			number: x_value,
		});

		// datatype
		H_VALIDATORS.namedNode(kt_actual.datatype, P_IRI_XSD+'decimal');

		expect(kt_actual.boolean, '.boolean').to.be.NaN;
		expect(kt_actual.bigint, '.bigint').to.be.NaN;
	},

	booleanLiteral(kt_actual, z_value) {
		let s_value = z_value+'';
		let b_value = z_value;

		if('number' === typeof z_value || 'bigint' === typeof z_value) {
			b_value = !!z_value;
			s_value = b_value? 'true': 'false';
		}
		else if('string' === typeof z_value) {
			if('true' === z_value) {
				b_value = true;
			}
			else if('false' === z_value) {
				b_value = false;
			}
			else {
				b_value = !!(+z_value);
			}
		}

		// literal boolean specifics
		expect(kt_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_ALL,
			isAbleObject: true,
			isLiteral: true,
			isDatatypedLiteral: true,
			isBooleanLiteral: true,
			isNumberPrecise: true,
			termType: 'Literal',
			language: '',
			value: s_value,
			boolean: b_value,
			number: b_value? 1: 0,
			bigint: b_value? 1n: 0n,
		});

		// datatype
		H_VALIDATORS.namedNode(kt_actual.datatype, P_IRI_XSD+'boolean');
	},

	numberLiteral(kt_actual, z_value, w_arg) {
		let s_type, w_value;
		if(Array.isArray(z_value)) {
			[s_type, w_value] = z_value;
		}
		else if('undefined' !== typeof w_arg) {
			s_type = z_value;
			w_value = w_arg;
		}
		else {
			throw new Error('invalid test case');
		}

		H_VALIDATORS[s_type](kt_actual, w_value);
	},

	dateLiteral(kt_actual, z_value) {
		// literal integer specifics
		expect(kt_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_ALL,
			isAbleObject: true,
			isLiteral: true,
			isDatatypedLiteral: true,
			isDateLiteral: true,
			isNumberPrecise: true,
			termType: 'Literal',
			language: '',
		});

		expect(kt_actual.date).to.be.an.instanceof(Date);

		if(z_value) {
			let s_value;
			let dt_value = z_value;

			if('string' === typeof z_value) {
				s_value = z_value;
				dt_value = new Date(s_value);
			}
			else {
				s_value = dt_value.toISOString().replace(/T.+$/, 'Z');
			}

			expect(kt_actual).to.include({
				value: s_value,
				number: dt_value.getTime(),
				bigint: BigInt(dt_value.getTime()),
			});

			expect(kt_actual.date.getTime()).to.equal(dt_value.getTime());
		}
		else {
			expect(kt_actual.value).to.be.a('string');
			expect(kt_actual.number).to.be.a('number');
			expect(kt_actual.bigint).to.be.a('bigint');
			expect(kt_actual.date.getTime()).to.be.a('number').that.is.not.NaN;
		}

		// datatype
		H_VALIDATORS.namedNode(kt_actual.datatype, P_IRI_XSD+'date');
	},

	dateTimeLiteral(kt_actual, z_value) {
		// literal integer specifics
		expect(kt_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_ALL,
			isAbleObject: true,
			isLiteral: true,
			isDatatypedLiteral: true,
			isDateTimeLiteral: true,
			isNumberPrecise: true,
			termType: 'Literal',
			language: '',
		});

		expect(kt_actual.date).to.be.an.instanceof(Date);

		if(z_value) {
			let s_value;
			let dt_value = z_value;

			if('string' === typeof z_value) {
				s_value = z_value;
				dt_value = new Date(s_value);
			}
			else {
				s_value = dt_value.toISOString();
			}

			expect(kt_actual).to.include({
				value: s_value,
				number: dt_value.getTime(),
				bigint: BigInt(dt_value.getTime()),
			});

			expect(kt_actual.date.getTime()).to.equal(dt_value.getTime());
		}
		else {
			expect(kt_actual.value).to.be.a('string');
			expect(kt_actual.number).to.be.a('number');
			expect(kt_actual.bigint).to.be.a('bigint');
			expect(kt_actual.date.getTime()).to.be.a('number').that.is.not.NaN;
		}

		// datatype
		H_VALIDATORS.namedNode(kt_actual.datatype, P_IRI_XSD+'dateTime');
	},

	variable(kt_actual, s_name) {
		// abides general term and literal specifics
		expect(kt_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_ALL,
			isVariable: true,
			termType: 'Variable',
			value: s_name,
		});
	},

	quad(kq_actual, g_validate) {
		expect(kq_actual.subject.equals(g_validate.subject)).to.be.true;
		expect(kq_actual.predicate.equals(g_validate.predicate)).to.be.true;
		expect(kq_actual.object.equals(g_validate.object)).to.be.true;
		expect(kq_actual.graph.equals(g_validate.graph || {termType:'DefaultGraph', value:''})).to.be.true;

		expect(kq_actual).to.include({
			...G_PROPERTIES_GRAPHY_TERM_ALL,
			isGraphyTerm: true,
			isGraphyQuad: true,
			isAbleSubject: true,
			isAblePredicate: false,
			isAbleObject: true,
			isAbleGraph: false,
			termType: 'Quad',
			value: '',
		});
	},
};

export default class FactorySuite {
	constructor(gc_suite) {
		this._si_export = gc_suite.export;
		this._k_factory = gc_suite.factory;
	}

	validate_c1(g_actions) {
		const k_factory = this._k_factory;
		for(const s_action in g_actions) {
			const z_action = g_actions[s_action];

			switch(s_action) {
				case 'throws': {
					const h_map = z_action;
					for(const s_group in h_map) {
						const a_tests = h_map[s_group];
						describe(s_group+' throws', () => {
							for(const s_title of a_tests) {
								it(s_title, () => {
									expect(() => k_factory.c1(s_title, H_PREFIXES)).to.throw(Error);
								});
							}
						});
					}
					break;
				}

				case 'returns': {
					const h_types = z_action;
					for(const s_type in h_types) {
						describe(s_type+' returns', () => {
							const h_cases = h_types[s_type];
							for(const s_title in h_cases) {
								const z_descriptor = h_cases[s_title];
								it(s_title, () => {
									if('function' === typeof z_descriptor) {
										z_descriptor();
									}
									else {
										H_VALIDATORS[s_type](k_factory.c1(s_title, H_PREFIXES), z_descriptor);
									}
								});
							}
						});
					}
					break;
				}

				default: {
					throw new Error(`invalid test case action: ${s_action}`);
				}
			}
		}
	}

	validate_factory(h_methods) {
		const k_factory = this._k_factory;
		for(const s_method in h_methods) {
			const g_actions = h_methods[s_method];

			for(const s_action in g_actions) {
				const h_cases = g_actions[s_action];
				describe(`factory.${s_method} ${s_action}`, () => {
					for(const s_title in h_cases) {
						const z_case = h_cases[s_title];

						it(s_title, () => {
							switch(s_action) {
								case 'throws': {
									expect(() => k_factory[s_method](z_case)).to.throw(Error);
									break;
								}

								case 'returns': {
									let w_arg, z_value;
									if(Array.isArray(z_case)) {
										[w_arg, z_value] = z_case;
									}
									else if('function' === typeof z_case) {
										z_case();
										return;
									}
									else {
										w_arg = z_value = z_case;
									}

									H_VALIDATORS[s_method](k_factory[s_method](w_arg), z_value, w_arg);
									break;
								}

								default: {
									throw new Error(`invalid test case action: ${s_action}`);
								}
							}
						});
					}
				});
			}
		}
	}

	run() {
		const k_factory = this._k_factory;

		describe(this._si_export, () => {
			describe('factory.literal', () => {
				it('w/o datatype', () => {
					H_VALIDATORS.literal(k_factory.literal('test'), {value:'test'});
				});

				it('with datatype', () => {
					const k_datatype = k_factory.namedNode('z://yes');
					H_VALIDATORS.literal(k_factory.literal('test', k_datatype), {value:'test', datatype:'z://yes'});
				});

				it('language', () => {
					H_VALIDATORS.literal(k_factory.literal('test', 'en'), {value:'test', language:'en'});
				});

				it('language w/ optional @', () => {
					H_VALIDATORS.literal(k_factory.literal('test', '@en'), {value:'test', language:'en'});
				});

				it('valueOf casts to canonical form', () => {
					expect(k_factory.literal('hello', 'en')+'').to.equal('@en"hello');
					expect(k_factory.literal('hello', k_factory.namedNode('greeting'))+'').to.equal('^>greeting"hello');
				});

				it('.verbose', () => {
					expect(k_factory.literal('hello', 'en').verbose()).to.equal('"hello"@en');
					expect(k_factory.literal('hello', k_factory.namedNode('z://greeting')).verbose()).to.equal('"hello"^^<z://greeting>');
				});

				it('.termType', () => {
					expect(k_factory.literal(''))
						.to.have.property('termType', 'Literal');
				});

				it('.isLiteral', () => {
					expect(k_factory.literal(''))
						.to.have.property('isLiteral', true);
				});
			});

			describe('non-literal consturctors', () => {
				this.validate_factory({
					blankNode: {
						throws: {
							true: true,
						},
					},
				});
			});

			describe('datatyped literal constructors', () => {
				this.validate_factory({
					integerLiteral: {
						throws: {
							'+Infinity': Infinity,
							'-Infinity': -Infinity,
							NaN: NaN,
							'non-integer': 0.1,
							true: true,
							false: false,
							null: null,
							undefined: undefined,  // eslint-disable-line no-undefined
							'empty string': '',
							'non-numeric string': 'hi',
							'invalid numeric string': '0  1',
							'numeric string: 0xff': '0xff',
							'numeric string: 0b101': '0b101',
						},
						returns: {
							0: 0,
							1: 1,
							'-1': -1,
							'Number.MAX_SAFE_INTEGER': Number.MAX_SAFE_INTEGER,
							'Number.MIN_SAFE_INTEGER': Number.MIN_SAFE_INTEGER,
							'numeric string: 0': ['0', 0],
							'numeric string: 1': ['1', 1],
							'numeric string: -1': ['-1', -1],
							'bigint: 0n': 0n,
							'bigint: 1n': 1n,
							'bigint: -1n': -1n,
							'bigint: Number.MAX_SAFE_INTEGER': BigInt(Number.MAX_SAFE_INTEGER),
							'bigint: Number.MIN_SAFE_INTEGER': BigInt(Number.MIN_SAFE_INTEGER),
							'bigint: Number.MAX_SAFE_INTEGER*2n': BigInt(Number.MAX_SAFE_INTEGER) * 2n,
							'bigint: Number.MIN_SAFE_INTEGER*2n': BigInt(Number.MIN_SAFE_INTEGER) * 2n,
						},
					},
					doubleLiteral: {
						throws: {
							true: true,
							false: false,
							null: null,
							undefined: undefined,  // eslint-disable-line no-undefined
							'empty string': '',
							'non-numeric string': 'hi',
							'invalid numeric string': '0  .1',
							'numeric string: 0xff': '0xff',
							'numeric string: 0b101': '0b101',
						},
						returns: {
							0: 0,
							1: 1,
							'-1': -1,
							0.1: 0.1,
							'-0.1': -0.1,
							'Number.MAX_SAFE_INTEGER': Number.MAX_SAFE_INTEGER,
							'Number.MIN_SAFE_INTEGER': Number.MIN_SAFE_INTEGER,
							'Number.MAX_VALUE': Number.MAX_VALUE,
							'Number.MIN_VALUE': Number.MIN_VALUE,
							'numeric string: 0': ['0', 0],
							'numeric string: 1': ['1', 1],
							'numeric string: -1': ['-1', -1],
							'numeric string: 0.1': ['0.1', 0.1],
							'numeric string: -0.1': ['-0.1', -0.1],
							'+Infinity': Infinity,
							'-Infinity': -Infinity,
							NaN: NaN,
						},
					},
					decimalLiteral: {
						throws: {
							'+Infinity': Infinity,
							'-Infinity': -Infinity,
							NaN: NaN,
							true: true,
							false: false,
							null: null,
							undefined: undefined,  // eslint-disable-line no-undefined
							'empty string': '',
							'non-numeric string': 'hi',
							'invalid numeric string': '0  .1',
							'numeric string: 0xff': '0xff',
							'numeric string: 0b101': '0b101',
							'Number.MAX_VALUE': Number.MAX_VALUE,
							'Number.MIN_VALUE': Number.MIN_VALUE,
						},
						returns: {
							0: 0,
							1: 1,
							'-1': -1,
							0.1: 0.1,
							'-0.1': -0.1,
							'Number.MAX_SAFE_INTEGER': Number.MAX_SAFE_INTEGER,
							'Number.MIN_SAFE_INTEGER': Number.MIN_SAFE_INTEGER,
							'numeric string: 0': ['0', 0],
							'numeric string: 1': ['1', 1],
							'numeric string: -1': ['-1', -1],
							'numeric string: 0.1': ['0.1', 0.1],
							'numeric string: -0.1': ['-0.1', -0.1],
						},
					},
					booleanLiteral: {
						throws: {
							'+Infinity': Infinity,
							'-Infinity': -Infinity,
							NaN: NaN,
							null: null,
							undefined: undefined,  // eslint-disable-line no-undefined
							'-1': -1,
							0.1: 0.1,
							'empty string': '',
							'non-boolean string': 'hi',
							'invalid boolean string': 'tRUE',
							'boolean string: True': 'True',
							'boolean string: False': 'False',
							'boolean string: TRUE': 'TRUE',
							'boolean string: FALSE': 'FALSE',
							2: 2,
							'2n': 2n,
							'{}': {},
						},
						returns: {
							true: true,
							false: false,
							0: [0, false],
							1: [1, true],
							'0n': [0n, false],
							'1n': [1n, true],
							'boolean string: true': 'true',
							'boolean string: false': 'false',
							'numeric string: 1': '1',
							'numeric string: 0': '0',
						},
					},
					numberLiteral: {
						throws: {
							null: null,
							undefined: undefined,  // eslint-disable-line no-undefined
							'empty string': '',
							'non-numeric string': 'hi',
							'invalid numeric string': '0  .1',
							'numeric string: 0xff': '0xff',
							'numeric string: 0b101': '0b101',
						},
						returns: {
							0: [0, 'integerLiteral'],
							1: [1, 'integerLiteral'],
							'-1': [-1, 'integerLiteral'],
							0.1: [0.1, 'doubleLiteral'],
							'-0.1': [-0.1, 'doubleLiteral'],
							'+Infinity': [Infinity, 'doubleLiteral'],
							'-Infinity': [-Infinity, 'doubleLiteral'],
							NaN: [NaN, 'doubleLiteral'],
							'Number.MAX_SAFE_INTEGER': [Number.MAX_SAFE_INTEGER, 'integerLiteral'],
							'Number.MIN_SAFE_INTEGER': [Number.MIN_SAFE_INTEGER, 'integerLiteral'],
							'Number.MAX_VALUE': [Number.MAX_VALUE, 'integerLiteral'],
							'Number.MIN_VALUE': [Number.MIN_VALUE, 'doubleLiteral'],
							'numeric string: 0': ['0', ['integerLiteral', 0]],
							'numeric string: 1': ['1', ['integerLiteral', 1]],
							'numeric string: -1': ['-1', ['integerLiteral', -1]],
							'numeric string: 0.1': ['0.1', ['decimalLiteral', 0.1]],
							'numeric string: -0.1': ['-0.1', ['decimalLiteral', -0.1]],
							'9007199254740993n': [9007199254740993n, 'integerLiteral'],
						},
					},
					dateLiteral: {
						throws: {
							'': '',
							'{}': {},
							'bad date': new Date('bad'),
						},
						returns: {
							now: new Date(),
						},
					},
					dateTimeLiteral: {
						throws: {
							'': '',
							'{}': {},
							'bad date': new Date('bad'),
						},
						returns: {
							now: new Date(),
						},
					},
					variable: {
						returns: {
							label: 'label',
						},
					},
				});
			});

			describe('factory.c1', () => {
				this.validate_c1({
					throws: {
						'datatype no contents': [
							'^xsd:integer',
							'^:integer',
							'^^>:integer',
							'^>#a',
						],
						'datatype no datatype': [
							'^"',
							'^"test',
						],
						'language no contents': [
							'@en',
							'@en-US',
						],
						'leading space': [
							' :abc',
							' _:abc',
							' ?abc',
							' "abc',
							' @en"abc',
							' ^xsd:d"abc',
						],
					},
					returns: {
						literal: {
							'"': {value:''},
							'"hi': {value:'hi'},
							'@"': {value:'', language:''},
							'@en"': {value:'', language:'en'},
							'@"hello': {value:'hello', language:''},
							'@en"hello': {value:'hello', language:'en'},
							'^>"': {value:'', datatype:''},
							'^>"test': {value:'test', datatype:''},
							'^>#a"': {value:'', datatype:'#a'},
							'^>#a"test': {value:'test', datatype:'#a'},
							'^:a"': {value:'', datatype:'#a'},
							'^:a"test': {value:'test', datatype:'#a'},
							'^xsd:integer"': {value:'', datatype:P_IRI_XSD+'integer'},
							'^xsd:boolean"never': {value:'never', datatype:P_IRI_XSD+'boolean'},
						},
						numberLiteral: {
							'^xsd:integer"10': ['integerLiteral', 10],
							'^xsd:integer"-10': ['integerLiteral', -10],
							[`^xsd:integer"${Number.MAX_SAFE_INTEGER}`]: ['integerLiteral', Number.MAX_SAFE_INTEGER],
							[`^xsd:integer"${Number.MIN_SAFE_INTEGER}`]: ['integerLiteral', Number.MIN_SAFE_INTEGER],
							[`^xsd:integer"${BigInt(Number.MAX_SAFE_INTEGER)*2n}`]: ['integerLiteral', BigInt(Number.MAX_SAFE_INTEGER)*2n],
							[`^xsd:integer"${BigInt(Number.MIN_SAFE_INTEGER)*2n}`]: ['integerLiteral', BigInt(Number.MIN_SAFE_INTEGER)*2n],
							'^xsd:double"5': ['doubleLiteral', 5],
							'^xsd:double"5.1': ['doubleLiteral', 5.1],
							'^xsd:double"INF': ['doubleLiteral', Infinity],
							'^xsd:double"-INF': ['doubleLiteral', -Infinity],
							'^xsd:double"NaN': ['doubleLiteral', NaN],
							'^xsd:decimal"5.1': ['decimalLiteral', 5.1],
							'^xsd:boolean"true': ['booleanLiteral', true],
							'^xsd:boolean"false': ['booleanLiteral', false],
						},
						namedNode: {
							'>': '',
							':': '#',
							'>#': '#',
							'>a': 'a',
							'>#a': '#a',
							':a': '#a',
							'>abc': 'abc',
							':abc': '#abc',
							'test:abc': 'test#abc',
							'test_:abc': 'test_#abc',
							a: {value:P_IRI_RDF+'type', type_alias:true},
						},
						blankNode: {
							'_:': () => {
								const kt_blank = k_factory.c1('_:');
								H_VALIDATORS.blankNode(kt_blank, null, true);
								expect(kt_blank.value).to.have.length('_fee893ce_d36a_4413_a197_a9f47a3e5991'.length);
							},
							'_:#anonymous': () => {
								const kt_blank = k_factory.c1('_:#anonymous');
								H_VALIDATORS.blankNode(kt_blank, null, true, true);
								expect(kt_blank.value).to.have.length('_fee893ce_d36a_4413_a197_a9f47a3e5991'.length);
							},
							'_:b': 'b',
							'_:b1': 'b1',
						},
						defaultGraph: {
							'*': '',
						},
						variable: {
							'?test': 'test',
						},
					},
				});
			});

			describe('factory.c3', () => {
				it('works', () => {
					util.validate_quads(k_factory.c3({
						'>a': {
							'>b': '>c',
							'>d': ['>e', '^>y"f'],
							'>g': ['>h', [
								'>i',
								'>j',
								'"k',
							]],
						},

						'>g': {
							'>h': '>i',
						},
					}), [
						['a', 'b', 'c'],
						['a', 'd', 'e'],
						['a', 'd', '^y"f'],
						['a', 'g', 'h'],
						['a', 'g', ' g0'],
						[' g0', '->', 'i'],
						[' g0', '>>', ' g1'],
						[' g1', '->', 'j'],
						[' g1', '>>', ' g2'],
						[' g2', '->', '"k'],
						[' g2', '>>', '.'],
						['g', 'h', 'i'],
					]);
				});

				it('works w/ prefix-mappings', () => {
					util.validate_quads(k_factory.c3({
						':a': {
							':b': ':c',
							':d': [':e', '^:y"f'],
							':g': [':h', [
								':i',
								':j',
								'"k',
							]],
						},

						'z:g': {
							'z:h': 'z:i',
						},
					}, {
						'': 'Z://',
						z: 'z://',
					}), [
						['Z://a', 'Z://b', 'Z://c'],
						['Z://a', 'Z://d', 'Z://e'],
						['Z://a', 'Z://d', '^Z://y"f'],
						['Z://a', 'Z://g', 'Z://h'],
						['Z://a', 'Z://g', ' g0'],
						[' g0', '->', 'Z://i'],
						[' g0', '>>', ' g1'],
						[' g1', '->', 'Z://j'],
						[' g1', '>>', ' g2'],
						[' g2', '->', '"k'],
						[' g2', '>>', '.'],
						['z://g', 'z://h', 'z://i'],
					]);
				});
			});

			describe('factory.c4', () => {
				it('works', () => {
					util.validate_quads(k_factory.c4({
						'*': {
							'>a': {
								'>b': '>c',
								'>d': ['>e', '^>y"f'],
								'>g': ['>h', [
									'>i',
									'>j',
									'"k',
								]],
							},
						},

						'>g': {
							'>h': {
								'>i': '>j',
							},
						},
					}), [
						['a', 'b', 'c', '*'],
						['a', 'd', 'e', '*'],
						['a', 'd', '^y"f', '*'],
						['a', 'g', 'h', '*'],
						['a', 'g', ' g0', '*'],
						[' g0', '->', 'i', '*'],
						[' g0', '>>', ' g1', '*'],
						[' g1', '->', 'j', '*'],
						[' g1', '>>', ' g2', '*'],
						[' g2', '->', '"k', '*'],
						[' g2', '>>', '.', '*'],
						['h', 'i', 'j', 'g'],
					]);
				});

				it('works w/ prefix-mappings', () => {
					util.validate_quads(k_factory.c4({
						'*': {
							':a': {
								':b': ':c',
								':d': [':e', '^:y"f'],
								':g': [':h', [
									':i',
									':j',
									'"k',
								]],
							},
						},

						'z:g': {
							'z:h': {
								'z:i': 'z:j',
							},
						},
					}, {
						'': 'Z://',
						z: 'z://',
					}), [
						['Z://a', 'Z://b', 'Z://c', '*'],
						['Z://a', 'Z://d', 'Z://e', '*'],
						['Z://a', 'Z://d', '^Z://y"f', '*'],
						['Z://a', 'Z://g', 'Z://h', '*'],
						['Z://a', 'Z://g', ' g0', '*'],
						[' g0', '->', 'Z://i', '*'],
						[' g0', '>>', ' g1', '*'],
						[' g1', '->', 'Z://j', '*'],
						[' g1', '>>', ' g2', '*'],
						[' g2', '->', '"k', '*'],
						[' g2', '>>', '.', '*'],
						['z://h', 'z://i', 'z://j', 'z://g'],
					]);
				});
			});

			describe('factory.comment()', () => {
				it('string matches pattern', () => {
					expect(k_factory.comment()).to.be.a('string')
						.that.matches(/^`\[[a-z0-9_]{36}\]\{"type":"comment"\}$/);
				});
			});

			describe('factory.newlines()', () => {
				it('string matches pattern', () => {
					expect(k_factory.newlines()).to.be.a('string')
						.that.matches(/^`\[[a-z0-9_]{36}\]\{"type":"newlines"\}$/);
				});
			});

			describe('factory.config()', () => {
				it('string matches pattern', () => {
					expect(k_factory.config('key')).to.be.a('string')
						.that.matches(/^`\[[a-z0-9_]{36}\]\{"type":"config"[":\w\s,{}[\]]*\}$/);
				});

				it('throws on invalid param', () => {
					expect(() => k_factory.config(0)).to.throw('string');
				});
			});

			describe('DefaultGraph', () => {
				const kt_graph = k_factory.defaultGraph();

				it('valid', () => {
					H_VALIDATORS.defaultGraph(kt_graph);
				});

				it('#clone()', () => {
					const kt_clone = kt_graph.clone();
					expect_original_replaced_equals(kt_graph, kt_clone, true);
					H_VALIDATORS.defaultGraph(kt_clone);
				});

				it('#equals(this)', () => {
					expect(kt_graph.equals(kt_graph)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_graph.equals(k_factory.defaultGraph())).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_graph.equals(kt_graph.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_graph.equals({
						termType: 'DefaultGraph',
						value: '',
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_graph.concise()).to.equal('*');
				});

				it('#concise({})', () => {
					expect(kt_graph.concise({})).to.equal('*');
				});

				it('#terse()', () => {
					expect(kt_graph.terse()).to.equal('');
				});

				it('#terse({})', () => {
					expect(kt_graph.terse({})).to.equal('');
				});

				it('#star()', () => {
					expect(kt_graph.star()).to.equal('');
				});

				it('#star({})', () => {
					expect(kt_graph.star({})).to.equal('');
				});

				it('#verbose()', () => {
					expect(kt_graph.verbose()).to.equal('');
				});

				it('#isolate()', () => {
					expect(kt_graph.isolate()).to.eql({
						termType: 'DefaultGraph',
						value: '',
					});
				});

				it('#hash()', () => {
					expect(kt_graph.hash()).to.equal(hash('*'));
				});


				test_replacements({
					input: kt_graph,
					validate: H_VALIDATORS.defaultGraph,
					identity: () => [],
					replace: {},
					map: {
						iri: {
							clones: [
								['*', ''],
								['', 'X'],
								[/./g, ''],
								[/./g, 'X'],
							],
						},
					},
				});
			});

			describe('NamedNode', () => {
				const p_iri_tests = 'https://graphy.link/tests#';
				const p_iri_node = p_iri_tests+'node';
				const kt_node = k_factory.namedNode(p_iri_node);
				const h_prefixes = {
					tests: p_iri_tests,
				};

				it('valid', () => {
					H_VALIDATORS.namedNode(kt_node, p_iri_node);
				});

				it('#clone()', () => {
					const kt_clone = kt_node.clone();
					expect_original_replaced_equals(kt_node, kt_clone, true);
					H_VALIDATORS.namedNode(kt_clone, p_iri_node);
				});

				it('replaced invalid \\u0009', () => {
					H_VALIDATORS.namedNode(k_factory.namedNode('z://y/\t'), 'z://y/\\u0009');
				});

				it('replaced invalid %hi', () => {
					H_VALIDATORS.namedNode(k_factory.namedNode('z://y/%hi'), 'z://y/\\u0025hi');
				});

				// it('replaced invalid \\UXXXXXXXX', () => {
				// 	H_VALIDATORS.namedNode(k_factory.namedNode('z://y/\u{00010420}'), 'z://y//\\U00010420');
				// });

				it('#equals(this)', () => {
					expect(kt_node.equals(kt_node)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_node.equals(k_factory.namedNode(p_iri_node))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_node.equals(kt_node.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_node.equals({
						termType: 'NamedNode',
						value: p_iri_node,
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_node.concise()).to.equal(`>${p_iri_node}`);
				});

				it('#concise(h_prefixes)', () => {
					expect(kt_node.concise(h_prefixes)).to.equal('tests:node');
				});

				it('#terse()', () => {
					expect(kt_node.terse()).to.equal(`<${p_iri_node}>`);
				});

				it('#terse(h_prefixes)', () => {
					expect(kt_node.terse(h_prefixes)).to.equal('tests:node');
				});

				it('#star()', () => {
					expect(kt_node.star()).to.equal(`<${p_iri_node}>`);
				});

				it('#star(h_prefixes)', () => {
					expect(kt_node.star(h_prefixes)).to.equal('tests:node');
				});

				it('#verbose()', () => {
					expect(kt_node.verbose()).to.equal(`<${p_iri_node}>`);
				});

				it('#isolate()', () => {
					expect(kt_node.isolate()).to.eql({
						termType: 'NamedNode',
						value: p_iri_node,
					});
				});

				it('#hash()', () => {
					expect(kt_node.hash()).to.equal(hash(`>${p_iri_node}`));
				});

				const f_replacer_iri = (w_search, w_replace) => [p_iri_node.replace(w_search, w_replace)];
				const g_replace_iri = {
					clones: [
						['absent', 'never'],
						[/absent/, 'never'],
					],
					replaces: [
						['tests', 'replaced'],
						[/tests/, 'replaced'],
						[/s/g, 'x'],
					],
				};

				test_replacements({
					input: kt_node,
					validate: H_VALIDATORS.namedNode,
					identity: () => [p_iri_node],
					replace: {
						iri: f_replacer_iri,
						value: f_replacer_iri,
					},
					map: {
						iri: g_replace_iri,
						value: g_replace_iri,
						text: {
							clones: [
								['tests', 'never'],
								[/tests/, 'never'],
								[/s/g, 'x'],
							],
						},
					},
				});
			});

			describe('Relative Iri', () => {
				const s_relative = '#banana';
				const kt_node = k_factory.namedNode(s_relative);
				const p_iri_base = 'https://graphy.link/base';
				const h_prefixes = k_factory.setBaseIri({}, p_iri_base);

				const h_prefixes_never = k_factory.setBaseIri({
					never: p_iri_base,
				}, p_iri_base);

				const h_prefixes_base = k_factory.setBaseIri({
					base: p_iri_base+'#',
				}, p_iri_base+'#');

				it('valid', () => {
					H_VALIDATORS.namedNode(kt_node, {value:s_relative, relative:true});
				});

				it('#clone()', () => {
					const kt_clone = kt_node.clone();
					expect_original_replaced_equals(kt_node, kt_clone, true);
					H_VALIDATORS.namedNode(kt_clone, {value:s_relative, relative:true});
				});

				it('#equals(this)', () => {
					expect(kt_node.equals(kt_node)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_node.equals(k_factory.namedNode(s_relative))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_node.equals(kt_node.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_node.equals({
						termType: 'NamedNode',
						value: s_relative,
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(() => kt_node.concise()).to.throw();
				});

				it('#concise({})', () => {
					expect(() => kt_node.concise({})).to.throw();
				});

				it('#concise(h_prefixes)', () => {
					expect(kt_node.concise(h_prefixes)).to.equal('>'+p_iri_base+s_relative);
				});

				it('#terse()', () => {
					expect(kt_node.terse()).to.equal('<'+s_relative+'>');
				});

				it('#terse({})', () => {
					expect(kt_node.terse({})).to.equal('<'+s_relative+'>');
				});

				it('#terse(h_prefixes)', () => {
					expect(kt_node.terse(h_prefixes)).to.equal('<'+s_relative+'>');
				});

				it('#terse(h_prefixes_never)', () => {
					expect(kt_node.terse(h_prefixes_never)).to.equal('<'+s_relative+'>');
				});

				it('#terse(h_prefixes_base)', () => {
					expect(k_factory.namedNode('banana').terse(h_prefixes_base)).to.equal('base:banana');
				});

				it('#star()', () => {
					expect(kt_node.star()).to.equal('<'+s_relative+'>');
				});

				it('#star({})', () => {
					expect(kt_node.star({})).to.equal('<'+s_relative+'>');
				});

				it('#star(h_prefixes)', () => {
					expect(kt_node.star(h_prefixes)).to.equal('<'+s_relative+'>');
				});

				it('#star(h_prefixes_base)', () => {
					expect(k_factory.namedNode('banana').star(h_prefixes_base)).to.equal('base:banana');
				});

				it('#verbose()', () => {
					expect(() => kt_node.verbose()).to.throw();
				});

				it('#isolate()', () => {
					expect(kt_node.isolate()).to.eql({
						termType: 'NamedNode',
						value: s_relative,
					});
				});

				it('#hash()', () => {
					expect(() => kt_node.hash()).to.throw();
				});

				const g_replace_never = {
					clones: [
						['banana', 'never'],
						[/banana/, 'never'],
						[/n/g, 'x'],
					],
				};

				test_replacements({
					input: kt_node,
					validate: H_VALIDATORS.namedNode,
					identity: () => [{value:s_relative, relative:true}],
					replace: {
						value: (w_search, w_replace) => [{value:s_relative.replace(w_search, w_replace), relative:true}],
					},
					map: {
						iri: g_replace_never,
						text: g_replace_never,
						value: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
							],
							replaces: [
								['banana', 'replaced'],
								[/banana/, 'replaced'],
								[/n/g, 'x'],
							],
						},
					},
				});

				it('#resolve()', () => {
					expect(() => kt_node.resolve()).to.throw();
				});

				it('#resolve({})', () => {
					expect(() => kt_node.resolve({})).to.throw();
				});

				it('#resolve(p_iri_base)', () => {
					H_VALIDATORS.namedNode(kt_node.resolve(p_iri_base), p_iri_base+s_relative);
				});

				it('#resolve(h_prefixes_base)', () => {
					H_VALIDATORS.namedNode(k_factory.namedNode('banana').resolve(h_prefixes_base), p_iri_base+s_relative);
				});
			});

			describe('Labeled Blank Node', () => {
				const kt_node = k_factory.blankNode('label');

				it('valid', () => {
					H_VALIDATORS.blankNode(kt_node, 'label');
				});

				it('#clone()', () => {
					const kt_clone = kt_node.clone();
					expect_original_replaced_equals(kt_node, kt_clone, true);
					H_VALIDATORS.blankNode(kt_clone, 'label');
				});

				it('#equals(this)', () => {
					expect(kt_node.equals(kt_node)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_node.equals(k_factory.blankNode('label'))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_node.equals(kt_node.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_node.equals({
						termType: 'BlankNode',
						value: 'label',
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_node.concise()).to.equal('_:label');
				});

				it('#concise({})', () => {
					expect(kt_node.concise({})).to.equal('_:label');
				});

				it('#terse()', () => {
					expect(kt_node.terse()).to.equal('_:label');
				});

				it('#terse({})', () => {
					expect(kt_node.terse({})).to.equal('_:label');
				});

				it('#star()', () => {
					expect(kt_node.star()).to.equal('_:label');
				});

				it('#star({})', () => {
					expect(kt_node.star({})).to.equal('_:label');
				});

				it('#verbose()', () => {
					expect(kt_node.verbose()).to.equal('_:label');
				});

				it('#isolate()', () => {
					expect(kt_node.isolate()).to.eql({
						termType: 'BlankNode',
						value: 'label',
					});
				});

				it('#hash()', () => {
					expect(kt_node.hash()).to.equal(hash('_:label'));
				});

				const g_replace_never = {
					clones: [
						['label', 'never'],
						[/label/, 'never'],
						[/l/g, 'x'],
					],
				};

				test_replacements({
					input: kt_node,
					validate: H_VALIDATORS.blankNode,
					identity: () => ['label'],
					replace: {
						value: (w_search, w_replace) => ['label'.replace(w_search, w_replace)],
					},
					map: {
						iri: g_replace_never,
						text: g_replace_never,
						value: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
							],
							replaces: [
								['label', 'replaced'],
								[/label/, 'replaced'],
								[/l/g, 'x'],
							],
						},
					},
				});
			});

			describe('Ephemeral Blank Node', () => {
				const kt_node = k_factory.ephemeralBlankNode();
				const nl_uuidv4 = 'xxxxyyyy-xxxx-yyyy-zzzz-xxxxyyyyzzzz'.length;

				it('valid', () => {
					H_VALIDATORS.blankNode(kt_node, null, true, true);
				});

				it('#clone()', () => {
					const kt_clone = kt_node.clone();
					expect_original_replaced_equals(kt_node, kt_clone, false);
					H_VALIDATORS.blankNode(kt_clone, null, true, true);
				});

				it('.value !== .value', () => {
					expect(kt_node.value).to.not.equal(kt_node.value);
				});

				it('#equals(this)', () => {
					expect(kt_node.equals(kt_node)).to.be.false;
				});

				it('#equals(other)', () => {
					expect(kt_node.equals(k_factory.blankNode(kt_node.value))).to.be.false;
				});

				it('#equals(isolate)', () => {
					expect(kt_node.equals(kt_node.isolate())).to.be.false;
				});

				it('#equals(similar)', () => {
					expect(kt_node.equals({
						termType: 'BlankNode',
						value: kt_node.value,
					})).to.be.false;
				});

				it('#concise()', () => {
					expect(kt_node.concise()).to.startWith('_:#_').and.have.lengthOf(nl_uuidv4+4);
				});

				it('#concise({})', () => {
					expect(kt_node.concise({})).to.startWith('_:#_').and.have.lengthOf(nl_uuidv4+4);
				});

				it('#terse()', () => {
					expect(kt_node.terse({})).to.equal('[]');
				});

				it('#terse({})', () => {
					expect(kt_node.terse({})).to.equal('[]');
				});

				it('#verbose()', () => {
					expect(kt_node.verbose()).to.startWith('_:_').and.have.lengthOf(nl_uuidv4+3);
				});

				it('#isolate()', () => {
					expect(kt_node.isolate()).to.include({
						termType: 'BlankNode',
					}).and.to.have.property('value').that.has.lengthOf(nl_uuidv4+1);
				});

				it('#hash()', () => {
					expect(kt_node.hash()).to.be.a('string')
						.that.does.not.equal(hash('_:'+kt_node.value));
				});

				// test_replacements({
				// 	input: kt_node,
				// 	validate: H_VALIDATORS.blankNode,
				// 	identity: () => [null, true, true],
				// 	replace: {
				// 		// value: (w_search, w_replace) => [''],
				// 	},
				// 	map: {
				// 		iri: {
				// 			different: [
				// 				['absent', 'never'],
				// 				[/absent/, 'never'],
				// 			],
				// 		},
				// 	},
				// });
			});

			describe('Auto Blank Node', () => {
				const kt_node = k_factory.blankNode();
				const s_hash_eg = 'xxxxyyyy-xxxx-yyyy-zzzz-xxxxyyyyzzzz';
				const nl_uuidv4 = s_hash_eg.length;

				it('valid', () => {
					H_VALIDATORS.blankNode(kt_node, null, true);
				});

				it('#clone()', () => {
					const kt_clone = kt_node.clone();
					expect_original_replaced_equals(kt_node, kt_clone, true);
					H_VALIDATORS.blankNode(kt_clone, null, true);
				});

				it('#equals(this)', () => {
					expect(kt_node.equals(kt_node)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_node.equals(k_factory.blankNode(kt_node.value))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_node.equals(kt_node.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_node.equals({
						termType: 'BlankNode',
						value: kt_node.value,
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_node.concise()).to.startWith('_:_').and.have.lengthOf(nl_uuidv4+3);
				});

				it('#concise({})', () => {
					expect(kt_node.concise({})).to.startWith('_:_').and.have.lengthOf(nl_uuidv4+3);
				});

				it('#terse()', () => {
					expect(kt_node.terse()).to.startWith('_:_').and.have.lengthOf(nl_uuidv4+3);
				});

				it('#terse({})', () => {
					expect(kt_node.terse({})).to.startWith('_:_').and.have.lengthOf(nl_uuidv4+3);
				});

				it('#star()', () => {
					expect(kt_node.star()).to.startWith('_:_').and.have.lengthOf(nl_uuidv4+3);
				});

				it('#star({})', () => {
					expect(kt_node.star({})).to.startWith('_:_').and.have.lengthOf(nl_uuidv4+3);
				});

				it('#verbose()', () => {
					expect(kt_node.verbose()).to.startWith('_:_').and.have.lengthOf(nl_uuidv4+3);
				});

				it('#isolate()', () => {
					expect(kt_node.isolate()).to.include({
						termType: 'BlankNode',
					}).and.to.have.property('value').that.has.lengthOf(nl_uuidv4+1);
				});

				it('#hash()', () => {
					expect(kt_node.hash()).to.equal(hash('_:'+kt_node.value));
				});

				// test_replacements({
				// 	input: kt_node,
				// 	validate: H_VALIDATORS.blankNode,
				// 	identity: () => [null, true],
				// 	// replace: (w_search, w_replace) => ['label'.replace(w_search, w_replace)],
				// 	map: {
				// 		iri: {
				// 			clones: [
				// 				['absent', 'never'],
				// 				[/absent/, 'never'],
				// 			],
				// 			// replaces: [
				// 			// 	['label', 'replaced'],
				// 			// 	[/label/, 'replaced'],
				// 			// 	[/l/g, 'x'],
				// 			// ],
				// 		},
				// 	},
				// });

				// it('#replace("absent", "never")', () => {
				// 	const kt_replaced = kt_node.replace('absent', 'never');
				// 	H_VALIDATORS.blankNode(kt_replaced, null, true);
				// 	expect_original_replaced_equals(kt_node, kt_replaced, false);
				// });

				// it('#replace(/absent/, "never")', () => {
				// 	const kt_replaced = kt_node.replace(/absent/, 'never');
				// 	H_VALIDATORS.blankNode(kt_replaced, null, true);
				// 	expect_original_replaced_equals(kt_node, kt_replaced, false);
				// });
			});

			describe('Simple Literal', () => {
				const kt_literal = k_factory.literal('value');

				it('valid', () => {
					H_VALIDATORS.literal(kt_literal, {value:'value'});
				});

				it('#clone()', () => {
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.literal(kt_clone, {value:'value'});
				});

				it('#equals(this)', () => {
					expect(kt_literal.equals(kt_literal)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_literal.equals(k_factory.literal('value'))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_literal.equals(kt_literal.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_literal.equals({
						termType: 'Literal',
						value: 'value',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: `${P_IRI_XSD}string`,
						},
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_literal.concise()).to.equal('"value');
				});

				it('#concise({})', () => {
					expect(kt_literal.concise({})).to.equal('"value');
				});

				it('#terse()', () => {
					expect(kt_literal.terse()).to.equal('"value"');
				});

				it('#terse({})', () => {
					expect(kt_literal.terse({})).to.equal('"value"');
				});

				it('#star()', () => {
					expect(kt_literal.star()).to.equal('"value"');
				});

				it('#star({})', () => {
					expect(kt_literal.star({})).to.equal('"value"');
				});

				it('#verbose()', () => {
					expect(kt_literal.verbose()).to.equal('"value"');
				});

				it('#isolate()', () => {
					expect(kt_literal.isolate()).to.eql({
						termType: 'Literal',
						value: 'value',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: `${P_IRI_XSD}string`,
						},
					});
				});

				it('#hash()', () => {
					expect(kt_literal.hash()).to.equal(hash('"value'));
				});

				test_replacements({
					input: kt_literal,
					validate: H_VALIDATORS.literal,
					identity: () => [{value:'value'}],
					replace: {
						text: (w_search, w_replace) => [{value:kt_literal.value.replace(w_search, w_replace)}],
						value: (w_search, w_replace) => [{value:kt_literal.value.replace(w_search, w_replace), datatype:kt_literal.datatype.value.replace(w_search, w_replace)}],
						iri: (w_search, w_replace) => [{value:kt_literal.value, datatype:kt_literal.datatype.value.replace(w_search, w_replace)}],
					},
					map: {
						text: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
							],
							replaces: [
								['value', 'replaced'],
								[/value/, 'replaced'],
								[/a/g, 'x'],
							],
						},
						value: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
							],
							replaces: [
								['value', 'replaced'],
								[/value/, 'replaced'],
								[/a/g, 'x'],
							],
						},
						iri: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
							],
							replaces: [
								['string', 'replace'],
								[/string/, 'replace'],
								[/s/g, 'x'],
							],
						},
					},
				});
			});

			describe('Languaged Literal', () => {
				const kt_literal = k_factory.literal('value', 'en');

				it('valid', () => {
					H_VALIDATORS.literal(kt_literal, {value:'value', language:'en'});
				});

				it('#clone()', () => {
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.literal(kt_clone, {value:'value', language:'en'});
				});

				it('#equals(this)', () => {
					expect(kt_literal.equals(kt_literal)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_literal.equals(k_factory.literal('value', 'en'))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_literal.equals(kt_literal.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_literal.equals({
						termType: 'Literal',
						value: 'value',
						language: 'en',
						datatype: {
							termType: 'NamedNode',
							value: `${P_IRI_RDF}langString`,
						},
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_literal.concise()).to.equal('@en"value');
				});

				it('#concise({})', () => {
					expect(kt_literal.concise({})).to.equal('@en"value');
				});

				it('#terse()', () => {
					expect(kt_literal.terse()).to.equal('"value"@en');
				});

				it('#terse({})', () => {
					expect(kt_literal.terse({})).to.equal('"value"@en');
				});

				it('#star()', () => {
					expect(kt_literal.star()).to.equal('"value"@en');
				});

				it('#star({})', () => {
					expect(kt_literal.star({})).to.equal('"value"@en');
				});

				it('#verbose()', () => {
					expect(kt_literal.verbose()).to.equal('"value"@en');
				});

				it('#isolate()', () => {
					expect(kt_literal.isolate()).to.eql({
						termType: 'Literal',
						value: 'value',
						language: 'en',
						datatype: {
							termType: 'NamedNode',
							value: `${P_IRI_RDF}langString`,
						},
					});
				});

				it('#hash()', () => {
					expect(kt_literal.hash()).to.equal(hash('@en"value'));
				});

				const f_replace_text = (w_search, w_replace) => [{value:'value'.replace(w_search, w_replace), language:'en'}];
				const g_replace_text = {
					clones: [
						['absent', 'never'],
						[/absent/, 'never'],
						['en', 'never'],
						[/end/, 'never'],
					],
					replaces: [
						['value', 'replaced'],
						[/value/, 'replaced'],
						[/l/g, 'x'],
					],
				};

				test_replacements({
					input: kt_literal,
					validate: H_VALIDATORS.literal,
					identity: () => [{value:'value', language:'en'}],
					replace: {
						text: f_replace_text,
						value: f_replace_text,
					},
					map: {
						text: g_replace_text,
						value: g_replace_text,
						iri: {
							clones: [
								['value', 'never'],
								[/value/, 'never'],
								[/l/g, 'x'],
							],
						},
					},
				});
			});

			describe('Datatyped Literal', () => {
				const p_iri_tests = 'https://graphy.link/tests#';
				const p_iri_datatype = p_iri_tests+'datatype';
				const kt_datatype = k_factory.namedNode(p_iri_datatype);
				const h_prefixes = {
					tests: p_iri_tests,
				};
				const kt_literal = k_factory.literal('value', kt_datatype);

				it('valid', () => {
					H_VALIDATORS.literal(kt_literal, {value:'value', datatype:p_iri_datatype});
				});

				it('#clone()', () => {
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.literal(kt_clone, {value:'value', datatype:p_iri_datatype});
				});

				it('#equals(this)', () => {
					expect(kt_literal.equals(kt_literal)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_literal.equals(k_factory.literal('value', k_factory.namedNode(p_iri_tests+'datatype')))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_literal.equals(kt_literal.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_literal.equals({
						termType: 'Literal',
						value: 'value',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_literal.concise()).to.equal(`^>${p_iri_datatype}"value`);
				});

				it('#concise(h_prefixes)', () => {
					expect(kt_literal.concise(h_prefixes)).to.equal(`^tests:datatype"value`);
				});

				it('#terse()', () => {
					expect(kt_literal.terse()).to.equal(`"value"^^<${p_iri_datatype}>`);
				});

				it('#terse(h_prefixes)', () => {
					expect(kt_literal.terse(h_prefixes)).to.equal('"value"^^tests:datatype');
				});

				it('#star()', () => {
					expect(kt_literal.star()).to.equal(`"value"^^<${p_iri_datatype}>`);
				});

				it('#star(h_prefixes)', () => {
					expect(kt_literal.star(h_prefixes)).to.equal('"value"^^tests:datatype');
				});

				it('#verbose()', () => {
					expect(kt_literal.verbose()).to.equal(`"value"^^<${p_iri_datatype}>`);
				});

				it('#isolate()', () => {
					expect(kt_literal.isolate()).to.eql({
						termType: 'Literal',
						value: 'value',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					});
				});

				it('#hash()', () => {
					expect(kt_literal.hash()).to.equal(hash(`^>${p_iri_datatype}"value`));
				});

				test_replacements({
					input: kt_literal,
					validate: H_VALIDATORS.literal,
					identity: () => [{value:'value', datatype:p_iri_datatype}],
					replace: {
						iri: (w_search, w_replace) => [{value:'value', datatype:p_iri_datatype.replace(w_search, w_replace)}],
						text: (w_search, w_replace) => [{value:'value'.replace(w_search, w_replace), datatype:p_iri_datatype}],
						value: (w_search, w_replace) => [{value:'value'.replace(w_search, w_replace), datatype:p_iri_datatype.replace(w_search, w_replace)}],
					},
					map: {
						iri: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
								['value', 'never'],
								[/value/, 'never'],
							],
							replaces: [
								['datatype', 'replaced'],
								[/datatype/, 'replaced'],
								[/a/g, 'x'],
								[p_iri_datatype, P_IRI_XSD+'string'],
							],
						},
						text: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
								['datatype', 'never'],
								[/datatype/, 'never'],
							],
							replaces: [
								['value', 'replaced'],
								[/value/, 'replaced'],
								[/a/g, 'x'],
							],
						},
						value: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
							],
							replaces: [
								['value', 'replaced'],
								[/value/, 'replaced'],
								['datatype', 'replaced'],
								[/datatype/, 'replaced'],
								[/a/g, 'x'],
								[p_iri_datatype, P_IRI_XSD+'string'],
							],
						},
					},
				});
			});

			describe('Boolean Literal', () => {
				it('booleanLiteral()', () => {
					expect(() => k_factory.booleanLiteral()).to.throw();
				});

				const kt_literal = k_factory.booleanLiteral(true);
				const p_iri_datatype = P_IRI_XSD+'boolean';
				const h_prefixes = {
					xsd: P_IRI_XSD,
				};

				it('#equals(this)', () => {
					expect(kt_literal.equals(kt_literal)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_literal.equals(k_factory.literal('true', k_factory.namedNode(p_iri_datatype)))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_literal.equals(kt_literal.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_literal.equals({
						termType: 'Literal',
						value: 'true',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_literal.concise()).to.equal(`^>${p_iri_datatype}"true`);
				});

				it('#concise(h_prefixes)', () => {
					expect(kt_literal.concise(h_prefixes)).to.equal(`^xsd:boolean"true`);
				});

				it('#terse()', () => {
					expect(kt_literal.terse()).to.equal('true');
				});

				it('#terse(h_prefixes)', () => {
					expect(kt_literal.terse(h_prefixes)).to.equal('true');
				});

				it('#star()', () => {
					expect(kt_literal.star()).to.equal('true');
				});

				it('#star(h_prefixes)', () => {
					expect(kt_literal.star(h_prefixes)).to.equal('true');
				});

				it('#verbose()', () => {
					expect(kt_literal.verbose()).to.equal(`"true"^^<${p_iri_datatype}>`);
				});

				it('#isolate()', () => {
					expect(kt_literal.isolate()).to.eql({
						termType: 'Literal',
						value: 'true',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					});
				});

				it('#hash()', () => {
					expect(kt_literal.hash()).to.equal(hash(`^>${p_iri_datatype}"true`));
				});

				it('#clone()', () => {
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.booleanLiteral(kt_clone, true);
				});

				test_replacements({
					input: kt_literal,
					validate: H_VALIDATORS.booleanLiteral,
					identity: () => [true],
					map: {
						iri: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
								['value', 'never'],
								[/value/, 'never'],
							],
						},
						text: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
								['boolean', 'never'],
								[/boolean/, 'never'],
							],
						},
						value: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
							],
						},
					},
				});

				test_replacements({
					input: kt_literal,
					validate: H_VALIDATORS.literal,
					replace: {
						iri: (w_search, w_replace) => [{value:'true', datatype:p_iri_datatype.replace(w_search, w_replace)}],
						text: (w_search, w_replace) => [{value:'true'.replace(w_search, w_replace), datatype:p_iri_datatype}],
						value: (w_search, w_replace) => [{value:'true'.replace(w_search, w_replace), datatype:p_iri_datatype.replace(w_search, w_replace)}],
					},
					map: {
						iri: {
							replaces: [
								['boolean', 'replaced'],
								[/boolean/, 'replaced'],
								[/t/g, 'x'],
								[p_iri_datatype, P_IRI_XSD+'string'],
							],
						},
						text: {
							replaces: [
								['true', 'replaced'],
								[/true/, 'replaced'],
								[/t/g, 'x'],
							],
						},
						value: {
							replaces: [
								['true', 'replaced'],
								[/true/, 'replaced'],
								[/t/g, 'x'],
							],
						},
					},
				});
			});

			describe('Integer Literal', () => {
				const p_iri_datatype = P_IRI_XSD+'integer';
				const kt_literal = k_factory.integerLiteral(5);
				const h_prefixes = {
					xsd: P_IRI_XSD,
				};

				it('integer(0)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(0), 0);
				});

				it('integer(1)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(1), 1);
				});

				it('integer(-1)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(-1), -1);
				});

				it('integer(Number.MAX_SAFE_INTEGER)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
				});

				it('integer(Number.MIN_SAFE_INTEGER)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(Number.MIN_SAFE_INTEGER), Number.MIN_SAFE_INTEGER);
				});

				it('integer(Number.MAX_SAFE_INTEGER*2)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(Number.MAX_SAFE_INTEGER*2), Number.MAX_SAFE_INTEGER*2);
				});

				it('integer(Number.MIN_SAFE_INTEGER*2)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(Number.MIN_SAFE_INTEGER*2), Number.MIN_SAFE_INTEGER*2);
				});


				it('integer(0n)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(0n), 0n);
				});

				it('integer(1n)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(1n), 1n);
				});

				it('integer(-1n)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(-1n), -1n);
				});

				const xg_max_safe_int = BigInt(Number.MAX_SAFE_INTEGER);
				const xg_min_safe_int = BigInt(Number.MIN_SAFE_INTEGER);

				it('integer(Number.MAX_SAFE_INTEGER+1n)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(xg_max_safe_int+1n), xg_max_safe_int+1n);
				});

				it('integer(Number.MIN_SAFE_INTEGER-1n)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(xg_min_safe_int-1n), xg_min_safe_int-1n);
				});


				it('integer("0")', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral('0'), '0');
				});

				it('integer("1")', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral('1'), '1');
				});

				it('integer("-1")', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral('-1'), '-1');
				});

				it('integer("10")', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral('10'), '10');
				});

				it('integer("-10")', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral('-10'), '-10');
				});

				it('integer(""+Number.MAX_SAFE_INTEGER)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(''+Number.MAX_SAFE_INTEGER), ''+Number.MAX_SAFE_INTEGER);
				});

				it('integer(""+Number.MIN_SAFE_INTEGER)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(''+Number.MIN_SAFE_INTEGER), ''+Number.MIN_SAFE_INTEGER);
				});

				it('integer(""+Number.MAX_SAFE_INTEGER*2n)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(''+(BigInt(Number.MAX_SAFE_INTEGER)*2n)), ''+(BigInt(Number.MAX_SAFE_INTEGER)*2n));
				});

				it('integer(""+Number.MIN_SAFE_INTEGER*2n)', () => {
					H_VALIDATORS.integerLiteral(k_factory.integerLiteral(''+(BigInt(Number.MIN_SAFE_INTEGER)*2n)), ''+(BigInt(Number.MIN_SAFE_INTEGER)*2n));
				});


				it('integer(Infinity)', () => {
					expect(() => k_factory.integerLiteral(Infinity)).to.throw();
				});

				it('integer(NaN)', () => {
					expect(() => k_factory.integerLiteral(NaN)).to.throw();
				});

				it('integer(5.1)', () => {
					expect(() => k_factory.integerLiteral(5.1)).to.throw();
				});

				it('integer("")', () => {
					expect(() => k_factory.integerLiteral()).to.throw();
				});

				it('integer("never")', () => {
					expect(() => k_factory.integerLiteral('never')).to.throw();
				});

				it('integer("5.1")', () => {
					expect(() => k_factory.integerLiteral('5.1')).to.throw();
				});

				it('integer()', () => {
					expect(() => k_factory.integerLiteral()).to.throw();
				});

				it('integer(null)', () => {
					expect(() => k_factory.integerLiteral(null)).to.throw();
				});

				it('integer({})', () => {
					expect(() => k_factory.integerLiteral({})).to.throw();
				});


				it('#clone()', () => {
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.integerLiteral(kt_clone, 5);
				});

				it('#equals(this)', () => {
					expect(kt_literal.equals(kt_literal)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_literal.equals(k_factory.literal('5', k_factory.namedNode(p_iri_datatype)))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_literal.equals(kt_literal.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_literal.equals({
						termType: 'Literal',
						value: '5',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_literal.concise()).to.equal(`^>${p_iri_datatype}"5`);
				});

				it('#concise(h_prefixes)', () => {
					expect(kt_literal.concise(h_prefixes)).to.equal(`^xsd:integer"5`);
				});

				it('#terse()', () => {
					expect(kt_literal.terse()).to.equal('5');
				});

				it('#terse(h_prefixes)', () => {
					expect(kt_literal.terse(h_prefixes)).to.equal('5');
				});

				it('#star()', () => {
					expect(kt_literal.star()).to.equal('5');
				});

				it('#star(h_prefixes)', () => {
					expect(kt_literal.star(h_prefixes)).to.equal('5');
				});

				it('#verbose()', () => {
					expect(kt_literal.verbose()).to.equal(`"5"^^<${p_iri_datatype}>`);
				});

				it('#isolate()', () => {
					expect(kt_literal.isolate()).to.eql({
						termType: 'Literal',
						value: '5',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					});
				});

				it('#hash()', () => {
					expect(kt_literal.hash()).to.equal(hash(`^>${p_iri_datatype}"5`));
				});

				// it('#replace("absent", "never")', () => {
				// 	const kt_replaced = kt_literal.replace('absent', 'never');
				// 	H_VALIDATORS.integerLiteral(kt_replaced, 5);
				// 	expect_original_replaced_equals(kt_literal, kt_replaced, true);
				// });

				// it('#replace(/absent/, "never")', () => {
				// 	const kt_replaced = kt_literal.replace(/absent/, 'never');
				// 	H_VALIDATORS.integerLiteral(kt_replaced, 5);
				// 	expect_original_replaced_equals(kt_literal, kt_replaced, true);
				// });

				// it('#replace("integer", "never")', () => {
				// 	const kt_replaced = kt_literal.replace('integer', 'never');
				// 	H_VALIDATORS.integerLiteral(kt_replaced, 5);
				// 	expect_original_replaced_equals(kt_literal, kt_replaced, true);
				// });

				// it('#replace(/integer/, "never")', () => {
				// 	const kt_replaced = kt_literal.replace(/integer/, 'never');
				// 	H_VALIDATORS.integerLiteral(kt_replaced, 5);
				// 	expect_original_replaced_equals(kt_literal, kt_replaced, true);
				// });

				// it('#replace("5", "replaced")', () => {
				// 	const kt_replaced = kt_literal.replace('5', 'replaced');
				// 	H_VALIDATORS.literal(kt_replaced, {value:'replaced', datatype:p_iri_datatype});
				// 	expect_original_replaced_equals(kt_literal, kt_replaced, false);
				// });

				// it('#replace(/5/, "replaced")', () => {
				// 	const kt_replaced = kt_literal.replace(/5/, 'replaced');
				// 	H_VALIDATORS.literal(kt_replaced, {value:'replaced', datatype:p_iri_datatype});
				// 	expect_original_replaced_equals(kt_literal, kt_replaced, false);
				// });

				// it('#replace(/5/g, "x")', () => {
				// 	const kt_replaced = kt_literal.replace(/5/g, 'x');
				// 	H_VALIDATORS.literal(kt_replaced, {value:'5'.replace(/5/g, 'x'), datatype:p_iri_datatype});
				// 	expect_original_replaced_equals(kt_literal, kt_replaced, false);
				// });
			});

			describe('Double Literal', () => {
				it('double(0)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(0), 0);
				});

				it('double(1)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(1), 1);
				});

				it('double(-1)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(-1), -1);
				});

				it('double(Number.MAX_VALUE)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(Number.MAX_VALUE), Number.MAX_VALUE);
				});

				it('double(Number.MIN_VALUE)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(Number.MIN_VALUE), Number.MIN_VALUE);
				});

				it('double(0.1)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(0.1), 0.1);
				});

				it('double(1.1)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(1.1), 1.1);
				});

				it('double(-1.1)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(-1.1), -1.1);
				});


				it('double("0")', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral('0'), '0');
				});

				it('double("1")', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral('1'), '1');
				});

				it('double("-1")', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral('-1'), '-1');
				});

				it('double("5.1")', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral('5.1'), '5.1');
				});

				it('double("-5.1")', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral('-5.1'), '-5.1');
				});

				it('double(""+Number.MAX_VALUE)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(''+Number.MAX_VALUE), ''+Number.MAX_VALUE);
				});

				it('double(""+Number.MIN_VALUE)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(''+Number.MIN_VALUE), ''+Number.MIN_VALUE);
				});


				it('double("")', () => {
					expect(() => k_factory.doubleLiteral()).to.throw();
				});

				it('double("never")', () => {
					expect(() => k_factory.doubleLiteral('never')).to.throw();
				});

				it('double()', () => {
					expect(() => k_factory.doubleLiteral()).to.throw();
				});

				it('double(null)', () => {
					expect(() => k_factory.doubleLiteral(null)).to.throw();
				});

				it('double({})', () => {
					expect(() => k_factory.doubleLiteral({})).to.throw();
				});

				const kt_literal = k_factory.doubleLiteral(5.1);
				const p_iri_datatype = `${P_IRI_XSD}double`;
				const h_prefixes = {
					xsd: P_IRI_XSD,
				};

				it('#clone()', () => {
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.doubleLiteral(kt_clone, 5.1);
				});

				it('#concise()', () => {
					expect(kt_literal.concise()).to.equal(`^>${p_iri_datatype}"5.1`);
				});

				it('#concise({})', () => {
					expect(kt_literal.concise({})).to.equal(`^>${p_iri_datatype}"5.1`);
				});

				it('#concise(h_prefixes)', () => {
					expect(kt_literal.concise(h_prefixes)).to.equal(`^xsd:double"5.1`);
				});

				it('#terse()', () => {
					expect(kt_literal.terse()).to.equal(`5.1e+0`);
				});

				it('#terse({})', () => {
					expect(kt_literal.terse({})).to.equal(`5.1e+0`);
				});

				it('#terse(h_prefixes)', () => {
					expect(kt_literal.terse(h_prefixes)).to.equal(`5.1e+0`);
				});

				it('#star()', () => {
					expect(kt_literal.star()).to.equal(`5.1e+0`);
				});

				it('#star({})', () => {
					expect(kt_literal.star({})).to.equal(`5.1e+0`);
				});

				it('#star(h_prefixes)', () => {
					expect(kt_literal.star(h_prefixes)).to.equal(`5.1e+0`);
				});

				it('#verbose()', () => {
					expect(kt_literal.verbose()).to.equal(`"5.1"^^<${p_iri_datatype}>`);
				});

				it('#isolate()', () => {
					expect(kt_literal.isolate()).to.eql({
						termType: 'Literal',
						value: '5.1',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: P_IRI_XSD+'double',
						},
					});
				});

				it('#hash()', () => {
					expect(kt_literal.hash()).to.equal(hash(`^>${p_iri_datatype}"5.1`));
				});
			});

			describe('Positive Infinity Literal', () => {
				it('double(Infinity)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(Infinity), Infinity);
				});

				it('double("Infinity")', () => {
					expect(() => k_factory.doubleLiteral('Infinity')).to.throw();
				});

				it('double("INF")', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral('INF'), 'INF');
				});

				const kt_literal = k_factory.doubleLiteral('INF');
				const p_iri_datatype = P_IRI_XSD+'double';
				const h_prefixes = {
					xsd: P_IRI_XSD,
				};

				it('#equals(this)', () => {
					expect(kt_literal.equals(kt_literal)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_literal.equals(k_factory.literal('INF', k_factory.namedNode(p_iri_datatype)))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_literal.equals(kt_literal.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_literal.equals({
						termType: 'Literal',
						value: 'INF',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_literal.concise()).to.equal(`^>${p_iri_datatype}"INF`);
				});

				it('#concise(h_prefixes)', () => {
					expect(kt_literal.concise(h_prefixes)).to.equal(`^xsd:double"INF`);
				});

				it('#terse()', () => {
					expect(kt_literal.terse()).to.equal(`"INF"^^<${p_iri_datatype}>`);
				});

				it('#terse(h_prefixes)', () => {
					expect(kt_literal.terse(h_prefixes)).to.equal('"INF"^^xsd:double');
				});

				it('#star()', () => {
					expect(kt_literal.star()).to.equal(`"INF"^^<${p_iri_datatype}>`);
				});

				it('#star(h_prefixes)', () => {
					expect(kt_literal.star(h_prefixes)).to.equal('"INF"^^xsd:double');
				});

				it('#verbose()', () => {
					expect(kt_literal.verbose()).to.equal(`"INF"^^<${p_iri_datatype}>`);
				});

				it('#isolate()', () => {
					expect(kt_literal.isolate()).to.eql({
						termType: 'Literal',
						value: 'INF',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					});
				});

				it('#hash()', () => {
					expect(kt_literal.hash()).to.equal(hash(`^>${p_iri_datatype}"INF`));
				});

				it('#clone()', () => {
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.doubleLiteral(kt_clone, Infinity);
				});
			});

			describe('Negative Infinity Literal', () => {
				it('double(-Infinity)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(-Infinity), -Infinity);
				});

				it('double("-Infinity")', () => {
					expect(() => k_factory.doubleLiteral('-Infinity')).to.throw();
				});

				it('double("-INF")', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral('-INF'), '-INF');
				});

				const kt_literal = k_factory.doubleLiteral('-INF');
				const p_iri_datatype = P_IRI_XSD+'double';
				const h_prefixes = {
					xsd: P_IRI_XSD,
				};

				it('#equals(this)', () => {
					expect(kt_literal.equals(kt_literal)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_literal.equals(k_factory.literal('-INF', k_factory.namedNode(p_iri_datatype)))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_literal.equals(kt_literal.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_literal.equals({
						termType: 'Literal',
						value: '-INF',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_literal.concise()).to.equal(`^>${p_iri_datatype}"-INF`);
				});

				it('#concise(h_prefixes)', () => {
					expect(kt_literal.concise(h_prefixes)).to.equal(`^xsd:double"-INF`);
				});

				it('#terse()', () => {
					expect(kt_literal.terse()).to.equal(`"-INF"^^<${p_iri_datatype}>`);
				});

				it('#terse(h_prefixes)', () => {
					expect(kt_literal.terse(h_prefixes)).to.equal('"-INF"^^xsd:double');
				});

				it('#star()', () => {
					expect(kt_literal.star()).to.equal(`"-INF"^^<${p_iri_datatype}>`);
				});

				it('#star(h_prefixes)', () => {
					expect(kt_literal.star(h_prefixes)).to.equal('"-INF"^^xsd:double');
				});

				it('#verbose()', () => {
					expect(kt_literal.verbose()).to.equal(`"-INF"^^<${p_iri_datatype}>`);
				});

				it('#isolate()', () => {
					expect(kt_literal.isolate()).to.eql({
						termType: 'Literal',
						value: '-INF',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					});
				});

				it('#hash()', () => {
					expect(kt_literal.hash()).to.equal(hash(`^>${p_iri_datatype}"-INF`));
				});

				it('#clone()', () => {
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.doubleLiteral(kt_clone, -Infinity);
				});
			});

			describe('NaN Literal', () => {
				it('double(NaN)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(NaN+''), NaN);
				});

				it('double(""+NaN)', () => {
					H_VALIDATORS.doubleLiteral(k_factory.doubleLiteral(NaN+''), NaN+'');
				});


				const kt_literal = k_factory.doubleLiteral('NaN');
				const p_iri_datatype = P_IRI_XSD+'double';
				const h_prefixes = {
					xsd: P_IRI_XSD,
				};

				it('#equals(this)', () => {
					expect(kt_literal.equals(kt_literal)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kt_literal.equals(k_factory.literal('NaN', k_factory.namedNode(p_iri_datatype)))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kt_literal.equals(kt_literal.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kt_literal.equals({
						termType: 'Literal',
						value: 'NaN',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kt_literal.concise()).to.equal(`^>${p_iri_datatype}"NaN`);
				});

				it('#concise(h_prefixes)', () => {
					expect(kt_literal.concise(h_prefixes)).to.equal(`^xsd:double"NaN`);
				});

				it('#terse()', () => {
					expect(kt_literal.terse()).to.equal(`"NaN"^^<${p_iri_datatype}>`);
				});

				it('#terse(h_prefixes)', () => {
					expect(kt_literal.terse(h_prefixes)).to.equal('"NaN"^^xsd:double');
				});

				it('#star()', () => {
					expect(kt_literal.star()).to.equal(`"NaN"^^<${p_iri_datatype}>`);
				});

				it('#star(h_prefixes)', () => {
					expect(kt_literal.star(h_prefixes)).to.equal('"NaN"^^xsd:double');
				});

				it('#verbose()', () => {
					expect(kt_literal.verbose()).to.equal(`"NaN"^^<${p_iri_datatype}>`);
				});

				it('#isolate()', () => {
					expect(kt_literal.isolate()).to.eql({
						termType: 'Literal',
						value: 'NaN',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: p_iri_datatype,
						},
					});
				});

				it('#hash()', () => {
					expect(kt_literal.hash()).to.equal(hash(`^>${p_iri_datatype}"NaN`));
				});

				it('#clone()', () => {
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.doubleLiteral(kt_clone, NaN);
				});
			});

			describe('Decimal Literal', () => {
				it('decimal(0)', () => {
					H_VALIDATORS.decimalLiteral(k_factory.decimalLiteral(0), 0);
				});

				it('decimal(1)', () => {
					H_VALIDATORS.decimalLiteral(k_factory.decimalLiteral(1), 1);
				});

				it('decimal(-1)', () => {
					H_VALIDATORS.decimalLiteral(k_factory.decimalLiteral(-1), -1);
				});

				it('decimal(Number.MAX_VALUE)', () => {
					expect(() => k_factory.decimalLiteral(Number.MAX_VALUE)).to.throw();
				});

				it('decimal(Number.MIN_VALUE)', () => {
					expect(() => k_factory.decimalLiteral(Number.MIN_VALUE)).to.throw();
				});

				it('decimal(0.1)', () => {
					H_VALIDATORS.decimalLiteral(k_factory.decimalLiteral(0.1), 0.1);
				});

				it('decimal(1.1)', () => {
					H_VALIDATORS.decimalLiteral(k_factory.decimalLiteral(1.1), 1.1);
				});

				it('decimal(-1.1)', () => {
					H_VALIDATORS.decimalLiteral(k_factory.decimalLiteral(-1.1), -1.1);
				});

				for(const s_sign of ['-', '+']) {
					['0', '1', '10', '0.', '1.', '0.1', '.0', '.1', '5.1']
						.flatMap(s => [s, s_sign+s, '0'+s, s+'0', s_sign+'0'+s, s_sign+s+'0'])
						.forEach((s_mut) => {
							it(`decimal("${s_mut}")`, () => {
								H_VALIDATORS.decimalLiteral(k_factory.decimalLiteral(s_mut), s_mut);
							});
						});
				}

				it('decimal(""+Number.MAX_VALUE)', () => {
					expect(() => k_factory.decimalLiteral(''+Number.MAX_VALUE)).to.throw();
				});

				it('decimal(""+Number.MIN_VALUE)', () => {
					expect(() => k_factory.decimalLiteral(''+Number.MIN_VALUE)).to.throw();
				});


				it('decimal("")', () => {
					expect(() => k_factory.decimalLiteral()).to.throw();
				});

				it('decimal("never")', () => {
					expect(() => k_factory.decimalLiteral('never')).to.throw();
				});

				it('decimal()', () => {
					expect(() => k_factory.decimalLiteral()).to.throw();
				});

				it('decimal(null)', () => {
					expect(() => k_factory.decimalLiteral(null)).to.throw();
				});

				it('decimal({})', () => {
					expect(() => k_factory.decimalLiteral({})).to.throw();
				});

				it('decimal("Infinity")', () => {
					expect(() => k_factory.decimalLiteral('Infinity')).to.throw();
				});

				it('decimal("INF")', () => {
					expect(() => k_factory.decimalLiteral('INF')).to.throw();
				});

				it('decimal("-INF")', () => {
					expect(() => k_factory.decimalLiteral('-INF')).to.throw();
				});

				it('decimal("NaN")', () => {
					expect(() => k_factory.decimalLiteral('NaN')).to.throw();
				});

				const kt_literal = k_factory.decimalLiteral(5.1);
				const p_iri_datatype = `${P_IRI_XSD}decimal`;
				const h_prefixes = {
					xsd: P_IRI_XSD,
				};

				it('#clone()', () => {
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.decimalLiteral(kt_clone, '5.1');
				});

				it('#concise()', () => {
					expect(kt_literal.concise()).to.equal(`^>${p_iri_datatype}"5.1`);
				});

				it('#concise({})', () => {
					expect(kt_literal.concise({})).to.equal(`^>${p_iri_datatype}"5.1`);
				});

				it('#concise(h_prefixes)', () => {
					expect(kt_literal.concise(h_prefixes)).to.equal(`^xsd:decimal"5.1`);
				});

				it('#terse()', () => {
					expect(kt_literal.terse()).to.equal(`5.1`);
				});

				it('5#terse()', () => {
					expect(k_factory.decimalLiteral(5).terse()).to.equal(`5.0`);
				});

				it('#terse({})', () => {
					expect(kt_literal.terse({})).to.equal(`5.1`);
				});

				it('#terse(h_prefixes)', () => {
					expect(kt_literal.terse(h_prefixes)).to.equal(`5.1`);
				});

				it('#star()', () => {
					expect(kt_literal.star()).to.equal(`5.1`);
				});

				it('#star({})', () => {
					expect(kt_literal.star({})).to.equal(`5.1`);
				});

				it('#star(h_prefixes)', () => {
					expect(kt_literal.star(h_prefixes)).to.equal(`5.1`);
				});

				it('#verbose()', () => {
					expect(kt_literal.verbose()).to.equal(`"5.1"^^<${p_iri_datatype}>`);
				});

				it('#isolate()', () => {
					expect(kt_literal.isolate()).to.eql({
						termType: 'Literal',
						value: '5.1',
						language: '',
						datatype: {
							termType: 'NamedNode',
							value: P_IRI_XSD+'decimal',
						},
					});
				});

				it('#hash()', () => {
					expect(kt_literal.hash()).to.equal(hash(`^>${p_iri_datatype}"5.1`));
				});

				it('keeps precision ("5.0")', () => {
					expect(k_factory.decimalLiteral('5.0')).to.include({
						isNumberPrecise: true,
					});
				});

				it('keeps precision ("5")', () => {
					expect(k_factory.decimalLiteral('5')).to.include({
						isNumberPrecise: true,
					});
				});

				it('keeps precision (5)', () => {
					expect(k_factory.decimalLiteral(5)).to.include({
						isNumberPrecise: true,
					});
				});

				it('keeps precision (5.1)', () => {
					expect(k_factory.decimalLiteral(5.1)).to.include({
						isNumberPrecise: true,
					});
				});

				it('keeps precision: normalized leading zeroes', () => {
					expect(k_factory.decimalLiteral('000.1')).to.include({
						isNumberPrecise: true,
					});
					expect(k_factory.decimalLiteral('-000.1')).to.include({
						isNumberPrecise: true,
					});
				});

				it('keeps precision: normalized leading decimal', () => {
					expect(k_factory.decimalLiteral('.1')).to.include({
						isNumberPrecise: true,
					});
					expect(k_factory.decimalLiteral('-.1')).to.include({
						isNumberPrecise: true,
					});
				});

				it('keeps precision: normalized leading and trailing zeroes', () => {
					const s_decimal = '0'.repeat(50)+'0.1'+'0'.repeat(50);
					expect(k_factory.decimalLiteral(s_decimal)).to.include({
						isNumberPrecise: true,
					});
					expect(k_factory.decimalLiteral('-'+s_decimal)).to.include({
						isNumberPrecise: true,
					});
				});

				it('loses precision: normalized', () => {
					const s_decimal = '0.'+'1'.repeat(18);
					expect(k_factory.decimalLiteral(s_decimal)).to.include({
						isNumberPrecise: false,
					});
					expect(k_factory.decimalLiteral('-'+s_decimal)).to.include({
						isNumberPrecise: false,
					});
				});

				it('loses precision: non-normalized leading zeroes', () => {
					const s_decimal = '000.'+'1'.repeat(18);
					expect(k_factory.decimalLiteral(s_decimal)).to.include({
						isNumberPrecise: false,
					});
					expect(k_factory.decimalLiteral('-'+s_decimal)).to.include({
						isNumberPrecise: false,
					});
				});

				it('loses precision: non-normalized leading and trailing zeroes', () => {
					const s_decimal = '0'.repeat(50)+'.'+'1'.repeat(18)+'0'.repeat(50);
					expect(k_factory.decimalLiteral(s_decimal)).to.include({
						isNumberPrecise: false,
					});
					expect(k_factory.decimalLiteral('-'+s_decimal)).to.include({
						isNumberPrecise: false,
					});
				});

				it('loses precision: non-normalized leading decimal', () => {
					const s_decimal = '.'+'1'.repeat(18);
					expect(k_factory.decimalLiteral(s_decimal)).to.include({
						isNumberPrecise: false,
					});
					expect(k_factory.decimalLiteral('-'+s_decimal)).to.include({
						isNumberPrecise: false,
					});
				});

				it('keeps precision: normalized leading and trailing zeroes', () => {
					const s_decimal = '0'.repeat(50)+'0.1'+'0'.repeat(50);
					expect(k_factory.decimalLiteral(s_decimal)).to.include({
						isNumberPrecise: true,
					});
					expect(k_factory.decimalLiteral('-'+s_decimal)).to.include({
						isNumberPrecise: true,
					});
				});
			});

			describe('Date Literal', () => {
				it('date()', () => {
					H_VALIDATORS.dateLiteral(k_factory.dateLiteral());
				});

				const dt_now = new Date();

				it('date(dt_now)', () => {
					H_VALIDATORS.dateLiteral(k_factory.dateLiteral(dt_now), dt_now);
				});

				it('date(""+dt_now)', () => {
					expect(() => k_factory.dateLiteral(''+dt_now)).to.throw();
				});

				it('date()', () => {
					expect(() => H_VALIDATORS.dateLiteral()).to.throw();
				});

				it('date(1)', () => {
					expect(() => H_VALIDATORS.dateLiteral(1)).to.throw();
				});

				it('date("")', () => {
					expect(() => H_VALIDATORS.dateLiteral('')).to.throw();
				});

				it('date("2020-02-02")', () => {
					H_VALIDATORS.dateLiteral(k_factory.dateLiteral('2020-02-02'), '2020-02-02');
				});

				it('date("0000-13-01")', () => {
					expect(() => k_factory.dateLiteral('0000-13-00')).to.throw();
				});

				it('date("0000-01-32")', () => {
					expect(() => k_factory.dateLiteral('0000-01-32')).to.throw();
				});

				it('#clone()', () => {
					const kt_literal = k_factory.dateLiteral('2020-02-02');
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.dateLiteral(kt_clone, '2020-02-02');
				});
			});

			describe('DateTime Literal', () => {
				it('dateTime()', () => {
					H_VALIDATORS.dateTimeLiteral(k_factory.dateTimeLiteral());
				});

				const dt_now = new Date();

				it('dateTime(dt_now)', () => {
					H_VALIDATORS.dateTimeLiteral(k_factory.dateTimeLiteral(dt_now), dt_now);
				});

				it('dateTime(""+dt_now)', () => {
					expect(() => k_factory.dateTimeLiteral(''+dt_now)).to.throw();
				});

				it('dateTime()', () => {
					expect(() => H_VALIDATORS.dateTimeLiteral()).to.throw();
				});

				it('dateTime(1)', () => {
					expect(() => H_VALIDATORS.dateTimeLiteral(1)).to.throw();
				});

				it('dateTime("")', () => {
					expect(() => H_VALIDATORS.dateTimeLiteral('')).to.throw();
				});

				it('dateTime("2020-02-02T02:02:02")', () => {
					H_VALIDATORS.dateTimeLiteral(k_factory.dateTimeLiteral('2020-02-02T02:02:02'), '2020-02-02T02:02:02');
				});

				it('dateTime("0101-01-01T25:00:00Z")', () => {
					expect(() => k_factory.dateTimeLiteral('0101-01-01T25:00:00Z')).to.throw();
				});

				it('dateTime("0101-01-01T00:61:00Z")', () => {
					expect(() => k_factory.dateTimeLiteral('0101-01-01T00:61:00Z')).to.throw();
				});

				it('#clone()', () => {
					const kt_literal = k_factory.dateTimeLiteral(dt_now);
					const kt_clone = kt_literal.clone();
					expect_original_replaced_equals(kt_literal, kt_clone, true);
					H_VALIDATORS.dateTimeLiteral(kt_clone, dt_now);
				});
			});

			describe('Replaced Literals', () => {
				it('loses precision: normalized leading and trailing zeroes', () => {
					const s_decimal = '5.'+'1'.repeat(20);
					const k_literal = k_factory.literal(s_decimal);
					const k_trans = k_literal.replaceIri(/string$/, 'decimal');
					H_VALIDATORS.decimalLiteral(k_trans, {value:s_decimal, precise:false});
				});
			});

			// describe('Mutable Literals', () => {
			// 	describe('simple => languaged', () => {
			// 		const k_literal = k_factory.literal('value');
			// 		k_literal.language = 'en';
			// 		const g_languaged = {value:'value', language:'en'};

			// 		it('#clone()', () => {
			// 			H_VALIDATORS.literal(k_literal.clone(), g_languaged);
			// 		});

			// 		it('#replaceIri("absent", "never")', () => {
			// 			H_VALIDATORS.literal(k_literal.replaceIri('absent', 'never'), g_languaged);
			// 		});

			// 		it('#replaceText("absent", "never")', () => {
			// 			H_VALIDATORS.literal(k_literal.replaceText('absent', 'never'), g_languaged);
			// 		});

			// 		it('#replaceText("value", "replaced")', () => {
			// 			H_VALIDATORS.literal(k_literal.replaceText('value', 'replaced'), {value:'replaced', language:'en'});
			// 		});

			// 		it('#replaceValue("absent", "never")', () => {
			// 			H_VALIDATORS.literal(k_literal.replaceValue('absent', 'never'), g_languaged);
			// 		});

			// 		it('#replaceValue("value", "replaced")', () => {
			// 			H_VALIDATORS.literal(k_literal.replaceValue('value', 'replaced'), {value:'replaced', language:'en'});
			// 		});
			// 	});

			// 	describe('simple => datatyped', () => {
			// 		const k_literal = k_factory.literal('value');
			// 		const p_iri_datatype = 'https://graphy.link/tests#datatype';
			// 		k_literal.dataype = p_iri_datatype;
			// 		const g_languaged = {value:'value', datatype:p_iri_datatype};

			// 		it('#clone()', () => {
			// 			H_VALIDATORS.literal(k_literal.clone(), g_languaged);
			// 		});

			// 		it('#replaceText("value", "replaced")', () => {
			// 			H_VALIDATORS.literal(k_literal.replaceText('value', 'replaced'), {value:'replaced', datatype:p_iri_datatype});
			// 		});
			// 	});
			// });

			describe('Quad w/o explicit graph', () => {
				const p_iri_tests = 'https://graphy.link/tests#';
				const kt_datatype = k_factory.namedNode(p_iri_tests+'datatype');
				const h_prefixes = {
					tests: p_iri_tests,
				};
				const kt_subject = k_factory.blankNode('subject');
				const kt_predicate = k_factory.namedNode(p_iri_tests+'predicate');
				const kt_object = k_factory.literal('value', kt_datatype);
				const kq_quad = k_factory.quad(kt_subject, kt_predicate, kt_object);

				it('#equals(this)', () => {
					expect(kq_quad.equals(kq_quad)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kq_quad.equals(k_factory.quad(...[
						k_factory.blankNode('subject'),
						k_factory.namedNode(p_iri_tests+'predicate'),
						k_factory.literal('value', kt_datatype),
					]))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kq_quad.equals(kq_quad.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kq_quad.equals({
						termType: 'Quad',
						value: '',
						subject: {
							termType: 'BlankNode',
							value: 'subject',
						},
						predicate: {
							termType: 'NamedNode',
							value: p_iri_tests+'predicate',
						},
						object: {
							termType: 'Literal',
							value: 'value',
							language: '',
							datatype: {
								termType: 'NamedNode',
								value: `${p_iri_tests}datatype`,
							},
						},
						graph: {
							termType: 'DefaultGraph',
							value: '',
						},
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kq_quad.concise()).to.eql(
						'*'
						+'\t_:subject'
						+'\r>'+p_iri_tests+'predicate'
						+`\n^>${p_iri_tests}datatype"value`
					);
				});

				it('#concise(h_prefixes)', () => {
					expect(kq_quad.concise(h_prefixes)).to.eql(
						'*'
						+'\t_:subject'
						+'\rtests:predicate'
						+`\n^tests:datatype"value`
					);
				});

				it('#terse()', () => {
					expect(kq_quad.terse()).to.equal(`_:subject <${p_iri_tests}predicate> "value"^^<${p_iri_tests}datatype> .`);
				});

				it('#terse(h_prefixes)', () => {
					expect(kq_quad.terse(h_prefixes)).to.equal(`_:subject tests:predicate "value"^^tests:datatype .`);
				});

				it('#star()', () => {
					expect(kq_quad.star()).to.equal(`<< _:subject <${p_iri_tests}predicate> "value"^^<${p_iri_tests}datatype> >>`);
				});

				it('#star(h_prefixes)', () => {
					expect(kq_quad.star(h_prefixes)).to.equal(`<< _:subject tests:predicate "value"^^tests:datatype >>`);
				});

				it('#verbose()', () => {
					expect(kq_quad.verbose()).to.equal(`_:subject <${p_iri_tests}predicate> "value"^^<${p_iri_tests}datatype> .`);
				});

				it('#isolate()', () => {
					expect(kq_quad.isolate()).to.eql({
						termType: 'Quad',
						value: '',
						subject: {
							termType: 'BlankNode',
							value: 'subject',
						},
						predicate: {
							termType: 'NamedNode',
							value: p_iri_tests+'predicate',
						},
						object: {
							termType: 'Literal',
							value: 'value',
							language: '',
							datatype: {
								termType: 'NamedNode',
								value: `${p_iri_tests}datatype`,
							},
						},
						graph: {
							termType: 'DefaultGraph',
							value: '',
						},
					});
				});
			});

			describe('Quad w/ graph', () => {
				const p_iri_tests = 'https://graphy.link/tests#';
				const kt_datatype = k_factory.namedNode(p_iri_tests+'datatype');
				const h_prefixes = {
					tests: p_iri_tests,
				};
				const kt_subject = k_factory.blankNode('subject');
				const kt_predicate = k_factory.namedNode(p_iri_tests+'predicate');
				const kt_object = k_factory.literal('value', kt_datatype);
				const kt_graph = k_factory.namedNode(p_iri_tests+'graph');
				const kq_quad = k_factory.quad(kt_subject, kt_predicate, kt_object, kt_graph);

				it('#equals(this)', () => {
					expect(kq_quad.equals(kq_quad)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kq_quad.equals(k_factory.quad(...[
						k_factory.blankNode('subject'),
						k_factory.namedNode(p_iri_tests+'predicate'),
						k_factory.literal('value', kt_datatype),
						k_factory.namedNode(p_iri_tests+'graph'),
					]))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kq_quad.equals(kq_quad.isolate())).to.be.true;
				});

				it('#equals(similar)', () => {
					expect(kq_quad.equals({
						subject: {
							termType: 'BlankNode',
							value: 'subject',
						},
						predicate: {
							termType: 'NamedNode',
							value: p_iri_tests+'predicate',
						},
						object: {
							termType: 'Literal',
							value: 'value',
							language: '',
							datatype: {
								termType: 'NamedNode',
								value: `${p_iri_tests}datatype`,
							},
						},
						graph: {
							termType: 'NamedNode',
							value: p_iri_tests+'graph',
						},
					})).to.be.true;
				});

				it('#concise()', () => {
					expect(kq_quad.concise()).to.equal(
						'>'+p_iri_tests+'graph'
						+'\t_:subject'
						+'\r>'+p_iri_tests+'predicate'
						+`\n^>${p_iri_tests}datatype"value`
					);
				});

				it('#concise(h_prefixes)', () => {
					expect(kq_quad.concise(h_prefixes)).to.equal(
						'tests:graph'
						+'\t_:subject'
						+'\rtests:predicate'
						+`\n^tests:datatype"value`
					);
				});

				it('#terse()', () => {
					expect(kq_quad.terse()).to.equal(`<${p_iri_tests}graph> { _:subject <${p_iri_tests}predicate> "value"^^<${p_iri_tests}datatype> . }`);
				});

				it('#terse(h_prefixes)', () => {
					expect(kq_quad.terse(h_prefixes)).to.equal(`tests:graph { _:subject tests:predicate "value"^^tests:datatype . }`);
				});

				it('#star()', () => {
					expect(kq_quad.star()).to.equal(`<< _:subject <${p_iri_tests}predicate> "value"^^<${p_iri_tests}datatype> <${p_iri_tests}graph> >>`);
				});

				it('#star(h_prefixes)', () => {
					expect(kq_quad.star(h_prefixes)).to.equal(`<< _:subject tests:predicate "value"^^tests:datatype tests:graph >>`);
				});

				it('#verbose()', () => {
					expect(kq_quad.verbose()).to.equal(`_:subject <${p_iri_tests}predicate> "value"^^<${p_iri_tests}datatype> <${p_iri_tests}graph> .`);
				});

				it('#isolate()', () => {
					expect(kq_quad.isolate()).to.eql({
						termType: 'Quad',
						value: '',
						subject: {
							termType: 'BlankNode',
							value: 'subject',
						},
						predicate: {
							termType: 'NamedNode',
							value: p_iri_tests+'predicate',
						},
						object: {
							termType: 'Literal',
							value: 'value',
							language: '',
							datatype: {
								termType: 'NamedNode',
								value: `${p_iri_tests}datatype`,
							},
						},
						graph: {
							termType: 'NamedNode',
							value: p_iri_tests+'graph',
						},
					});
				});

				it('#valueOf()', () => {
					expect(kq_quad.valueOf()).to.equal(`_:subject <${p_iri_tests}predicate> "value"^^<${p_iri_tests}datatype> <${p_iri_tests}graph> .`);
				});

				it('#toString()', () => {
					expect(kq_quad+'').to.equal(`_:subject <${p_iri_tests}predicate> "value"^^<${p_iri_tests}datatype> <${p_iri_tests}graph> .`);
				});

				it('#gspo()', () => {
					expect(kq_quad.gspo()).to.eql([kt_graph, kt_subject, kt_predicate, kt_object]);
				});

				it('#spog()', () => {
					expect(kq_quad.spog()).to.eql([kt_subject, kt_predicate, kt_object, kt_graph]);
				});

				it('#hash()', () => {
					expect(kq_quad.hash()).to.equal(hash(
						'>'+p_iri_tests+'graph'
						+'\t_:subject'
						+'\r>'+p_iri_tests+'predicate'
						+`\n^>${p_iri_tests}datatype"value`
					));
				});

				it('#reify()', () => {
					const {
						node: kt_bnode,
						quads: [
							kq_type,
							kq_subject,
							kq_predicate,
							kq_object,
						],
					} = kq_quad.reify();

					H_VALIDATORS.blankNode(kq_type.subject, null);
					expect(kq_type.subject).to.equal(kt_bnode);
					H_VALIDATORS.namedNode(kq_type.predicate, P_IRI_RDF+'type');
					H_VALIDATORS.namedNode(kq_type.object, P_IRI_RDF+'Statement');
					H_VALIDATORS.defaultGraph(kq_type.graph);

					H_VALIDATORS.blankNode(kq_subject.subject, null);
					expect(kq_subject.subject).to.equal(kt_bnode);
					H_VALIDATORS.namedNode(kq_subject.predicate, P_IRI_RDF+'subject');
					expect(kq_subject.object).to.equal(kt_subject);
					H_VALIDATORS.defaultGraph(kq_subject.graph);

					H_VALIDATORS.blankNode(kq_predicate.subject, null);
					expect(kq_predicate.subject).to.equal(kt_bnode);
					H_VALIDATORS.namedNode(kq_predicate.predicate, P_IRI_RDF+'predicate');
					expect(kq_predicate.object).to.equal(kt_predicate);
					H_VALIDATORS.defaultGraph(kq_predicate.graph);

					H_VALIDATORS.blankNode(kq_object.subject, null);
					expect(kq_object.subject).to.equal(kt_bnode);
					H_VALIDATORS.namedNode(kq_object.predicate, P_IRI_RDF+'object');
					expect(kq_object.object).to.equal(kt_object);
					H_VALIDATORS.defaultGraph(kq_object.graph);
				});

				it('#reify("label")', () => {
					const {
						node: kt_bnode,
						quads: [
							kq_type,
							kq_subject,
							kq_predicate,
							kq_object,
						],
					} = kq_quad.reify('label');

					H_VALIDATORS.blankNode(kq_type.subject, 'label');
					expect(kq_type.subject).to.equal(kt_bnode);
					H_VALIDATORS.namedNode(kq_type.predicate, P_IRI_RDF+'type');
					H_VALIDATORS.namedNode(kq_type.object, P_IRI_RDF+'Statement');
					H_VALIDATORS.defaultGraph(kq_type.graph);

					H_VALIDATORS.blankNode(kq_subject.subject, 'label');
					expect(kq_subject.subject).to.equal(kt_bnode);
					H_VALIDATORS.namedNode(kq_subject.predicate, P_IRI_RDF+'subject');
					expect(kq_subject.object).to.equal(kt_subject);
					H_VALIDATORS.defaultGraph(kq_subject.graph);

					H_VALIDATORS.blankNode(kq_predicate.subject, 'label');
					expect(kq_predicate.subject).to.equal(kt_bnode);
					H_VALIDATORS.namedNode(kq_predicate.predicate, P_IRI_RDF+'predicate');
					expect(kq_predicate.object).to.equal(kt_predicate);
					H_VALIDATORS.defaultGraph(kq_predicate.graph);

					H_VALIDATORS.blankNode(kq_object.subject, 'label');
					expect(kq_object.subject).to.equal(kt_bnode);
					H_VALIDATORS.namedNode(kq_object.predicate, P_IRI_RDF+'object');
					expect(kq_object.object).to.equal(kt_object);
					H_VALIDATORS.defaultGraph(kq_object.graph);
				});

				it('#clone()', () => {
					const kq_clone = kq_quad.clone();
					expect_original_replaced_equals(kq_quad, kq_clone, true);
					H_VALIDATORS.quad(kq_clone, kq_quad);
				});

				const kt_s = k_factory.namedNode(p_iri_tests+'subject');
				const kt_p = k_factory.namedNode(p_iri_tests+'predicate');
				const kt_o = k_factory.literal('value', k_factory.namedNode(p_iri_tests+'object'));
				const kt_g = k_factory.namedNode(p_iri_tests+'graph');

				const kq_test = k_factory.quad(kt_s, kt_p, kt_o, kt_g);

				test_replacements({
					input: kq_test,
					validate: H_VALIDATORS.quad,
					identity: () => [kq_test],
					replace: {
						iri: (w_s, w_r) => [k_factory.quad(kt_s.replaceIri(w_s, w_r), kt_p.replaceIri(w_s, w_r), kt_o.replaceIri(w_s, w_r), kt_g.replaceIri(w_s, w_r))],
						text: (w_s, w_r) => [k_factory.quad(kt_s, kt_p, kt_o.replaceText(w_s, w_r), kt_g)],
						value: (w_s, w_r) => [k_factory.quad(kt_s.replaceValue(w_s, w_r), kt_p.replaceValue(w_s, w_r), kt_o.replaceValue(w_s, w_r), kt_g.replaceValue(w_s, w_r))],
					},
					map: {
						iri: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
							],
							replaces: [
								['tests', 'replaced'],
								[/tests/, 'replaced'],
								[/t/g, 'x'],
							],
						},
						text: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
							],
							replaces: [
								['value', 'replaced'],
								[/value/, 'replaced'],
								[/v/g, 'x'],
							],
						},
						value: {
							clones: [
								['absent', 'never'],
								[/absent/, 'never'],
							],
							replaces: [
								['tests', 'replaced'],
								[/tests/, 'replaced'],
								[/t/g, 'x'],
							],
						},
					},
				});
			});


			describe('Quad w/ RDF* terms', () => {
				const p_iri_tests = 'https://graphy.link/tests#';
				const kt_datatype = k_factory.namedNode(p_iri_tests+'datatype');
				const h_prefixes = {
					rdf: P_IRI_RDF,
					tests: p_iri_tests,
				};
				const kt_subject = k_factory.quad(...[
					k_factory.namedNode(p_iri_tests+'nested-s-subject'),
					k_factory.namedNode(p_iri_tests+'nested-s-predicate'),
					k_factory.namedNode(p_iri_tests+'nested-s-object'),
				]);
				const kt_predicate = k_factory.namedNode(p_iri_tests+'predicate');
				const kt_object = k_factory.quad(...[
					k_factory.namedNode(p_iri_tests+'nested-o-subject'),
					k_factory.namedNode(p_iri_tests+'nested-o-predicate'),
					k_factory.literal('nested-o-object', kt_datatype),
				]);
				const kt_graph = k_factory.namedNode(p_iri_tests+'graph');
				const kq_quad = k_factory.quad(kt_subject, kt_predicate, kt_object, kt_graph);

				const h_quad_isolate = {
					termType: 'Quad',
					value: '',
					subject: {
						termType: 'Quad',
						value: '',
						subject: {
							termType: 'NamedNode',
							value: p_iri_tests+'nested-s-subject',
						},
						predicate: {
							termType: 'NamedNode',
							value: p_iri_tests+'nested-s-predicate',
						},
						object: {
							termType: 'NamedNode',
							value: p_iri_tests+'nested-s-object',
						},
						graph: {
							termType: 'DefaultGraph',
							value: '',
						},
					},
					predicate: {
						termType: 'NamedNode',
						value: p_iri_tests+'predicate',
					},
					object: {
						termType: 'Quad',
						value: '',
						subject: {
							termType: 'NamedNode',
							value: p_iri_tests+'nested-o-subject',
						},
						predicate: {
							termType: 'NamedNode',
							value: p_iri_tests+'nested-o-predicate',
						},
						object: {
							termType: 'Literal',
							value: 'nested-o-object',
							language: '',
							datatype: {
								termType: 'NamedNode',
								value: `${p_iri_tests}datatype`,
							},
						},
						graph: {
							termType: 'DefaultGraph',
							value: '',
						},
					},
					graph: {
						termType: 'NamedNode',
						value: p_iri_tests+'graph',
					},
				};

				it('#equals(this)', () => {
					expect(kq_quad.equals(kq_quad)).to.be.true;
				});

				it('#equals(other)', () => {
					expect(kq_quad.equals(k_factory.quad(...[
						k_factory.quad(...[
							k_factory.namedNode(p_iri_tests+'nested-s-subject'),
							k_factory.namedNode(p_iri_tests+'nested-s-predicate'),
							k_factory.namedNode(p_iri_tests+'nested-s-object'),
						]),
						k_factory.namedNode(p_iri_tests+'predicate'),
						k_factory.quad(...[
							k_factory.namedNode(p_iri_tests+'nested-o-subject'),
							k_factory.namedNode(p_iri_tests+'nested-o-predicate'),
							k_factory.literal('nested-o-object', kt_datatype),
						]),
						k_factory.namedNode(p_iri_tests+'graph'),
					]))).to.be.true;
				});

				it('#equals(isolate)', () => {
					expect(kq_quad.equals(kq_quad.isolate())).to.be.true;
				});

				it('#equals(diff)', () => {
					const kq_diff = k_factory.quad(...[
						k_factory.quad(...[
							k_factory.namedNode(p_iri_tests+'nested-s-subject'),
							k_factory.namedNode(p_iri_tests+'nested-s-predicate'),
							k_factory.namedNode(p_iri_tests+'nested-s-object'),
						]),
						k_factory.namedNode(p_iri_tests+'predicate'),
						k_factory.quad(...[
							k_factory.namedNode(p_iri_tests+'nested-o-subject'),
							k_factory.namedNode(p_iri_tests+'nested-o-predicate'),
							k_factory.literal('nested-o-diff', kt_datatype),
						]),
					]);

					expect(kq_quad.equals(kq_diff)).to.be.false;
				});

				it('#equals(similar)', () => {
					expect(kq_quad.equals(h_quad_isolate)).to.be.true;
				});

				// it('#concise()', () => {
				// 	expect(kq_quad.concise()).to.eql(
				// 		'>'+p_iri_tests+'graph'
				// 		+'\t_:subject'
				// 		+'\r>'+p_iri_tests+'predicate'
				// 		+`\n^>${p_iri_tests}datatype"value`
				// 	);
				// });

				// it('#concise(h_prefixes)', () => {
				// 	expect(kq_quad.concise(h_prefixes)).to.eql(
				// 		'tests:graph'
				// 		+'\t_:subject'
				// 		+'\rtests:predicate'
				// 		+`\n^tests:datatype"value`
				// 	);
				// });

				it('#terse()', () => {
					expect(kq_quad.terse({})).to.equal(`${kt_graph.terse()} {`
						+' [ a <http://www.w3.org/1999/02/22-rdf-syntax-ns#Statement> ;'
						+`\n\t<http://www.w3.org/1999/02/22-rdf-syntax-ns#subject> ${kt_subject.subject.terse()} ;`
						+`\n\t<http://www.w3.org/1999/02/22-rdf-syntax-ns#predicate> ${kt_subject.predicate.terse()} ;`
						+`\n\t<http://www.w3.org/1999/02/22-rdf-syntax-ns#object> ${kt_subject.object.terse()} ;`
						+`\n\t] ${kt_predicate.terse()} [ a <http://www.w3.org/1999/02/22-rdf-syntax-ns#Statement> ;`
						+`\n\t<http://www.w3.org/1999/02/22-rdf-syntax-ns#subject> ${kt_object.subject.terse()} ;`
						+`\n\t<http://www.w3.org/1999/02/22-rdf-syntax-ns#predicate> ${kt_object.predicate.terse()} ;`
						+`\n\t<http://www.w3.org/1999/02/22-rdf-syntax-ns#object> ${kt_object.object.terse()} ;`
						+'\n\t] . }'
					);
				});

				it('#terse(h_prefixes)', () => {
					expect(kq_quad.terse(h_prefixes)).to.equal(`${kt_graph.terse(h_prefixes)} {`
						+' [ a rdf:Statement ;'
						+`\n\trdf:subject ${kt_subject.subject.terse(h_prefixes)} ;`
						+`\n\trdf:predicate ${kt_subject.predicate.terse(h_prefixes)} ;`
						+`\n\trdf:object ${kt_subject.object.terse(h_prefixes)} ;`
						+`\n\t] ${kt_predicate.terse(h_prefixes)} [ a rdf:Statement ;`
						+`\n\trdf:subject ${kt_object.subject.terse(h_prefixes)} ;`
						+`\n\trdf:predicate ${kt_object.predicate.terse(h_prefixes)} ;`
						+`\n\trdf:object ${kt_object.object.terse(h_prefixes)} ;`
						+'\n\t] . }'
					);
				});

				it('#star()', () => {
					expect(kq_quad.star()).to.equal('<< '
						+`<< <${p_iri_tests}nested-s-subject> <${p_iri_tests}nested-s-predicate> <${p_iri_tests}nested-s-object> >> `
						+`<${p_iri_tests}predicate> `
						+`<< <${p_iri_tests}nested-o-subject> <${p_iri_tests}nested-o-predicate> "nested-o-object"^^<${p_iri_tests}datatype> >> `
						+`<${p_iri_tests}graph> `
						+'>>');
				});

				it('#star(h_prefixes)', () => {
					expect(kq_quad.star(h_prefixes)).to.equal('<< '
						+`<< tests:nested-s-subject tests:nested-s-predicate tests:nested-s-object >> `
						+`tests:predicate `
						+`<< tests:nested-o-subject tests:nested-o-predicate "nested-o-object"^^tests:datatype >> `
						+`tests:graph `
						+'>>');
				});

				it('#verbose()', () => {
					expect(kq_quad.verbose()).to.be.a('string');
					// equal(''
					// 	+`_:subject <${p_iri_tests}predicate> "value"^^<${p_iri_tests}datatype> <${p_iri_tests}graph> .`
					// 	+`<< tests:nested-s-subject tests:nested-s-predicate tests:nested-s-object >> `
					// 	+`tests:predicate `
					// 	+`<< tests:nested-s-subject tests:nested-o-predicate "nested-o-object"^^tests:datatype >> `
					// 	+`tests:graph `
					// 	+'>>');
					// expect(kq_quad.verbose()).to.equal(`_:subject <${p_iri_tests}predicate> "value"^^<${p_iri_tests}datatype> <${p_iri_tests}graph> .`);
				});

				it('#isolate()', () => {
					expect(kq_quad.isolate()).to.eql(h_quad_isolate);
				});

				// const kt_s = k_factory.namedNode(p_iri_tests+'subject');
				// const kt_p = k_factory.namedNode(p_iri_tests+'predicate');
				// const kt_o = k_factory.literal('value', k_factory.namedNode(p_iri_tests+'object'));
				// const kt_g = k_factory.namedNode(p_iri_tests+'graph');

				// const kq_test = k_factory.quad(kt_s, kt_p, kt_o, kt_g);

				// test_replacements({
				// 	input: kq_test,
				// 	validate: H_VALIDATORS.quad,
				// 	identity: () => [kq_test],
				// 	replace: {
				// 		iri: (w_s, w_r) => [k_factory.quad(kt_s.replaceIri(w_s, w_r), kt_p.replaceIri(w_s, w_r), kt_o.replaceIri(w_s, w_r), kt_g.replaceIri(w_s, w_r))],
				// 		text: (w_s, w_r) => [k_factory.quad(kt_s, kt_p, kt_o.replaceText(w_s, w_r), kt_g)],
				// 		value: (w_s, w_r) => [k_factory.quad(kt_s.replaceValue(w_s, w_r), kt_p.replaceValue(w_s, w_r), kt_o.replaceValue(w_s, w_r), kt_g.replaceValue(w_s, w_r))],
				// 	},
				// 	map: {
				// 		iri: {
				// 			clones: [
				// 				['absent', 'never'],
				// 				[/absent/, 'never'],
				// 			],
				// 			replaces: [
				// 				['tests', 'replaced'],
				// 				[/tests/, 'replaced'],
				// 				[/t/g, 'x'],
				// 			],
				// 		},
				// 		text: {
				// 			clones: [
				// 				['absent', 'never'],
				// 				[/absent/, 'never'],
				// 			],
				// 			replaces: [
				// 				['value', 'replaced'],
				// 				[/value/, 'replaced'],
				// 				[/v/g, 'x'],
				// 			],
				// 		},
				// 		value: {
				// 			clones: [
				// 				['absent', 'never'],
				// 				[/absent/, 'never'],
				// 			],
				// 			replaces: [
				// 				['tests', 'replaced'],
				// 				[/tests/, 'replaced'],
				// 				[/t/g, 'x'],
				// 			],
				// 		},
				// 	},
				// });
			});

			describe('Variable', () => {
				const kt_variable = k_factory.variable('label');

				it('variable("label")', () => {
					H_VALIDATORS.variable(kt_variable, 'label');
				});

				it('#concise()', () => {
					expect(kt_variable.concise()).to.equal('?label');
				});

				it('#concise({})', () => {
					expect(kt_variable.concise({})).to.equal('?label');
				});

				it('#terse()', () => {
					expect(kt_variable.terse()).to.equal('?label');
				});

				it('#terse({})', () => {
					expect(kt_variable.terse({})).to.equal('?label');
				});

				it('#star()', () => {
					expect(kt_variable.star()).to.equal('?label');
				});

				it('#star({})', () => {
					expect(kt_variable.star({})).to.equal('?label');
				});

				it('#terse()', () => {
					expect(kt_variable.terse()).to.equal('?label');
				});

				it('#terse({})', () => {
					expect(kt_variable.terse({})).to.equal('?label');
				});

				it('verbose()', () => {
					expect(() => kt_variable.verbose()).to.throw();
				});

				it('#isolate()', () => {
					expect(kt_variable.isolate()).to.include({
						termType: 'Variable',
						value: 'label',
					});
				});

				it('#hash()', () => {
					expect(kt_variable.hash()).to.equal(hash('?label'));
				});

				it('#clone()', () => {
					const kt_clone = kt_variable.clone();
					expect_original_replaced_equals(kt_variable, kt_clone, true);
					H_VALIDATORS.variable(kt_clone, 'label');
				});
			});
		});


		describe('unfiltered', () => {
			it('namedNode', () => {
				H_VALIDATORS.namedNode(k_factory.unfiltered.namedNode('value'), 'value');
			});

			it('blankNode', () => {
				H_VALIDATORS.blankNode(k_factory.unfiltered.blankNode('label'), 'label');
			});

			it('defaultGraph', () => {
				H_VALIDATORS.defaultGraph(k_factory.unfiltered.defaultGraph());
			});

			it('integer', () => {
				H_VALIDATORS.integerLiteral(k_factory.unfiltered.integerLiteral('5'), '5');
			});

			// double
			{
				for(const s_input of ['5.1', 'NaN', 'INF', '-INF']) {
					it('double: '+s_input, () => {  // eslint-disable-line no-loop-func
						H_VALIDATORS.doubleLiteral(k_factory.unfiltered.doubleLiteral(s_input), s_input);
					});
				}
			}

			it('decimal', () => {
				H_VALIDATORS.decimalLiteral(k_factory.unfiltered.decimalLiteral('5.11'), '5.11');
			});

			it('boolean: true', () => {
				H_VALIDATORS.booleanLiteral(k_factory.unfiltered.booleanLiteral('true'), 'true');
			});

			it('boolean: false', () => {
				H_VALIDATORS.booleanLiteral(k_factory.unfiltered.booleanLiteral('false'), 'false');
			});

			it('literal("test")', () => {
				H_VALIDATORS.literal(k_factory.unfiltered.literal('test'), {value:'test'});
			});

			it('literal("test", "en")', () => {
				H_VALIDATORS.literal(k_factory.unfiltered.literal('test', 'en'), {value:'test', language:'en'});
			});

			it('literal("test", xsd:integer)', () => {
				H_VALIDATORS.literal(k_factory.unfiltered.literal('test', k_factory.namedNode('z://y/')), {value:'test', datatype:'z://y/'});
			});

			it('simpleLiteral("test")', () => {
				H_VALIDATORS.literal(k_factory.unfiltered.simpleLiteral('test'), {value:'test'});
			});

			it('languagedLiteral("test", "en")', () => {
				H_VALIDATORS.literal(k_factory.unfiltered.languagedLiteral('test', 'en'), {value:'test', language:'en'});
			});

			it('datatypedLiteral("test", xsd:integer)', () => {
				H_VALIDATORS.literal(k_factory.unfiltered.datatypedLiteral('test', k_factory.namedNode('z://y/')), {value:'test', datatype:'z://y/'});
			});

			it('datatypedLiteral("test", xsd:string)', () => {
				H_VALIDATORS.literal(k_factory.unfiltered.datatypedLiteral('test', k_factory.namedNode(P_IRI_XSD+'string')), {value:'test'});
			});


			const g_validate_quad = {
				subject: {
					termType: 'BlankNode',
					value: 'subject',
				},
				predicate: {
					termType: 'NamedNode',
					value: 'https://graphy.link/predicate',
				},
				object: {
					termType: 'Literal',
					value: 'object',
					language: '',
					datatype: {
						termType: 'NamedNode',
						value: 'https://graphy.link/datatype',
					},
				},
				graph: {
					termType: 'DefaultGraph',
					value: '',
				},
			};

			it('quad', () => {
				H_VALIDATORS.quad(k_factory.unfiltered.quad(...[
					k_factory.blankNode('subject'),
					k_factory.namedNode('https://graphy.link/predicate'),
					k_factory.literal('object', k_factory.namedNode('https://graphy.link/datatype')),
					k_factory.defaultGraph(),
				]), g_validate_quad);
			});

			it('quad', () => {
				H_VALIDATORS.quad(k_factory.unfiltered.quad(...[
					k_factory.blankNode('subject'),
					k_factory.namedNode('https://graphy.link/predicate'),
					k_factory.literal('object', k_factory.namedNode('https://graphy.link/datatype')),
				]), g_validate_quad);
			});
		});

		describe('setBaseIri', () => {
			it('returns ref', () => {
				const h_prefixes = {};
				const h_returned = k_factory.setBaseIri(h_prefixes, 'z://base/');
				expect(h_returned).to.equal(h_prefixes);
			});

			it('has accessible cache key {#}', () => {
				const h_returned = k_factory.setBaseIri({}, 'z://base/');
				expect(h_returned).to.have.property(k_factory.SI_PREFIX_BASE);
			});

			it('requires absolute IRI', () => {
				expect(() => k_factory.setBaseIri({}, '//relative/')).to.throw();
			});
		});

		describe('cachePrefixes', () => {
			it('returns frozen ref {}', () => {
				const h_prefixes = {};
				const h_returned = k_factory.cachePrefixes(h_prefixes);
				expect(h_returned).to.equal(h_prefixes);
				expect(h_returned).to.be.frozen;
			});

			it('returns frozen ref {#}', () => {
				const h_prefixes = {a:'z://'};
				const h_returned = k_factory.cachePrefixes(h_prefixes);
				expect(h_returned).to.equal(h_prefixes);
				expect(h_returned).to.be.frozen;
			});

			it('has accessible cache key {#}', () => {
				const h_returned = k_factory.cachePrefixes({a:'z://'});
				expect(h_returned).to.have.property(k_factory.SI_PREFIX_CACHE);
			});

			it('use longest prefix', () => {
				const h_prefixes = k_factory.cachePrefixes({
					short: 'z://auth/',
					long: 'z://auth/path/full/',
					med: 'z://auth/path/',
				}, true);

				const kt_node = k_factory.namedNode('z://auth/path/full/node');
				expect(kt_node.terse(h_prefixes)).to.equal('long:node');
			});

			it('avoids invalid namespace', () => {
				const h_prefixes = k_factory.cachePrefixes({
					'#invalid': 'z://y/',
				}, true);

				const kt_node = k_factory.namedNode('z://y/test');
				expect(kt_node.terse(h_prefixes)).to.equal('<z://y/test>');
			});
		});

		describe('relatePrefixMaps/prefixMapsDiffer', () => {
			it('({}, {})', () => {
				expect(k_factory.relatePrefixMaps({}, {})).to.eql({
					relation: 'equal',
					conflicts: [],
				});
			});

			const h_a = {
				graphy: 'https://graphy.link/',
			};

			const h_b = {
				graphy: 'https://graphy.link/',
			};

			const h_c = {
				graphy: 'https://graphy.link/',
				other: 'https://other.org/',
			};

			const h_d = {
				other: 'https://other.org/',
			};

			const h_e = {
				graphy: 'https://graphy.link/',
				other: 'https://another.diff/',
			};

			const h_f = {
				graphy: 'https://graphy.link/',
				alter: 'https://alter.me/',
			};

			it('(a, a)', () => {
				expect(k_factory.relatePrefixMaps(h_a, h_a)).to.eql({
					relation: 'equal',
					conflicts: [],
				});
			});

			it('(a, b)', () => {
				expect(k_factory.relatePrefixMaps(h_a, h_b)).to.eql({
					relation: 'equal',
					conflicts: [],
				});
			});

			it('(a, c)', () => {
				expect(k_factory.relatePrefixMaps(h_a, h_c)).to.eql({
					relation: 'subset',
					conflicts: [],
				});
			});

			it('(a, d)', () => {
				expect(k_factory.relatePrefixMaps(h_a, h_d)).to.eql({
					relation: 'disjoint',
					conflicts: [],
				});
			});

			it('(c, a)', () => {
				expect(k_factory.relatePrefixMaps(h_c, h_a)).to.eql({
					relation: 'superset',
					conflicts: [],
				});
			});

			it('(c, e)', () => {
				expect(k_factory.relatePrefixMaps(h_c, h_e)).to.eql({
					relation: 'overlap',
					conflicts: ['other'],
				});
			});

			it('(c, f)', () => {
				expect(k_factory.relatePrefixMaps(h_c, h_f)).to.eql({
					relation: 'overlap',
					conflicts: [],
				});
			});

			it('differ(a, a)', () => {
				expect(k_factory.prefixMapsDiffer(h_a, h_a)).to.be.false;
			});

			it('differ(a, b)', () => {
				expect(k_factory.prefixMapsDiffer(h_a, h_b)).to.be.false;
			});

			it('differ(b, a)', () => {
				expect(k_factory.prefixMapsDiffer(h_b, h_a)).to.be.false;
			});

			it('differ(a, c)', () => {
				expect(k_factory.prefixMapsDiffer(h_a, h_c)).to.be.true;
			});

			it('differ(c, a)', () => {
				expect(k_factory.prefixMapsDiffer(h_c, h_a)).to.be.true;
			});

			it('differ(c, e)', () => {
				expect(k_factory.prefixMapsDiffer(h_c, h_e)).to.be.true;
			});

			it('differ(e, c)', () => {
				expect(k_factory.prefixMapsDiffer(h_e, h_c)).to.be.true;
			});
		});

		describe('adopt', () => {
			it('does not adopt self', () => {
				expect(k_factory.adopt(k_factory)).to.equal(k_factory);
			});

			it('does not adopt self unfiltered', () => {
				expect(k_factory.adopt(k_factory.unfiltered)).to.equal(k_factory.unfiltered);
			});

			it('ceritifies', () => {
				const k_copy = {...k_factory.unfiltered};
				delete k_copy.isGraphyDataFactoryCertified;
				expect(k_factory.adopt(k_copy)).to.eql({
					...k_copy,
					isGraphyDataFactoryCertified: true,
				});
			});

			it('works', () => {
				const k_adopted = k_factory.adopt({
					literal: k_factory.literal,
					namedNode: k_factory.namedNode,
				});

				H_VALIDATORS.booleanLiteral(k_adopted.booleanLiteral(true), true);
				H_VALIDATORS.integerLiteral(k_adopted.integerLiteral(2), 2);
				H_VALIDATORS.doubleLiteral(k_adopted.doubleLiteral(2.1), 2.1);
				H_VALIDATORS.decimalLiteral(k_adopted.decimalLiteral(2.11), '2.11');
				H_VALIDATORS.literal(k_adopted.simpleLiteral('simple'), {value:'simple'});
				H_VALIDATORS.literal(k_adopted.languagedLiteral('languaged', 'en'), {value:'languaged', language:'en'});
				H_VALIDATORS.literal(k_adopted.datatypedLiteral('datatyped', k_factory.namedNode('z://y/datatype')), {value:'datatyped', datatype:'z://y/datatype'});
			});
		});

		describe('terse', () => {

		});

		describe('concise', () => {
			it('uses cache', () => {
				const h_cache = k_factory.cachePrefixes({
					good: 'z://y/',
				});
				const sc1_test = k_factory.concise('z://y/test', h_cache);
				expect(sc1_test).to.equal('good:test');
			});
		});

		describe('from', () => {
			const kt_subj = k_factory.blankNode('subject');
			const kt_pred = k_factory.namedNode('z://y/pred');
			const kt_obj = k_factory.blankNode('obj');
			const kt_grph = k_factory.blankNode('graph');

			describe('fromTerm', () => {
				it('graphy', () => {
					H_VALIDATORS.namedNode(k_factory.fromTerm(k_factory.namedNode('z://y/')), 'z://y/');
				});

				it('non-graphy', () => {
					H_VALIDATORS.namedNode(k_factory.fromTerm({
						termType: 'NamedNode',
						value: 'z://y/',
					}), 'z://y/');
				});
			});

			describe('fromRdfjsTerm', () => {
				it('blankNode', () => {
					H_VALIDATORS.blankNode(k_factory.fromRdfjsTerm(k_factory.blankNode('label')), 'label');
				});

				it('simpleLiteral', () => {
					H_VALIDATORS.literal(k_factory.fromRdfjsTerm(k_factory.literal('value')), {value:'value'});
				});

				it('languagedLiteral', () => {
					H_VALIDATORS.literal(k_factory.fromRdfjsTerm(k_factory.literal('value', 'en')), {value:'value', language:'en'});
				});

				it('datatypedLiteral', () => {
					H_VALIDATORS.literal(k_factory.fromRdfjsTerm(k_factory.literal('value', k_factory.namedNode('z://y/'))), {value:'value', datatype:'z://y/'});
				});

				it('defaultGraph', () => {
					H_VALIDATORS.defaultGraph(k_factory.fromRdfjsTerm(k_factory.defaultGraph()));
				});

				it('variable', () => {
					H_VALIDATORS.variable(k_factory.fromRdfjsTerm(k_factory.variable('name')), 'name');
				});


				it('quad w/o graph', () => {
					H_VALIDATORS.quad(k_factory.fromRdfjsTerm({
						termType: 'Quad',
						value: '',
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
					}), {
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
						graph: k_factory.defaultGraph(),
					});
				});

				it('quad w/ graph', () => {
					H_VALIDATORS.quad(k_factory.fromRdfjsTerm({
						termType: 'Quad',
						value: '',
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
						graph: kt_grph,
					}), {
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
						graph: kt_grph,
					});
				});

				it('other', () => {
					expect(() => k_factory.fromRdfjsTerm({termType:'invalid', value:'value'})).to.throw();
				});
			});

			describe('fromQuad', () => {
				it('graph quad', () => {
					H_VALIDATORS.quad(k_factory.fromQuad(k_factory.quad(...[
						kt_subj,
						kt_pred,
						kt_obj,
					])), {
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
						graph: k_factory.defaultGraph(),
					});
				});

				it('rdfjs quad w/o graph', () => {
					H_VALIDATORS.quad(k_factory.fromQuad({
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
					}), {
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
						graph: k_factory.defaultGraph(),
					});
				});

				it('rdfjs quad w/ graph', () => {
					H_VALIDATORS.quad(k_factory.fromQuad({
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
						graph: kt_grph,
					}), {
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
						graph: kt_grph,
					});
				});
			});

			describe('fromRdfjsQuad', () => {
				it('rdfjs quad w/o graph', () => {
					H_VALIDATORS.quad(k_factory.fromRdfjsQuad({
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
					}), {
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
						graph: k_factory.defaultGraph(),
					});
				});

				it('rdfjs quad w/ graph', () => {
					H_VALIDATORS.quad(k_factory.fromRdfjsQuad({
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
						graph: kt_grph,
					}), {
						subject: kt_subj,
						predicate: kt_pred,
						object: kt_obj,
						graph: kt_grph,
					});
				});
			});

			describe('fromSparqlResult', () => {
				it('uri', () => {
					H_VALIDATORS.namedNode(k_factory.fromSparqlResult({
						type: 'uri',
						value: 'z://y/test',
					}), 'z://y/test');
				});

				it('literal', () => {
					H_VALIDATORS.literal(k_factory.fromSparqlResult({
						type: 'literal',
						value: 'value',
					}), {value:'value'});
				});

				it('typed-literal simple', () => {
					H_VALIDATORS.literal(k_factory.fromSparqlResult({
						type: 'typed-literal',
						value: 'value',
					}), {value:'value'});
				});

				it('typed-literal languaged', () => {
					H_VALIDATORS.literal(k_factory.fromSparqlResult({
						type: 'typed-literal',
						value: 'value',
						'xml:lang': 'en',
					}), {value:'value', language:'en'});
				});

				it('typed-literal datatyped', () => {
					H_VALIDATORS.literal(k_factory.fromSparqlResult({
						type: 'typed-literal',
						value: 'value',
						datatype: 'z://y/datatype',
					}), {value:'value', datatype:'z://y/datatype'});
				});

				it('typed-literal datatyped xsd:string', () => {
					H_VALIDATORS.literal(k_factory.fromSparqlResult({
						type: 'typed-literal',
						value: 'value',
						datatype: P_IRI_XSD+'string',
					}), {value:'value'});
				});

				it('bnode', () => {
					H_VALIDATORS.blankNode(k_factory.fromSparqlResult({
						type: 'bnode',
						value: 'label',
					}), 'label');
				});

				it('other', () => {
					expect(() => k_factory.fromSparqlResult({})).to.throw();
				});
			});
		});

		describe('c1', () => {
			describe('c1ToN3', () => {
				it('absolute IRI -> verbose', () => {
					expect(k_factory.c1ToN3('>z://y/iri')).to.equal('<z://y/iri>');
				});

				it('absolute IRI -> terse', () => {
					expect(k_factory.c1ToN3('>z://y/iri', {zy:'z://y/'})).to.equal('zy:iri');
				});

				it('labeled blank node', () => {
					expect(k_factory.c1ToN3('_:label')).to.equal('_:label');
				});

				it('anonymous blank node', () => {
					expect(k_factory.c1ToN3('_:')).to.be.a('string').that.startsWith('_:')
						.and.have.lengthOf.at.least(3);
				});

				it('ephemeral blank node verbose', () => {
					expect(k_factory.c1ToN3('_:#ephemeral')).to.be.a('string').that.startsWith('_:')
						.and.have.lengthOf.at.least(3);
				});

				it('ephemeral blank node terse', () => {
					expect(k_factory.c1ToN3('_:#ephemeral', {})).to.equal('[]');
				});

				it('simple literal', () => {
					expect(k_factory.c1ToN3('"value')).to.equal('"value"');
				});

				it('languaged literal', () => {
					expect(k_factory.c1ToN3('@en"value')).to.equal('"value"@en');
				});

				it('datatyped literal verbose -> verbose', () => {
					expect(k_factory.c1ToN3('^>z://y/datatype"value')).to.equal('"value"^^<z://y/datatype>');
				});

				it('datatyped literal verbose -> terse', () => {
					expect(k_factory.c1ToN3('^>z://y/datatype"value', {zy:'z://y/'})).to.equal('"value"^^zy:datatype');
				});

				it('datatyped literal terse -> verbose', () => {
					expect(k_factory.c1ToN3('^zy:datatype"value', {zy:'z://y/'}, true)).to.equal('"value"^^<z://y/datatype>');
				});

				it('datatyped literal terse -> terse', () => {
					expect(k_factory.c1ToN3('^zy:datatype"value', {zy:'z://y/'})).to.equal('"value"^^zy:datatype');
				});

				it('default graph', () => {
					expect(k_factory.c1ToN3('*')).to.equal('');
				});

				it('rdf type alias terse -> verbose implicit', () => {
					expect(k_factory.c1ToN3('a')).to.equal('<'+P_IRI_RDF+'type>');
				});

				it('rdf type alias terse -> verbose explicit', () => {
					expect(k_factory.c1ToN3('a', {}, true)).to.equal('<'+P_IRI_RDF+'type>');
				});

				it('rdf type alias terse -> terse', () => {
					expect(k_factory.c1ToN3('a', {})).to.equal('a');
				});

				it('rdf:type terse -> verbose', () => {
					expect(k_factory.c1ToN3('rdf:type', {rdf:P_IRI_RDF}, true)).to.equal('<'+P_IRI_RDF+'type>');
				});

				it('rdf:type terse -> terse', () => {
					expect(k_factory.c1ToN3('rdf:type', {rdf:P_IRI_RDF})).to.equal('rdf:type');
				});

				it('_prefix:local terse -> verbose', () => {
					expect(k_factory.c1ToN3('_prefix:local', {_prefix:'z://y/'}, true)).to.equal('<z://y/local>');
				});

				it('_prefix:local terse -> terse', () => {
					expect(k_factory.c1ToN3('_prefix:local', {_prefix:'z://y/'})).to.equal('<z://y/local>');
				});

				it('_prefix:full-stop.', () => {
					expect(k_factory.c1ToN3('_prefix:full-stop.', {_prefix:'z://y/'})).to.equal('<z://y/full-stop.>');
				});

				it('_local', () => {
					expect(k_factory.c1ToN3('_local', {'':'z://y/'})).to.equal('<z://y/local>');
				});

				it('invalid', () => {
					expect(() => k_factory.c1ToN3('invalid')).to.throw();
				});

				it('explicit iri', () => {
					expect(() => k_factory.c1ToN3('<z://y/iri>')).to.throw();
				});

				it('directive', () => {
					expect(() => k_factory.c1ToN3('`'+JSON.stringify({type:'comment', value:'comment'}))).to.throw();
				});
			});

			describe('c1ExpandData', () => {
				const h_prefixes = {
					'': 'z://y/',
					prefix: 'z://prefix/',
				};

				it('simple literal', () => {
					expect(k_factory.c1ExpandData('"value')).to.equal('"value');
				});

				it('languaged literal', () => {
					expect(k_factory.c1ExpandData('@en"value')).to.equal('@en"value');
				});

				it('absolute iri', () => {
					expect(k_factory.c1ExpandData('>z://y/iri')).to.equal('>z://y/iri');
				});

				it('blank node', () => {
					expect(k_factory.c1ExpandData('_:label')).to.equal('_:label');
				});

				it('default graph', () => {
					expect(k_factory.c1ExpandData('*')).to.equal('*');
				});

				it('prefixed name underscore', () => {
					expect(k_factory.c1ExpandData('_term', h_prefixes)).to.equal('>z://y/term');
				});

				it('prefixed name colon', () => {
					expect(k_factory.c1ExpandData(':term', h_prefixes)).to.equal('>z://y/term');
				});

				it('prefixed name word', () => {
					expect(k_factory.c1ExpandData('prefix:term', h_prefixes)).to.equal('>z://prefix/term');
				});

				it('datatyped literal absolute', () => {
					expect(k_factory.c1ExpandData('^>z://y/datatype"value', h_prefixes)).to.equal('^>z://y/datatype"value');
				});

				it('datatyped literal prefixed underscore', () => {
					expect(k_factory.c1ExpandData('^_datatype"value', h_prefixes)).to.equal('^>z://y/datatype"value');
				});

				it('datatyped literal prefixed colon', () => {
					expect(k_factory.c1ExpandData('^:datatype"value', h_prefixes)).to.equal('^>z://y/datatype"value');
				});

				it('variable', () => {
					expect(() => k_factory.c1FromSubjectRole(k_factory.variable('name'))).to.throw();
				});

				it('invalid', () => {
					expect(() => k_factory.c1ExpandData('invalid')).to.throw();
				});
			});

			{
				const h_prefixes = {
					'': 'z://y/',
				};

				const h_terms = {
					'named node absolute': [[k_factory.namedNode('z://y/iri')], '>z://y/iri'],
					'named node prefixed': [[k_factory.namedNode('z://y/iri'), h_prefixes], ':iri'],
					'blank node': [[k_factory.blankNode('label')], '_:label'],
					'default graph': [[k_factory.defaultGraph()], '*'],
					literal: [[k_factory.literal('value')], '"value'],
					'languaged literal': [[k_factory.literal('value', 'en')], '@en"value'],
					'datatyped literal absolute': [[k_factory.literal('value', k_factory.namedNode('z://y/datatype'))], '^>z://y/datatype"value'],
					'datatyped literal prefixed': [[k_factory.literal('value', k_factory.namedNode('z://y/datatype')), h_prefixes], '^:datatype"value'],
					variable: [[k_factory.variable('name')], '?name'],
					invalid: [[{}]],
				};

				const g_form_named_node = {
					accept: [
						'named node absolute',
						'named node prefixed',
					],
					reject: [
						'blank node',
						'default graph',
						'literal',
						'languaged literal',
						'datatyped literal absolute',
						'datatyped literal prefixed',
						'variable',
						'invalid',
					],
				};

				const h_froms = {
					graph: {
						accept: [
							'named node absolute',
							'named node prefixed',
							'blank node',
							'default graph',
						],
						reject: [
							'literal',
							'languaged literal',
							'datatyped literal absolute',
							'datatyped literal prefixed',
							'variable',
							'invalid',
						],
					},

					subject: {
						accept: [
							'named node absolute',
							'named node prefixed',
							'blank node',
						],
						reject: [
							'default graph',
							'literal',
							'languaged literal',
							'datatyped literal absolute',
							'datatyped literal prefixed',
							'variable',
							'invalid',
						],
					},

					predicate: g_form_named_node,
					datatype: g_form_named_node,

					object: {
						accept: [
							'named node absolute',
							'named node prefixed',
							'blank node',
							'literal',
							'languaged literal',
							'datatyped literal absolute',
							'datatyped literal prefixed',
						],
						reject: [
							'default graph',
							'variable',
							'invalid',
						],
					},
				};

				for(const [s_from, g_from] of Object.entries(h_froms)) {
					const s_from_proper = s_from[0].toUpperCase()+s_from.slice(1);
					const s_method = `c1From${s_from_proper}Role`;

					describe(s_method, () => {  // eslint-disable-line no-loop-func
						for(const s_test of g_from.accept) {
							const a_test = h_terms[s_test];

							it(s_test, () => {
								expect(k_factory[s_method](...a_test[0])).to.equal(a_test[1]);
							});
						}

						for(const s_test of g_from.reject) {
							it(s_test, () => {  // eslint-disable-line no-loop-func
								expect(() => k_factory[s_method](...h_terms[s_test][0])).to.throw();
							});
						}
					});
				}
			}
		});

		{
			const sv1_iri_base = '>https://graphy.link/';
			const sv1_iri_graph = `${sv1_iri_base}graph`;
			const sv1_iri_subject = `${sv1_iri_base}subject`;
			const sv1_iri_predicate = `${sv1_iri_base}predicate`;
			const sv1_iri_object = `${sv1_iri_base}object`;
			const sc1_lit_object = '@en"object';

			const hc3_triples = {
				[sv1_iri_subject]: {
					[sv1_iri_predicate]: [
						sv1_iri_object,
						sc1_lit_object,
					],
				},
			};

			describe('c3', () => {
				const dg_trips = k_factory.c3(hc3_triples);

				it('is iterable', () => {
					expect(dg_trips).to.be.iterable;
				});

				it('[...]', () => {
					const [
						kq_0,
						kq_1,
					] = [...dg_trips];

					H_VALIDATORS.quad(kq_0, {
						graph: k_factory.defaultGraph(),
						subject: k_factory.namedNode(sv1_iri_subject.slice(1)),
						predicate: k_factory.namedNode(sv1_iri_predicate.slice(1)),
						object: k_factory.namedNode(sv1_iri_object.slice(1)),
					});

					H_VALIDATORS.quad(kq_1, {
						graph: k_factory.defaultGraph(),
						subject: k_factory.namedNode(sv1_iri_subject.slice(1)),
						predicate: k_factory.namedNode(sv1_iri_predicate.slice(1)),
						object: k_factory.literal('object', 'en'),
					});
				});

				it('#toString()', () => {
					expect(dg_trips+'').to.equal(JSON.stringify({
						type: 'c3',
						value: hc3_triples,
					}));
				});

				it('numbers', () => {
					H_VALIDATORS.quad([...k_factory.c3({
						'>z://y/subject': {
							':predicate': 5,
						},
					}, {
						'': 'z://y/',
					})][0], {
						subject: k_factory.namedNode('z://y/subject'),
						predicate: k_factory.namedNode('z://y/predicate'),
						object: k_factory.integerLiteral(5),
					});
				});

				it('nested blank node objects', () => {
					const a_quads = [...k_factory.c3({
						'>z://y/subject': {
							':predicate': {
								':nested-p': ':nested-o',
							},
						},
					}, {
						'': 'z://y/',
					})];

					expect(a_quads.length).to.equal(2);

					// ref hop
					const kt_hop = a_quads[0].object;

					// validate hop is blank node
					H_VALIDATORS.blankNode(kt_hop, null, true);

					// same blank node
					expect(kt_hop).to.equal(a_quads[1].subject);

					// quads
					H_VALIDATORS.quad(a_quads[0], {
						subject: k_factory.namedNode('z://y/subject'),
						predicate: k_factory.namedNode('z://y/predicate'),
						object: kt_hop,
					});
					H_VALIDATORS.quad(a_quads[1], {
						subject: kt_hop,
						predicate: k_factory.namedNode('z://y/nested-p'),
						object: k_factory.namedNode('z://y/nested-o'),
					});
				});

				it('empty blank node', () => {
					const a_quads = [...k_factory.c3({
						'>z://y/subject': {
							'>z://y/predicate': {},
						},
					})];

					expect(a_quads.length).to.equal(1);

					const kt_blank = a_quads[0].object;

					H_VALIDATORS.blankNode(kt_blank, null, true);

					H_VALIDATORS.quad(a_quads[0], {
						subject: k_factory.namedNode('z://y/subject'),
						predicate: k_factory.namedNode('z://y/predicate'),
						object: kt_blank,
					});
				});

				it('rdf:type alias', () => {
					H_VALIDATORS.quad([...k_factory.c3({
						':subject': {
							a: ':Statement',
						},
					}, {
						'': 'z://y/',
					})][0], {
						subject: k_factory.namedNode('z://y/subject'),
						predicate: k_factory.namedNode(P_IRI_RDF+'type'),
						object: k_factory.namedNode('z://y/Statement'),
					});
				});

				it('missing prefix in predicate', () => {
					expect(() => [...k_factory.c3({
						':subject': {
							'missing:predicate': ':Statement',
						},
					}, {
						'': 'z://y/',
					})]).to.throw(/prefix/i);
				});

				it('predicate blank nodes', () => {
					expect(() => [...k_factory.c3({
						':subject': {
							'_:not-allowed': ':Statement',
						},
					}, {
						'': 'z://y/',
					})]).to.throw(/blank[ -]?node/i);
				});

				it('prefix variants', () => {
					H_VALIDATORS.quad([...k_factory.c3({
						_subject: {
							_predicate: '_object',
						},
					}, {
						'': 'z://y/',
					})][0], {
						subject: k_factory.namedNode('z://y/subject'),
						predicate: k_factory.namedNode('z://y/predicate'),
						object: k_factory.namedNode('z://y/object'),
					});
				});

				it('empty list', () => {
					expect([...k_factory.c3({
						'>z://y/subject': {
							'>z://y/predicate': [],
						},
					})]).to.eql([]);
				});

				it('invalid type', () => {
					expect(() => [...k_factory.c3({
						'>z://y/subject': {
							'>z://y/predicate': Symbol('invalid'),
						},
					})]).to.throw(/object type/i);
				});

				it('invalid c1', () => {
					expect(() => [...k_factory.c3({
						'>z://y/subject': {
							'>z://y/predicate': 'invalid',
						},
					})]).to.throw();
				});

				it('missing prefix', () => {
					expect(() => [...k_factory.c3({
						'>z://y/subject': {
							'>z://y/predicate': ':missing',
						},
					})]).to.throw(/prefix/i);
				});

				it('absolute iri?', () => {
					expect(() => [...k_factory.c3({
						'>z://y/subject': {
							'>z://y/predicate': 'z://y/invalid-c1',
						},
					})]).to.throw(/absolute iri/i);
				});
			});

			describe('c4', () => {
				const hc4_quads = {
					[sv1_iri_graph]: hc3_triples,
				};

				const dg_quads = k_factory.c4(hc4_quads);

				it('is iterable', () => {
					expect(dg_quads).to.be.iterable;
				});

				it('[...]', () => {
					const [
						kq_0,
						kq_1,
					] = [...dg_quads];

					H_VALIDATORS.quad(kq_0, {
						graph: k_factory.namedNode(sv1_iri_graph.slice(1)),
						subject: k_factory.namedNode(sv1_iri_subject.slice(1)),
						predicate: k_factory.namedNode(sv1_iri_predicate.slice(1)),
						object: k_factory.namedNode(sv1_iri_object.slice(1)),
					});

					H_VALIDATORS.quad(kq_1, {
						graph: k_factory.namedNode(sv1_iri_graph.slice(1)),
						subject: k_factory.namedNode(sv1_iri_subject.slice(1)),
						predicate: k_factory.namedNode(sv1_iri_predicate.slice(1)),
						object: k_factory.literal('object', 'en'),
					});
				});

				it('#toString()', () => {
					expect(dg_quads+'').to.equal(JSON.stringify({
						type: 'c4',
						value: hc4_quads,
					}));
				});
			});
		}

		describe('RDFJS', () => {
			const d_warn = console.warn;

			// capture warn messages
			console.warn = (s_warn) => {
				// silence
				if(/^\s*Warning:/.test(s_warn)) return;

				// otherwise echo
				d_warn.apply(console, [s_warn]);
			};

			// RDFJS Data Model test suite
			// the data test suite is currently in disagreement over falsy Term values and the graph component of `Triple`
			rdfjsDataModelTester(k_factory);
		});
	}
}