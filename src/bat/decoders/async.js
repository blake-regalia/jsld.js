const frag = require('frag');
const bkit = require('bkit');

const bat = require('../bat.js');

const {
	PE_DATASET,
	PE_DICTIONARY_PP12OC,
} = bat;

const bat_struct = bat.struct;

function async_inherit(ka, h_create) {
	Object.assign(ka, h_create);
}

const R_IRI_ENCODING = /^(.*)#(.*)$/;
const NB_HEAD_INIT = 512;
const NB_HEAD_INCREMENT = 256;

async function decode_head(at_init, fe_decode) {
	// prep decoder
	let kbd_init = new bkit.buffer_decoder(at_init);

	// decode head of section
	let p_container;
	let nb_contents;
	try {
		// ntu8 section iri
		p_container = kbd_init.ntu8_string();

		// content length in bytes
		nb_contents = kbd_init.vuint();
	}
	// not enough bytes
	catch(e_decode) {
		return await fe_decode(e_decode);
	}

	// extract encoding iri from section iri
	let [, p_encoding, s_label] = R_IRI_ENCODING.exec(p_container);

	return [p_encoding, s_label, kbd_init];
}

async function head(kav, i_section=0, nb_load=NB_HEAD_INIT) {
	// how many bytes can be read from this view
	let nb_view = kav.bytes;

	// how many bytes to read
	let nb_read = Math.min(nb_load, nb_view);

	// fetch initial chunk
	let at_init = await kav.slice(i_section, i_section+nb_read);

	// decode chunk
	let [p_encoding, s_label, kbd_init] = await decode_head(at_init, async (e_decode) => {
		// hit dead end
		if(nb_read === nb_view) {
			throw new Error(`failed to parse head of section after scanning ${nb_read} bytes: ${e_decode}`);
		}
		// expand search
		else {
			return await head(kav, i_section, nb_load+NB_HEAD_INCREMENT);
		}
	});

	// results
	return {
		encoding: p_encoding,
		kav: kav.view(i_section, nb_view),
		kbd: kbd_init,
		label: s_label,
	};
}

async function load(dc_load, kav, i_section=0, nb_load=NB_HEAD_INIT) {
	// info on struct
	let h_create = await head(kav, i_section, nb_load);

	// load into given class
	let kaz = new dc_load(h_create);

	// return instance
	return kaz;
}


async function autoload(kav, i_section=0, nb_load=NB_HEAD_INIT) {
	// info on struct
	let h_create = await head(kav, i_section, nb_load);

	// automatically load instance
	return auto(h_create);
}

function auto(h_create) {
	// encoding
	let p_encoding = h_create.encoing;

	// no such async handler
	if(!(p_encoding in H_ASYNC_IMPLEMENTATIONS)) {
		throw new Error(`no such async implementation for <${p_encoding}>`);
	}

	// create instance
	return new H_ASYNC_IMPLEMENTATIONS[p_encoding](h_create);
}

async function expand(kav_head, kbd_head, fe_expand) {
	// current buffer length
	let nb_decoder = kbd_head.contents.length;

	// reached end
	if(nb_decoder === kav_head.btyes) {
		return fe_expand();
	}

	// expand head
	let nb_head = Math.min(nb_decoder + NB_HEAD_INCREMENT, kav_head.bytes);

	// expand head
	let at_head = await kav_head.fetch(0, nb_head);

	// update buffer decoder
	this.kbd = new bkit.buffer_decoder(at_head);
}

// 	// initialize
// 	await kaz.init(kav);

// 	// return instance
// 	return kaz;
// }



// // create a new disposable buffer just for fetching heads and static data
// let kav_heads = kav_.fresh();

class async_dataset {
	constructor(g_create) {
		Object.assign(this, {
			kav: g_create.kav,
			structs: [],
		});
	}

	async init(kav_data) {
		let {
			kav: kav_head,
			structs: a_structs,
		} = this;

		// while there is data to consume
		do {
			// load head
			let kaz = await autoload(kav_head);

			// initialize
			await kaz.init(kav_data);

			// classify header
// kaz.is('rdfs:subClassOf', 'bat:Header')
			if(kaz instanceof bat_struct.header) {

			}
			// classify dictionary
			else if(kaz instanceof bat_struct.dictionary) {
				this.dictionary = kaz;
			}
			// classify triples
			else if(kaz instanceof bat_struct.triples) {
				this.triples = kaz;
			}
			// unknown classification
			else {
				throw new Error(`unrecognized dataset struct for async implemntation: <${kaz.ENCODING}>`);
			}

			// add struct to list
			a_structs.push(kaz);

			// next struct
			kav_head = kaz.kav.next();
		} while(kav_head);

		// discard head view
		delete this.kav;
	}
}

Object.assign(async_dataset.prototype, {
	ENCODING: bat.PE_DATASET,
});


class async_dictionary extends bat_struct.dictionary {
	async init() {}
}


const H_TYPED_ARRAY_SIZES = {
	8: Uint8Array,
	16: Uint16Array,
	32: Uint32Array,
};

