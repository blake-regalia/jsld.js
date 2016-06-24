

# Graphs
A powerful, query-like API is accessible by instructing graphy to create a group of Networks from a given `input`. The following sections are organized as follows:
 - [Understanding Pseudo-Datatypes used in this documentation](#pseudo-datatypes)
 - [Creating a group of Networks](#graphy-networks)
 - [RDF Terms](#rdf-terms)
    - [Term](#term)
    - [NamedNode](#namenode)
    - [BlankNode](#blanknode)
    - [Literal](#literal)
    - [DefaultGraph](#defaultgraph)
 - [Quad](#quad), [Triple](#triple)
 - [Node](#node), [NodeSet](#nodeset)
 - [Bag](#bag), [Bunch](#bunch), and [LiteralBunch](#bunch)
 - [Namespace](#namespace)
 - [Network](#network)
 - [Graph](#graph)

### Pseudo-Datatypes:
Throughout this API document, the following datatypes are used to represent expectations imposed on primitive-datatyped parameters to functions, exotic uses of primitives in class methods, and so forth:
 - `hash` - refers to a simple `object` with keys and values (e.g. `{key: 'value'}`)
 - `key` - refers to a `string` used for accessing an arbitrary value in a `hash`
 - `list` - refers to a one-dimensional `Array` containing only elments of the same type/class
 - `iri` - refers to a `string` that represents an IRI in Notation3 format either by:
   - absolute reference, starting with `'<'` and ending with `'>'`
   - or prefixed name, where the prefix id is given by the characters preceeding the first `':'` and the suffix is given by everything after that
 - `label` - refers to a `string` that represents a blank node label by starting with `'_:'`
 - `langtag` - refers to a `string` that represents a language tag by starting with `'@'`
 - `chain/function` - refers to a method that acts the same as when called as a function without arguments
   - e.g., `thing.chain.property === thing.chain().property`
 - `function/hash` - refers to a `function` that also acts as a `hash`, so it can either be used to access certain properties or it can be called with/without certain arguments.
   - e.g., `thing.method(arg); /*and*/ thing.method[property]; // are both acceptable and may do different things`

<a name="graphy-networks" />
##### `graphy.[format].networks(input: [string|Stream], callback: function)`
 - Parses `input` and invokes `callback(g: Graph)`, where `g` is a [new Graph](#graph)
 - *example:*
     ```js
     let input = '@prefix : <ex://>.  :Mars a :Planet;  :looks :Red, "baron" .';
     graphy.ttl.networks(input, (g) => {
        let mars = g.enter(':Mars');
        mars.at.rdf.type.values();  // ['ex://Planet']
        mars.at(':looks').nodes.values();  // ['ex://Red']
        mars.at(':looks').literals.values();  // ['baron']
    });
    ```
 - Where `[format]` is one of: `ttl`, `trig`, `nt`, or `nq`. Such as:
    - `graphy.ttl.networks()`
    - `graphy.trig.networks()`
    - `graphy.nt.networks()`
    - `graphy.nq.networks()`


----

### RDF Terms
You can use the following functions to construct new instances of a [Term](#term).
 - [`new graphy.NamedNode (iri: string)`](#namednode)
 - [`new graphy.BlankNode (label: string)`](#blanknode)
 - [`new graphy.Literal (value: string, datatype_or_lang: [string|langtag])`](#literal)
 - [`new graphy.DefaultGraph ()`](#defaultgraph)

<a name="term" />
### abstract **Term** implements @RDFJS Term
An abstract class that represents an RDF term by implementing the [RDFJS Term interface](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#term).

**Properties:** (implementing RDFJS Term interface)
 - `.termType` : `string` -- either `'NamedNode'`, `'BlankNode'`, `'Literal'` or `'DefaultGraph'`
 - `.value` : `string` -- depends on the type of term; could be the content of a [Literal](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#literal-extends-term), the label of a [BlankNode](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#blanknode-extends-term), or the IRI of a [NamedNode](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#namednode-extends-term)

**Methods:** (implementing RDFJS Term interface)
 - `.equals(other: Term)` -- tests if this term is equal to `other`
   - **returns** a `boolean`
 - `.toCanonical()` -- produces an [N-Triples canonical form](https://www.w3.org/TR/n-triples/#canonical-ntriples) of the term
   - **returns** a `string`

**Methods:**
 - `.valueOf()` -- gets called when cast to a `string`. It simply returns `.toCanonical()`
   - **returns** a `string`
   - *example:*
       ```js
       let hey = new graphy.NamedNode('hello');
       let you = new graphy.Literal('world!', '@en');
       console.log(hey+' '+you); // '<hello> "world!"@en'
       ```
      

----
<a name="namednode" />
### **NamedNode** extends Term implements @RDFJS NamedNode
A class that represents an RDF named node by implementing the [RDFJS NamedNode interface](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#namednode-extends-term)

**Properties:** (inherited from Term & implementing RDFJS NamedNode)
 - `.termType` : `string` = `'NamedNode'`
 - `.value` : `string` -- the IRI of this named node

**Properties:**
 - `.isNamedNode` : `boolean` = `true` -- the preferred and fastest way to test for NamedNode term types

**Methods:**
 - ... [those inherited from Term](#term)


----
<a name="blanknode" />
### **BlankNode** extends Term implements @RDFJS BlankNode
A class that represents an RDF blank node by implementing the [RDFJS BlankNode interface](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#blanknode-extends-term)

**Properties:** (inherited from Term & implementing RDFJS NamedNode)
 - `.termType` : `string` = `'BlankNode'`
 - `.value` : `string` -- the label of this blank node (i.e., without leading `'_:'`)

**Properties:**
 - `.isBlankNode` : `boolean` = `true` -- the preferred and fastest way to test for BlankNode term types

**Methods:**
 - ... [those inherited from Term](#term)


----
<a name="literal" />
### **Literal** extends Term implements @RDFJS Literal
A class that represents an RDF literal by implementing the [RDFJS Literal interface](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#literal-extends-term)

**Properties:** (inherited from Term & implementing RDFJS Literal interface)
 - `.termType` : `string` = `'Literal'`
 - `.value` : `string` -- the content of this literal

**Properties:** (implementing RDFJS Literal interface)
 - `.datatype` : `string` -- the datatype IRI of this literal
 - `.language` : `string` -- the language tag associated with this literal (empty string if it has no language)

**Properties:**
 - `.isLiteral` : `boolean` = `true` -- the preferred and fastest way to test for Literal term types


----
<a name="defaultgraph" />
### **DefaultGraph** extends Term implements @RDFJS DefaultGraph
A class that represents the default graph by implementing the [RDFJS DefaultGraph interface](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#defaultgraph-extends-term)

**Properties:** (inherited from Term & implementing RDFJS DefaultGraph interface)
 - `.termType` : `string` = `'DefaultGraph'`
 - `.value` : `string` = `''` -- always an empty string

**Properties:**
 - `.isDefaultGraph` : `boolean` = `true` -- the preferred and fastest way to test for DefaultGraph term types


----
<a name="quad" />
### **Quad** implements @RDFJS Quad
A class that represents an RDF triple/quad by implementing the [RDFJS Quad interface](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#quad)

**Properties:** (implementing RDFJS Quad interface)
 - `.subject` : [`[NamedNode|BlankNode]`](#namednode)
 - `.predicate` : [`NamedNode`](#namednode)
 - `.object` : [`Term`](#term)
 - `.graph` : `[NamedNode|BlankNode|DefaultGraph]`

**Methods:** (implementing RDFJS Quad interface)
 - `.equals(other: Quad[, ignore_graph: boolean])`
   - tests if `other` Quad is equal to this one, optionally ignoring the graph if `ignore_graph` is truthy.
   - **returns** a `boolean`
 - `.toCanonical()` -- produces an [N-Triples canonical form](https://www.w3.org/TR/n-triples/#canonical-ntriples) of the Quad.

**Methods:**
 - `.toString()` -- alias of `.toCanonical()`

----
<a name="triple" />
### **Triple** aliases Quad implements @RDFJS Triple
A class that represents an RDF triple by implementing the [RDFJS Triple interface](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#quad). Same as `Quad` except that `.graph` will always be a [DefaultGraph](#defaultgraph).

**Properties:** (aliasing Quad & implementing RDFJS Triple interface)
 - `.graph` : [`DefaultGraph`](#defaultgraph)
 - ... and [those in Quad](#Quad)

**Methods:** (aliasing Quad & implementing RDFJS Triple interface)
 - ... [those in Quad](#Quad)
----
<a name="node" />
### **Node** extends [NamedNode|BlankNode]
A class that wraps an RDF node - which can be either a [NamedNode](#namednode) or a [BlankNode](#blanknode) - for traversing links that lead to objects or other nodes.

**Properties:** (inherited from [NamedNode|BlankNode])
 - `.termType` : `string` = either `'NamedNode'` or `'BlankNode'`.
 - `.value` : `string` -- the ID of this node (either an IRI or blank node label).
 - `.is[Named|Blank]Node` : `boolean` = `true` -- the preferred and fastest way to test for NamedNode or BlankNode term types, only one will be defined, the other will be `undefined`.

**Properties:**
 - `.links` : `hash[predicate_uri: key]` -- access to the underlying [Network](#network)
   - selects the set of objects linked via `predicate_uri` from this subject node.
   - **returns** an `Array` of [Terms](#terms) which represents the objects of the triples.
   - *example:*
        ```js
        banana.links['http://www.w3.org/2000/01/rdf-schema#label'];
        // returns: [ Literal {value:'Banana', language:'en', datatype:...}, ...]
        ````
 - `.inverseLinks` : `hash[predicate_uri: key]` -- access to the [Network](#network) of inverse links
   - selects the set of subjects linked via `predicate_uri` wherever this Node appears in the object position of a triple in the current graph.
   - **returns** an `Array` of [Nodes](#nodes) that represent the subjects of the triples.
   - *example:*
        ```js
        banana.inverseLinks['http://dbpedia.org/property/group'];
        // returns: [ {value:'http://dbpedia.org/resource/Saba_banana', termType:'NamedNode', ...}, ...]
        ````
 - `.of` : `this` -- identity property for semantic access paths; in other words, it simply points to `this` for chaining calls together. Check out the `.is` example below to see why.

**Methods:**
 - `.at` : `funciton/hash`
   - *{function}* `(predicate: iri[, ...])`
   - *{function}* `(predicates: array)`
     - traverses `predicate(s)` a maximum distance of length one in the normal direction. Multiple arguments or an Array of them is equivalent to using the OR property path operation.
	 - **returns** a [new Bag](#bag).
	 - *example*
	      ```js
	      banana.at('rdfs:label');  // returns a Bag of the objects linked via `rdfs:label`
	      // --- or ---
	      // the equivalent to a property path: `(rdfs:label|rdfs:comment)`
	      banana.at('rdfs:label', 'rdfs:comment');
	      banana.at(['rdfs:label', 'rdfs:comment']); // same as above
	      ```
   - *{hash}* `[prefix_id: key]` -- provides a semantic access path for traversing the graph in an expressive way
     - selects a subset of the predicates that link this subject to its objects by filtering predicates that start with the IRI given by the corresponding `prefix_id`.
     - **returns** a [Namespace](#namespace).
       - *CAUTION:* Accessing a namespace or subsequent suffix that **does not exist** will cause a `TypeError` because you cannot chain `undefined`. It is safer to use the `.at()` function if you are not guaranteed that a certain path will exist.
	 - *example:*
	      ```js
	      banana.at.rdfs;  // { label: Bag{..}, comment: Bag{..}, ...}
	      // --- or ---
	      banana.at[some_prefix_id];
	      ```
 - `.is` : alias of `.inverseAt`
 - `.inverseAt` : `funciton/hash`
   - *{function}* `(predicate: iri[, ...])`
   - *{function}* `(predicates: array)`
     - traverses `predicate(s)` a maximum distance of length one. Multiple arguments or an Array of them is equivalent to using the OR property path operation.
	 - **returns** a [new Bag](#bag).
	 - *example:*
	      ```js
	      // semantic access path
	      banana.inverseAt('dbp:group');  // returns a NodeSet of the subjects linked via `^dbp:group`
	      banana.is.dbp.group.of; // same as above
	      // --- or ---
	      banana.inverseAt('dbo:wikiPageRedirects', 'dbo:wikiPageDisambiguates');
	      // equivalent to property path  ^(dbo:wikiPageRedirects|dbo:wikiPageDisambiguates)
	      ```
   - *{hash}* `[prefix_id: key]` -- provides a semantic access path for traversing the graph in an expressive way
     - selects a subset of the predicates that link this **object to its subjects** by filtering predicates that start with the IRI given by the corresponding `prefix_id`.
     - **returns** a [new Namespace](#namespace).
       - *CAUTION:* Accessing a namespace or subsequent suffix that **does not exist** will cause a `TypeError` because you cannot chain `undefined`. It is safer to use the `.inverseAt()` function if you are not guaranteed that a certain path will exist.
	 - *example:*
	      ```js
	      banana.is.dbp.group.of  // dbr:Banana ^dbp:group ?things
	        .nodes.values();  // ['http://dbpedia.org/resource/Red_banana', ...]
	      ```
 - `.all` : `chain/function` -- selects all sets of objects linked via all predicates from this subject node in the normal direction
   - *{chain}* | *{function}* `()`
     - **returns** a [new Bag](#bag)
     - *example:*
         ```js
         banana.all.literals.terms;  // returns Array of all Literals that are object of dbr:Banana
         ```
 - `.inverseAll` : `chain/function` -- selects the set of all subjects linked via all predicates from this node in the inverse direction
   - *{chain}* | *{function}* `()`
     - **returns** a [new NodeSet](#nodeset)
     - *example:*
         ```js
         banana.inverseAll.namedNodes.values();  // returns IRIs of all subjects that point to dbr:Banana
         ```

----
<a name="nodeset" />
### **NodeSet**
A class that wraps a set of [Nodes](#node). Since it is a set, no two of its items will be identical. Each method in this class simply applies the corresponding operation to each Node.

**Properties:**
 - `.areNodes` : `boolean` = `true`
 - `.nodes` : `hash` -- access to the underlying `hash` of [Nodes](#node)
 - `.of` : `this` -- behaves the same as [Node#of](#node)

**Methods:**
 - `.at` -- behaves the same as [Node#at](#node)
   - **returns** a [new Bag](#bag)
 - `.inverseAt`, `.is`, `.are` -- behaves the same as [Node#inverseAt](#node)
   - **returns** a [new NodeSet](#nodeset)
 - `.all` -- behaves the same as [Node#all](#node)
   - **returns** a [new Bag](#bag)
 - `.inverseAll` -- behaves the same as [Node#inverseAll](#node)
   - **returns** a [new NodeSet](#nodeset)

----
### **Bag**
An unordered list of [Terms](#term). "Unordered" refers to the fact that the ordering of its elements is arbitrary. The list is not a set, so it may contain duplicates.

**Properties:**
 - `.terms` : `Array` -- access to the underlying `list` of [Terms](#term)

**Methods:**
 - `.sample()` -- selects exactly one [Term](#term) from the unordered list and returns its `.value`. Convenient if you are certain the bag has only one element, otherwise it accesses the first/next+ item from the unordered list.
     - **returns** a `string` or `undefined` if Bag is empty
     - *example:*
         ```js
         banana.at.dbp.commons.sample();  // 'Banana'
         // in bags with more than one element:
         banana.at.rdfs.label.sample();  // 'Банан'
         banana.at.rdfs.label.sample();  // 'Banane'
         banana.at.rdf.type.sample();  // 'http://umbel.org/umbel/rc/Plant'
         ```
 - `.values()` -- fetches all elements' `.value` property
   - **returns** an `Array` of strings
   - *example:*
       ```js
       banana.at('rdfs:label').values();  // ['Банан', 'Banane', ...]
       ```
 - `.termTypes()` -- fetches all elements' `.termType` property
   - **returns** an `Array` of strings
   - *example:*
       ```js
       banana.at('rdfs:label').termTypes();  // ['Literal', 'Literal', ...]
       ```
 - `.literals` : `chain/function` -- selects only terms of type [Literal](https://github.com/rdfjs/representation-task-force/blob/master/interface-spec.md#literal-extends-term) and applies an optional `filter`.
   - *{chain}* | *{function}* `()`
   - *{function}* `(filter: iri)` -- filter by datatype
   - *{function}* `(filter: langtag)` -- filter by language
   - *{function}* `(filter: function)` -- filter by callback function w/ params: `(element: Literal)`
     - **returns** a [new LiteralBunch](#bunchofliterals)
     - *example:*
         ```js
         banana.all.literals;  // indiscriminately select all literals
         banana.all.literals('xsd:string'); // filter by datatype
         banana.all.literals('@en');  // filter by language tag
         banana.all.literals((literal) => {  // filter by callback function
            return literal.value.length < 512;
         });
         ```
 - `.nodes` : `chain/function` -- selects only distinct terms of type NamedNode or BlankNode and applies an optional `filter`.
   - *{chain}* | *{function}* `()`
   - *{function}* `(filter: function)` -- filter by callback function w/ params: `(element: Node)`
     - **returns** a [new NodeSet](#nodeset)
     - *example:*
         ```js
         banana.at('rdf:type').nodes;  // ensures all elements are Nodes and gives us more methods to work with
         ```
 - `.namedNodes` : `chain/function` -- selects only distinct terms of type NamedNode, optionally filters nodes whos IRIs start with `prefix`, and then applies an optional `filter`.
   - *{chain}* | *{function}* `()`
   - *{function}* `(prefix: iri)` -- filter by whos IRIs start with `prefix`
   - *{function}* `(filter: function)` -- filter by callback function w/ params: `(element: Node)`
   - *{function}* `(prefix: iri, filter: function)` -- filter by nodes whos IRIs start with `prefix`, **then** filter by custom function
     - **returns** a [new NodeSet](#nodeset)
 - `.blankNodes` : `chain/function` -- selects only distinct terms of type BlankNode and applies an optional `filter`.
   - *{chain}* | *{function}* `()`
   - *{function}* `(filter: RegExp)` -- filter by label
   - *{function}* `(filter: function)` -- filter by callback function w/ params: `(element: Node)`
     - **returns** a [new NodeSet](#nodeset)

 - `.collections` : `chain/function` -- selects any nodes that have an `rdf:first` property

----
<a name="bunch" />
### abstract **Bunch** extends Bag
An abstract class that represents an unordered list of [Terms](#term) which are all of the same term type.

**abstract Properties:**
 - `.termType` : `string` -- the term type shared by all the Terms in this Bunch.
 - ... and [those inherited from Bag](#bag)

**abstract Methods:**
 - `.filter(filter: function)` -- applies `filter` callback function to each Term in this Bunch.
   - **returns** a new Bunch of the same type
 - ... and [those inherited from Bag](#bag)

----
<a name="literalbunch" />
### **LiteralBunch** extends Bunch
A class that represents an unordered list of [Literals](#literal).

**Properties:** (inherited from Bunch and Bag)
 - `.termType` : `string` = `'Literal'`
 - ... and [those inherited from Bag](#bag)

**Properties:**
 - `.areLiterals` : `boolean` = `true` -- distinguishes this Bunch from other potential types

**Methods:** (inherited from Bunch and Bag)
 - `.values()` -- **returns** an `Array` of strings that are the contents of each Literal in this Bunch
 - `.filter(filter: function)` -- applies `filter` callback w/ params: `(element: Literal)`
   - **returns** a [new LiteralBunch](#literalbunch)
 - ... and [those inherited from Bag](#bag)

**Methods:**
 - `.datatypes()` -- **returns** an `Array` of strings that are the IRIs of each Literal in this Bunch
 - `.languages()` -- **returns** an `Array` of strings that are the languages of each Literal in this Bunch


----
### **Namespace**
A `hash` of namespaced suffixes where each entry links to a sets of objects (Literals) or to other nodes (NamedNodes or BlankNodes).
 - *{hash}* `[predicate_suffix: key]`
   - selects the set of objects corresponding to the predicate given by the current namespace prefix concatenated with `predicate_suffix`
     - > i.e., the keys are the strings leftover after removing the prefix IRI from the beginning of every predicate
   - **returns** a [Bag instance](#bag)
   - *example:*
        ```js
        banana.at.rdfs  // this is a Namespace
            .label;  // selects the Bag of the objects linked via `rdfs:label`
        ```

----
### **Network**
A `hash` that represents all predicates from the current node to its objects (Literals, NamedNodes, BlankNodes) or to its subject nodes (NamedNodes or BlankNodes). An instance can either represent links in the normal direction (to objects) *OR* it can represent links in the inverse direction (to nodes), depending on how it was created. Reserved keys are prefixed with a `'^'` to prevent collisions with predicate IRIs:
 - *{hash}* `['^direction']` : `number` -- indicates the direction of the predicates.
   - either a `1` for normal direction (i.e., `subject --> object`) or a `-1` for inverse direction (i.e., `subject <-- object`).
 - *{hash}* `['^term']` -- the [Term](#node) that is the 'owner' of this Network.
   - For `^direction > 0`, this will always be either a [NamedNode](#namednode) or [BlankNode](#blanknode) since it represents the subject of a triple.
   - For `^direction < 0`, this may be any [Term](#term) since it represents the object of a triple.
 - *{hash}* `[predicate_iri: key]`
   - selects the set of objects or nodes that are pointed to (or from depending on `^direction`) by the given `predicate_iri`.

----
### **Graph**
A class that represents a set of triples in which any of its nodes are accessible by their id, which is either an IRI or a blank node label. Nodes are linked to one another by the predicates that were extracted from the input triples. 

Prior associations to an RDF graph IRI

**Properties:**
 - `.graph` : `hash[node_id: key]` -- access to the underlying graph, which returns a [Network](#network) of all links this node has in the normal direction.
   - **returns** a [Network](#network)
   - *example:*
       ```js
       g.graph['http://dbpedia.org/resource/Banana'];
       // -- or --
       g.graph['_:b12'];
       ```
 - `.roots` : `hash[node_id: key]` -- access to named nodes that appear **at least once** in the subject position of any triple AND blank nodes that **only** appear in the subject position of any triple. Useful for iteration with the `in` operator
     - **returns** a [Network](#network)
     - *example:*
         ```js
         for(let node_id in g.roots) {
           if(node_id.startsWith('_:')) {
             // blank nodes only appearing as subject in this set of triples
             let blank_node = g.enter(node_id);
           }
         }
         ```


**Methods:**
 - `.enter(node_id: iri|label)` -- selects the node in the current graph given by `node_id`.
   - **returns** a [Node](#node)
   - *example:*
       ```js
       let banana = g.enter('dbr:Banana');
       ```
 - `.terse` : `function` -- produces the most terse Turtle serialization of a node's IRI, a blank node's label, or a literal's content and language/datatype. For IRIs, it will find the longest matching prefix and attempt to to create a prefixed name unless the resulting name contains invalid characters, in which case an absolute IRI reference (with `'<'` and `'>'`) is returned. For literals, it will omit the datatype if it is `xsd:string`, and will attempt to represent `xsd:boolean`, `xsd:integer`, `xsd:decimal` and `xsd:double` as numeric literals so long as the contents are parseable. See example for details.
   - *{function}* `(term: Term)` -- for any: [NamedNode](#namednode), [BlankNode](#blanknode), or [Literal](#literal).
   - *{function}* `(node: Node)` -- serializes the IRI or the label associated with `node`
   - *{function}* `(iri: string)` -- attempts to shorten the given `iri`
     - **returns** a `string`
     - *example:*
         ```js
         // .terse(term: Term)
         g.terse(banana.term);  // 'dbr:Banana'
         g.terse(new graphy.Literal('hello world!'));  // '"hello world!"'
         g.terse(new graphy.Literal('42', 'http://www.w3.org/2001/XMLSchema#decimal'));  // '42.0'
         g.terse(new graphy.Literal('hola mundo!', '@es'));  // '"hola mundo!"@es
         g.terse(new graphy.Literal('f', 'http://www.w3.org/2001/XMLSchema#double'));  // '"f"^^xsd:double'
         
         // .terse(node: Node)
         g.terse(banana);  // 'dbr:Banana'
         
         // .terse(iri: string)
         g.terse('http://dbpedia.org/page/Tachyon');  // dbr:Tachyon
         ```
   - *{function}* `(bag: Bag)` -- maps each [Term](#term) in `bag` to `.terse(term: Term)`
     - **returns** an `Array` of strings
     - *example:*
         ```js
         g.terse(banana.at.rdfs.label);
         /* returns: [
            '""Banane"@fr',
		    '"موز"@ar',
		    '"香蕉"@zh',
		    '"Banana"@it"',
		    ...]
		 */
         ```