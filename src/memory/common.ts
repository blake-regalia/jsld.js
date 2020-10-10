import {
	C1,
	Dataset,
	PrefixMap,
} from '../types/types';
import { SemiIndexedTrigDataset } from './memory';

/**
 * Caches the number of 'keys' stored in the tree.
 */
export const $_KEYS = Symbol(' (keys)');

/**
 * Tracks the total count of quads stored at all descendent levels of the tree.
 */
export const $_QUADS = Symbol(' (quads)');

/**
 * When present, indicates that the tree is overlaying another object via prototype.
 *   This allows for super quick set operations, such as `union` and `difference`, on
 *   the average case and significantly reduces memory consumption and GC time.
 */
export const $_OVERLAY = Symbol(' (overlay)');

/**
 * When present, indicates that the tree was used to create an overlay for another tree.
 *   The implication is that if `add` or `delete` is called on a buried tree, the method
 *   will have to create a new tree since the original object may still be referenced.
 */
export const $_BURIED = Symbol(' (buried)');


export interface CountableKeys {
	[$_KEYS]: number;
}

export type CountableQuads = CountableKeys & {
	[$_QUADS]: number;
}

export type OverlayableCountableQuads = CountableQuads & {
	[$_OVERLAY]?: number;
	[$_BURIED]?: number;
}


export namespace PartiallyIndexed {
	export type QuadsTree = OverlayableCountableQuads & {
		[sc1_graph: string]: TriplesTree;
	}

	export type TriplesTree = OverlayableCountableQuads & {
		[sc1_subject: string]: ProbsTree;
	}

	export type ProbsTree = OverlayableCountableQuads & {
		[sc1_predicate: string]: Set<C1.Object>;
	}

	export interface GraphHandle extends Dataset.GraphHandle {
		_sc1_graph: C1.Graph;
		_hc3_trips: PartiallyIndexed.TriplesTree;
	}

	export interface GrubHandle extends Dataset.GrubHandle {
		_kh_graph: PartiallyIndexed.GraphHandle;
		_sc1_subject: C1.Subject;
		_hc2_probs: PartiallyIndexed.ProbsTree;
	}

	export interface GraspHandle extends Dataset.GraspHandle {
		_as_objects: ObjectSet;
	}

	export type ObjectSet = Set<C1.Object>;
}

export namespace SemiIndexed {
	export type QuadsTree = OverlayableCountableQuads & {
		[sc1_graph: string]: TriplesTree;
	}

	export type TriplesTree = OverlayableCountableQuads & {
		[sc1_subject: string]: ProbsTree;
	}

	export type ProbsTree = OverlayableCountableQuads & {
		[sc1_predicate: string]: Set<ObjectDescriptor>;
	}

	export interface ObjectDescriptor {
		value: C1.Object;
		refs: ObjectReferencesMap;
	}

	export type ObjectReferencesMap = CountableQuads & {
		[sc1_predicate: string]: Set<C1.Predicate>;
	}

	export type ObjectStore = CountableKeys & {
		[sc1_object: string]: ObjectDescriptor;
	}

	export type ObjectSet = Set<ObjectDescriptor>;
}

export namespace Generic {
	export type QuadsTree = PartiallyIndexed.QuadsTree | SemiIndexed.QuadsTree;
	export type TriplesTree = PartiallyIndexed.TriplesTree | SemiIndexed.TriplesTree;
	export type ProbsTree = CountableQuads & {
		[sc1_predicate: string]: ObjectSet;
	};
	export type ObjectSet = Set<C1.Object | SemiIndexed.ObjectDescriptor>;
	export type ObjectIdentifier = C1.Object & SemiIndexed.ObjectDescriptor;

	export type Tree = QuadsTree | TriplesTree | ProbsTree;

	export const overlayTree = (n_keys=0, n_quads=0) => ({
		[$_KEYS]: n_keys,
		[$_QUADS]: n_quads,
		// [$_OVERLAY]: 0,
		// [$_SUPPORTING]: [],
	}) as QuadsTree | TriplesTree | ProbsTree;

	export const overlay = (hcw_src: any): Tree => {
		// create new tree
		const hcw_dst = Object.create(hcw_src);

		// src is now buried
		hcw_src[$_BURIED] = 1;

		// dst is an overlay
		hcw_dst[$_OVERLAY] = 1;

		return hcw_dst;
	};

	export const trace = (hcw_overlay: any): Tree => {
		// create dst tree
		const hcw_dst = {} as Tree;

		// check each key
		for(let sv1_key in hcw_overlay) {
			hcw_dst[sv1_key] = hcw_overlay[sv1_key];
		}

		// copy key count and quad count
		hcw_dst[$_KEYS] = hcw_overlay[$_KEYS];
		hcw_dst[$_QUADS] = hcw_overlay[$_QUADS];

		return hcw_dst;
	};

	export interface Constructor<DatasetType, BuilderType extends Dataset.GspoBuilder, TransferType extends QuadsTree> extends Dataset.Constructor<DatasetType, BuilderType, TransferType> {
		empty(prefixes: PrefixMap): DatasetType;
		builder(prefixes: PrefixMap): BuilderType;

		new(transfer: TransferType, prefixes: PrefixMap): DatasetType;
	}
}
