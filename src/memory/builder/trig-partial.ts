/* eslint-disable no-use-before-define */

import {
	RDFJS,
	C1,
	PrefixMap,
	Quad,
	Dataset,
	Role,
} from '@graphy/types';

import SyncC1Dataset = Dataset.SyncC1Dataset;

import {
	DataFactory,
// } from '@graphy/core';
} from '../../core/core';

const {
	c1Graph,
	c1Subject,
	c1Predicate,
	c1Object,
	concise,
	fromTerm,
} = DataFactory;

import {
	PartiallyIndexedTrigDataset,
} from '../dataset/trig-partial';

import {
	$_KEYS,
	$_OVERLAY,
	$_QUADS,
	$_BURIED,
	Generic,
	PartiallyIndexed,
} from '../common';

import overlayTree = Generic.overlayTree;

/**
 * @fileoverview
 * The following table indicates the names for various groupings of RDF term roles:
 * 
 *  ┌─────────┬───────────┬─────────────┬──────────┐
 *  │ <graph> ┊ <subject> ┊ <predicate> ┊ <object> │
 *  ├─────────┴───────────┼─────────────┴──────────┤
 *  │        grub         │           prob         │
 *  ├─────────────────────┴─────────────┬──────────┤
 *  │               grasp               │░░░░░░░░░░│
 *  ├─────────┬─────────────────────────┴──────────┤
 *  │░░░░░░░░░│         spred           │░░░░░░░░░░│
 *  ├─────────┼─────────────────────────┴──────────┤
 *  │░░░░░░░░░│               triple               │
 *  ├─────────┴────────────────────────────────────┤
 *  │                      quad                    │
 *  └──────────────────────────────────────────────┘
 * 
 */

type Deliverable = Function & {
	new(hc4_quads: PartiallyIndexed.QuadsTree, h_prefixes: PrefixMap): SyncC1Dataset;
}


class GraspHandle implements PartiallyIndexed.GraspHandle {
	_k_builder: TrigDatasetBuilder;
	_kh_grub: GrubHandle;
	_sc1_predicate: C1.Predicate;
	_sc1_subject: C1.Subject;
	_as_objects: Set<C1.Term>; 

	constructor(kh_grub: GrubHandle, sc1_predicate: C1.Predicate, as_objects: Set<C1.NamedNode>) {
		this._k_builder = kh_grub._k_builder;
		this._kh_grub = kh_grub;
		this._sc1_subject = kh_grub._sc1_subject;
		this._sc1_predicate = sc1_predicate;
		this._as_objects = as_objects;
	}

	addC1Object(sc1_object: C1.Object): boolean {
		// ref object store
		const as_objects = this._as_objects;

		// triple already exists
		if(as_objects.has(sc1_object)) return false;

		// insert into object set
		as_objects.add(sc1_object);

		// ref quads tree
		const hc4_quads = this._k_builder._hc4_quads;

		// update quads counter on quads tree
		hc4_quads[$_QUADS] += 1;

		// ref triples tree
		const hc3_trips = hc4_quads[this._kh_grub._kh_graph._sc1_graph];

		// update quads counter on triples tree
		hc3_trips[$_QUADS] += 1;

		// update quads counter on probs tree
		hc3_trips[this._sc1_subject][$_QUADS] += 1;

		// new triple added
		return true;
	}

	deleteC1Object(sc1_object: C1.Object): boolean {
		return false;
	}
}


class GrubHandle implements PartiallyIndexed.GrubHandle {
	_k_builder: TrigDatasetBuilder;
	_kh_graph: PartiallyIndexed.GraphHandle;
	_sc1_subject: C1.Subject;
	_hc2_probs: PartiallyIndexed.ProbsTree;

	constructor(k_dataset: TrigDatasetBuilder, kh_graph: PartiallyIndexed.GraphHandle, sc1_subject: C1.Subject, hc2_probs: PartiallyIndexed.ProbsTree) {
		this._k_builder = k_dataset;
		this._kh_graph = kh_graph;
		this._sc1_subject = sc1_subject;
		this._hc2_probs = hc2_probs;
	}

	openC1Predicate(sc1_predicate: C1.Predicate): Dataset.GraspHandle {
		// increment keys counter
		const hc2_probs = this._hc2_probs;

		// predicate exists; return tuple handle
		if(sc1_predicate in hc2_probs) {
			return new GraspHandle(this, sc1_predicate, hc2_probs[sc1_predicate]);
		}
		else {
			// increment keys counter
			hc2_probs[$_KEYS] += 1;

			// create predicate w/ empty objects set
			const as_objects = hc2_probs[sc1_predicate] = new Set();

			// return tuple handle
			return new GraspHandle(this, sc1_predicate, as_objects);
		}
	}
}

class StandaloneGraphHandle implements PartiallyIndexed.GraphHandle {
	_k_builder: TrigDatasetBuilder;
	_sc1_graph: string;
	_hc3_trips: PartiallyIndexed.TriplesTree;
	 