class async_pointers extends bat_struct.pointers {
	constructor(h_create) {
		super();

		Object.assign(this, {
			kav: h_create.kav,
			label: h_create.label,
			pointers: null,
		});
	}

	async init() {
		// determine array type
		let s_label = this.label;

		// bit packing?!
		if(!(s_label in H_TYPED_ARRAY_SIZES)) {
			throw new Error(`cannot create typed array having ${s_label} bits per element`);
		}

		// create async typed array
		let kat_pointers = frag.typed_array(this.kav, H_TYPED_ARRAY_SIZES[s_label]);

		// load entire contents
		this.pointers = await kat_pointers.slice();

		// free buffer to gc
		delete this.kav;
	}

	async heads(kav_domain) {
		let at_pointers = this.pointers;
		let n_pointers = at_pointers.length;

		// ranges to head
		let a_ranges = [];

		// each pointer
		for(let i_pointer=0; i_pointer<n_pointers; i_pointer++) {
			// start of chapter
			let i_start = at_pointers[i_pointer];

			// furthest reach
			let i_reach = i_pointer === n_pointers-1? kav_domain.btyes: at_pointers[i_pointer+1];

			// create range
			a_ranges.push([i_start, Math.min(i_reach, i_start+NB_HEAD_INIT), i_reach-i_start]);
		}

		// fetch heads
		let a_heads = await kav_domain.slices(a_ranges);

		// instances
		let a_insts = [];

		// each head
		for(let i_head=0; i_head<n_pointers; i_head++) {
			let a_range = a_ranges[i_head];

			// decode head
			let [p_encoding, s_label] = decode_head(a_heads[i_head], async (e_decode) => {
				// hit dead end
				if(a_range[1] === a_range[0]+a_range[2]) {
					throw new Error(`failed to parse head of chapter: ${e_decode}`);
				}
				// expand search
				else {
					return await head(kav_domain, a_range[0], a_range[1]+NB_HEAD_INCREMENT);
				}
			});

			// load
			a_insts.push(auto({
				encoding: p_encoding,
				kav: kav_domain.view(a_range[0], a_range[3]),
				label: s_label,
			}));
		}

		return a_insts;
	}
}

// pp12oc - pointers, prefixes, and 12 optional chapters
class async_dictionary_pp12oc extends async_dictionary {
	constructor(h_create) {
		super();

		Object.assign(this, {
			kav: h_create.kav,
			prefixes: {},
			ranges: {},
			chapters: {},
		});
	}

	async init(kav_data) {
		let {
			kav: kav_head,
			ranges: h_ranges,
			chapters: h_chapters,
		} = this;

		// load pointers to chapters
		let ka_pointers = await load(async_pointers, kav_head);

		// advance view
		kav_head = ka_pointers.kav.next();

		// start loading prefixes
		let dp_prefixes = load(async_prefixes, kav_head);

		// initialize pointers (no persistent data needed; head only)
		await ka_pointers.init();

		// load chapters
		let a_chapters = await ka_pointers.heads(kav_head);

		// nominalize
		for(let h_create of a_chapters) {
			// create chapter instance
			let kaz = auto(h_create);

			// chapter label
			let s_label = kaz.label;

			// initialize
			let h_init = await kaz.init(kav_data);

			// save range
			h_ranges[s_label] = h_init.range;

			// save chapter
			h_chapters[s_label] = h_init.chapter;
		}

		// finish loading prefixes
		let ka_prefixes = this.prefixes = await dp_prefixes;

		// initialize prefixes
		await ka_prefixes.init();

		// discard head view
		delete this.kav;
	}

	select_subject(i_term) {
		let {
			ranges: {
				hops_absolute: h_range_ha,
				hops_prefixed: h_range_hp,
				subjects_absolute: h_range_sa,
				subjects_prefixed: h_range_sp,
			},
			chapters: h_chapters,
		} = this;

		if(i_term < 2) {
			throw new RangeError('invalid term ID');
		}
		else if(i_term <= h_range_hp.hi) {
			if(i_term <= h_range_ha.hi) {
				return this.word_to_node_absolute(h_chapters.hops_absolute.select(i_term));
			}
			else {
				return this.word_to_node_prefixed(h_chapters.hops_prefixed.select(i_term));
			}
		}
		else {
			if(i_term <= h_range_sa.hi) {
				return this.word_to_node_absolute(h_chapters.subjects_absolute.select(i_term));
			}
			else if(i_term <= h_range_sp.hi) {
				return this.word_to_prefixed(h_chapters.subjects_prefixed.select(i_term));
			}
			else {
				throw new RangeError('term id exceeds subject id range');
			}
		}
	}
}

class async_prefix {
	constructor(h_create) {
		Object.assign(this, {
			kav: h_create.kav,
			label: h_create.label,
		});
	}
}

// chapter with indices and contents
class async_chapter_ic {
	constructor(h_create) {
		super();

		Object.assign(this, {
			kav: h_create.kav,
			label: h_create.label,
		});
	}