	constructor(k_dataset: TrigDatasetBuilder, sc1_graph: C1.Graph, hc3_trips: PartiallyIndexed.TriplesTree) {
		this._k_builder = k_dataset;
		this._sc1_graph = sc1_graph;
		this._hc3_trips = hc3_trips;
	}

	openC1Subject(sc1_subject: C1.Subject): Dataset.GrubHandle {
		// ref triples tree
		const hc3_trips = this._hc3_trips;

		// subject exists; return subject handle
		if(sc1_subject in hc3_trips) {
			return new GrubHandle(this._k_builder, this, sc1_subject, hc3_trips[sc1_subject]);
		}
		else {
			// increment keys counter
			hc3_trips[$_KEYS] += 1;

			// create subject w/ empty probs tree
			const hc2_probs = hc3_trips[sc1_subject] = overlayTree() as PartiallyIndexed.ProbsTree;

			// return subject handle
			return new GrubHandle(this._k_builder, this, sc1_subject, hc2_probs);
		}
	}
}

function graph_to_c1(yt_graph: Role.Graph, h_prefixes: PrefixMap): C1.Graph {
	// depending on graph term type
	switch(yt_graph.termType) {
		// default graph
		case 'DefaultGraph': {
			return '*';
		}

		// named node
		case 'NamedNode': {
			return concise(yt_graph.value, h_prefixes);
		}

		// blank node
		case 'BlankNode': {
			return '_:'+yt_graph.value;
		}

		// other
		default: {
			return '';
		}
	}
}

function dataset_delivered(): never {
	throw new Error(`Cannot use builder after dataset has been delivered`);;
}

/**
 * Trig-Optimized, Semi-Indexed Dataset in Memory
 * YES: ????, g???, g??o, g?po, gs??, gsp?, gspo
 * SOME: gs?o
 * NOT: ???o, ??p?, ??po, ?s??, ?s?o, ?sp?, ?spo, g?p?
 */
export class TrigDatasetBuilder implements PartiallyIndexed.GraphHandle, Dataset.SyncGspoBuilder<SyncC1Dataset> {
	_sc1_graph = '*';
	_hc3_trips: PartiallyIndexed.TriplesTree;
	_hc4_quads: PartiallyIndexed.QuadsTree;
	_h_prefixes: PrefixMap;

	static supportsStar = false;

	constructor(h_prefixes={} as PrefixMap, kd_init=PartiallyIndexedTrigDataset.empty(h_prefixes)) {
		this._h_prefixes = h_prefixes;

		this._hc4_quads = kd_init._hc4_quads as PartiallyIndexed.QuadsTree;
		this._hc3_trips = kd_init._hc3_trips as PartiallyIndexed.TriplesTree;
	}

	openC1Graph(sc1_graph: C1.Graphable): Dataset.GraphHandle {
		// ref quads tree
		const hc4_quads = this._hc4_quads;

		// graph exists; return subject handle
		if(sc1_graph in hc4_quads) {
			return new StandaloneGraphHandle(this, sc1_graph, hc4_quads[sc1_graph]);
		}
		else {
			// increment keys counter
			hc4_quads[$_KEYS] += 1;

			// create graph w/ empty triples tree
			const hc3_trips = hc4_quads[sc1_graph] = overlayTree() as PartiallyIndexed.TriplesTree;

			// return subject handle
			return new StandaloneGraphHandle(this, sc1_graph, hc3_trips);
		}
	}

	openC1Subject(sc1_subject: C1.Node): Dataset.GrubHandle {
		// ref default graph triples tree
		const hc3_trips = this._hc3_trips;

		// subject exists; return subject handle
		if(sc1_subject in hc3_trips) {
			return new GrubHandle(this, this, sc1_subject, hc3_trips[sc1_subject]);
		}
		// subject not yet exists
		else {
			// increment keys counter
			hc3_trips[$_KEYS] += 1;

			// create subject w/ empty probs tree
			const hc2_probs = hc3_trips[sc1_subject] = overlayTree() as PartiallyIndexed.ProbsTree;

			// return subject handle
			return new GrubHandle(this, this, sc1_subject, hc2_probs);
		}
	}

	openGraph(yt_graph: Role.Graph): Dataset.GraphHandle {
		return this.openC1Graph(graph_to_c1(yt_graph, this._h_prefixes));
	}

	openSubject(yt_subject: Role.Subject): Dataset.GrubHandle {
		return this.openC1Subject('NamedNode' === yt_subject.termType? concise(yt_subject.value, this._h_prefixes): '_:'+yt_subject.value);
	}

	deliver(dc_dataset: Deliverable=PartiallyIndexedTrigDataset): SyncC1Dataset {  // eslint-disable-line require-await
		// simplify garbage collection and prevent future modifications to dataset
		const hc4_quads = this._hc4_quads;
		this._hc4_quads = null as unknown as PartiallyIndexed.QuadsTree;
		this._hc3_trips = null as unknown as PartiallyIndexed.TriplesTree;
		this.openC1Subject = dataset_delivered;
		this.openC1Graph = dataset_delivered;


		// create dataset
		return new dc_dataset(hc4_quads, this._h_prefixes);
	}
}