	async init(kav_data) {
		let {
			kav: kav_head,
			label: s_label,
		} = this;

		// load indices
		let ka_indices = await load(async_chapter_indices_direct, kav_head);

		// advance view
		kav_head = ka_indices.next();

		// start loading contents
		let dp_contents = load(async_chapter_contents_pfc, kav_head);

		// initialize indices
		await ka_indices.init(kav_data);

		// finish loading contents and save
		let ka_contents = await dp_contents;

		// initialize contents
		await ka_contents.init(kav_data, ka_indices);

		// discard head view
		delete this.kav;

		return {
			label: s_label,
			range: h_range,
			chapter: ka_contents,
		};
	}
}

class async_chapter_indices_direct extends bat_struct.chapter_indices {
	constructor(h_create) {
		super();

		Object.assign(this, {
			type: H_TYPED_ARRAY_SIZES[h_create.label],
			kat: null,
		});
	}

	async init(kav_data) {
		// create typed array
		this.kat = frag.typed_array(kav_data.fresh(), this.type);

		// discard head view and buffer decoder
		delete this.kav;
		delete this.kbd;
	}

	async select(i_block) {
		// first block
		if(!i_block) {
			return [0, this.kat.at(0)];
		}
		// any other block
		else {
			return this.kat.slice(i_block-1, i_block+1);
		}
	}
}

class async_chapter_contents_pfc extends bat_struct.chapter {
	constructor(h_create) {
		super();
		async_inherit(this, h_create);
	}

	async init(kav_data, ka_indices) {
		let {
			kav: kav_head,
			kbd: kbd_head,
			label: s_label,
		} = this;

		// save indices
		this.indices = ka_indices;

		// attempt to read remainder of head
		try {
			// block k
			let n_block_k = kbd_head.vuint();

			// word count
			let n_words = kbd_head.vuint();

			// save fields
			Object.assign(this, {
				block_k: n_block_k,
				word_count: n_words,
			});
		}
		// ran out of bytes
		catch(e_decode) {
			// expand head
			this.kbd = expand(kav_head, kbd_head, () => {
				throw new Error(`ran out of bytes while trying to decode head of ${s_label} chapter`);
			});

			// try again
			return await this.init(kav_data, ka_indices);
		}

		// discard head view
		delete this.kav;

		// set contents on fresh data view
		this.contents = kav_data.fresh();
	}

	async extract(i_term) {
		let {
			block_k: n_block_k,
			indices: ka_indices,
			contents: kav_contents,
		} = this;

		// localize term to this chapter
		let i_key = i_term - this.offset;

		// deduce index of container block
		let i_block = i_key >>> n_block_k;

		// index of first word in block
		let i_word = i_block << n_block_k;

		// get indices of block
		let [i_contents, i_contents_end] = await ka_indices.select(i_block);

		// get block contents
		let at_block = await kav_contents.slice(i_contents, i_contents_end);

		// number of elements in block
		let ne_block = 1 << n_block_k;

		// temp arrays for decoding block
		let a_block_idx = new Array(ne_block);
		let a_shares = new Array(ne_block);

		let i_read = 0;
		a_block_idx[0] = 0;
		a_shares[0] = 0;
		let i_block_idx = 0;

		// length of head word
		let nl_word = at_block.indexOf(0);

		// head word shares no characters
		let n_share = 0;

		// word is within block
		if(i_word < i_key) {
			// skip over null char unless at beginning
			i_read += i_block? 1: 0;

			// skip words until arriving at target
			let kbd_contents = new bkit.buffer_decoder(at_block);
			kbd_contents.read = i_read;
			do {
				// skip over previous word
				kbd_contents.read += nl_word;

				// save share chars value
				a_shares[++i_block_idx] = n_share = kbd_contents.vuint();

				// save length of word
				nl_word = kbd_contents.vuint();

				// save index of word
				a_block_idx[i_block_idx] = kbd_contents.read;
			} while(++i_word < i_key);

			// update index
			i_read = kbd_contents.read;
		}

		// prep to construct word
		let at_word = new Uint8Array(n_share + nl_word);

		// copy known part from current word
		at_word.set(at_block.subarray(i_read, i_read+nl_word), n_share);

		// while needing to borrow from neighbor
		while(n_share > 0) {
			// check previous word's share value
			let n_prev_share = a_shares[--i_block_idx];

			// not interested!
			if(n_prev_share >= n_share) continue;

			// jump back to start of word content
			i_contents = a_block_idx[i_block_idx];

			// borrow from word
			at_word.set(at_block.subarray(i_contents, i_contents+(n_share-n_prev_share)), n_prev_share);

			// adjust number of characters needed
			n_share = n_prev_share;
		}

		return at_word;
	}
}

class async_triples extends bat_struct.triples {}


const H_ASYNC_IMPLEMENTATIONS = {
	[PE_DATASET]: async_dataset,
	[PE_DICTIONARY_PP12OC]: async_dictionary_pp12oc,
	[PE_POINTERS]: async_pointers_uint8,
	[PE_CHAPTER_IC]: async_chapter_ic,
	[PE_CHAPTER_INDICES_DIRECT]: async_chapter_indices_direct,
	[PE_CHAPTER_CONTENTS_PFC]: async_chapter_contents_pfc,
};

