import * as RDF from 'rdf-js';

export type Iri = string;

export type ConciseNamedNode = string;
export type TerseNamedNode = string;
export type VerboseNamedNode = string;
export type StarNamedNode = TerseNamedNode;

export type ConciseBlankNode = string;
export type TerseBlankNode = string;
export type VerboseBlankNode = string;
export type StarBlankNode = TerseBlankNode;

export type ConciseDefaultGraph = '*';
export type TerseDefaultGraph = '';
export type VerboseDefaultGraph = '';
export type StarDefaultGraph = TerseDefaultGraph;

export type ConciseLiteral = string;
export type TerseLiteral = string;
export type VerboseLiteral = string;
export type StarLiteral = TerseLiteral;

export type ConciseVariable = string;
export type TerseVariable = string;
export type VerboseVariable = string;
export type StarVariable = TerseNamedNode;


export type ConciseNode = ConciseNamedNode | ConciseBlankNode;
export type TerseNode = TerseNamedNode | TerseBlankNode;
export type VerboseNode = VerboseNamedNode | VerboseBlankNode;
export type StarNode = StarNamedNode | StarBlankNode;

export type ConciseGraphable = ConciseNode | ConciseDefaultGraph;
export type TerseGraphable = TerseNode | TerseDefaultGraph;
export type VerboseGraphable = VerboseNode | VerboseDefaultGraph;
export type StarGraphable = StarNode | StarDefaultGraph;

export type ConciseDataTerm = ConciseGraphable | ConciseLiteral;
export type TerseDataTerm = TerseGraphable | TerseLiteral;
export type VerboseDataTerm = VerboseGraphable | VerboseLiteral;
export type StarDataTerm = StarGraphable | StarLiteral;

export type ConciseJson = string;
export type ConciseDirective = string;

export type ConciseTerm = ConciseDataTerm | ConciseVariable | ConciseJson | ConciseDirective;
export type TerseTerm = TerseDataTerm | TerseVariable;
export type VerboseTerm = VerboseDataTerm | VerboseVariable;
export type StarTerm = StarDataTerm | StarVariable;

export interface IsolatedNamedNode {
    termType: 'NamedNode';
    value: string;
}

export interface IsolatedBlankNode {
    termType: 'BlankNode';
    value: string;
}

export interface IsolatedDefaultGraph {
    termType: 'DefaultGraph';
    value: '';
}

export interface IsolatedLiteral {
    termType: 'Literal';
    value: string;
    language: string;
    datatype: IsolatedNamedNode;
}

export interface IsolatedVariable {
    termType: 'Variable';
    value: string;
}

export type IsolatedNode = IsolatedNamedNode | IsolatedBlankNode;
export type IsolatedGraphable = IsolatedNode | IsolatedDefaultGraph;
export type IsolatedDataTerm = IsolatedGraphable | IsolatedLiteral;
export type IsolatedData = IsolatedDataTerm | IsolatedQuad
export type IsolatedTerm = IsolatedData | IsolatedVariable;

export interface IsolatedQuad {
    termType: 'Quad';
    value: '';
    subject: IsolatedNode;
    predicate: IsolatedNamedNode;
    object: IsolatedTerm;
    graph: IsolatedGraphable;
}

export interface PrefixMap {
    [prefixId: string]: Iri;
}

export type ConciseObjectsTarget = boolean | number | ConciseTerm | GenericTerm;
export type ConciseObjectsList = Array<ConciseObjectsTarget> | Set<ConciseObjectsTarget>
export type ConciseObjectsCollection = Array<ConciseObjectsList> | Set<ConciseObjectsList>
export type ConciseObjects = ConciseObjectsTarget | ConciseObjectsList | ConciseObjectsCollection;

export type ConciseStrictObjects = Array<ConciseTerm>;

export interface ConcisePairs {
    // [predicate: ConciseNamedNode]: ConciseObjects;
    [predicate: string]: ConciseObjects;
}

export interface ConciseTriples {
    // [subject: ConciseNode]: ConcisePairs;
    [subject: string]: ConcisePairs;
}

export interface ConciseQuads {
    // [graph: ConciseGraphable]: ConciseTriples;
    [graph: string]: ConciseTriples;
}

export abstract class GenericTerm {
    readonly isGraphyTerm: true;
    readonly isGraphyQuad: boolean;
    readonly isGraphable: boolean;
    readonly isDefaultGraph: boolean;
    readonly isNode: boolean;
    readonly isNamedNode: boolean;
    readonly isBlankNode: boolean;
    readonly isAnonymousBlankNode: boolean;
    readonly isEphemeralBlankNode: boolean;
    readonly isLiteral: boolean;
    readonly isLanguagedLiteral: boolean;
    readonly isDatatypedLiteral: boolean;
    readonly isSimpleLiteral: boolean;
    readonly isNumericLiteral: boolean;
    readonly isIntegerLiteral: boolean;
    readonly isDoubleLiteral: boolean;
    readonly isDecimalLiteral: boolean;
    readonly isBooleanLiteral: boolean;
    readonly isInfiniteLiteral: boolean;
    readonly isNaNLiteral: boolean;

    equals(other: RDF.Term): boolean;
    concise(prefixes?: PrefixMap): ConciseTerm;
    terse(prefixes?: PrefixMap): TerseTerm;
    star(prefixes?: PrefixMap): StarTerm;
    verbose(): VerboseTerm;
}

export abstract class NonLiteralTerm extends GenericTerm {
    readonly isLiteral: false;
    readonly isLanguagedLiteral: false;
    readonly isDatatypedLiteral: false;
    readonly isSimpleLiteral: false;
    readonly isNumericLiteral: false;
    readonly isIntegerLiteral: false;
    readonly isDoubleLiteral: false;
    readonly isDecimalLiteral: false;
    readonly isBooleanLiteral: false;
    readonly isInfiniteLiteral: false;
    readonly isNaNLiteral: false;
}

export abstract class Graphable extends NonLiteralTerm {
    readonly isGraphyQuad: false;
    readonly isGraphable: true;
}

export abstract class Node extends Graphable {
    readonly isDefaultGraph: false;
    readonly isNode: true;
}

export abstract class GenericLiteral extends GenericTerm {
    readonly isGraphyQuad: false;
    readonly isGraphable: false;
    readonly isDefaultGraph: false;
    readonly isNode: false;
    readonly isNamedNode: false;
    readonly isBlankNode: false;
    readonly isAnonymousBlankNode: false;
    readonly isEphemeralBlankNode: false;
    readonly isLiteral: true;

    readonly termType: 'Literal';
    readonly value: string;
    readonly language: string;
    readonly datatype: NamedNode;

    concise(prefixes?: PrefixMap): ConciseLiteral;
    terse(prefixes?: PrefixMap): TerseLiteral;
    star(prefixes?: PrefixMap): StarLiteral;
    verbose(): VerboseLiteral;
    isolate(): IsolatedLiteral;
}

export class NamedNode extends Node implements RDF.NamedNode {
    readonly isDefaultGraph: false;
    readonly isNamedNode: true;
    readonly isBlankNode: false;
    readonly isAnonymousBlankNode: false;
    readonly isEphemeralBlankNode: false;

    readonly termType: 'NamedNode';
    readonly value: Iri;

    constructor(iri: Iri);
    concise(prefixes?: PrefixMap): ConciseNamedNode;
    terse(prefix?: PrefixMap): TerseNamedNode;
    star(prefixes?: PrefixMap): StarNamedNode;
    verbose(): VerboseNamedNode;
    isolate(): IsolatedNamedNode;
}

export class BlankNode extends Node implements RDF.BlankNode {
    readonly isDefaultGraph: false;
    readonly isNamedNode: false;
    readonly isBlankNode: true;

    readonly termType: 'BlankNode';
    readonly value: string;    

    constructor(label: string);
    concise(prefixes?: PrefixMap): ConciseBlankNode;
    terse(prefixes?: PrefixMap): TerseBlankNode;
    star(prefixes?: PrefixMap): StarBlankNode;
    verbose(): VerboseBlankNode;
    isolate(): IsolatedBlankNode;
}

export class AnonymousBlankNode extends BlankNode implements RDF.BlankNode {
    readonly isAnonymousBlankNode: true;
}

export class EphemeralBlankNode extends AnonymousBlankNode implements RDF.BlankNode {
    readonly isEphemeralBlankNode: true;
}

export abstract class LanguagedLiteral extends GenericLiteral implements RDF.Literal {
    readonly isLanguagedLiteral: true;
    readonly isDatatypedLiteral: false;
    readonly isSimpleLiteral: false;
    readonly isNumericLiteral: false;
    readonly isIntegerLiteral: false;
    readonly isDoubleLiteral: false;
    readonly isDecimalLiteral: false;
    readonly isBooleanLiteral: false;
    readonly isInfiniteLiteral: false;
    readonly isNaNLiteral: false;

    constructor(value: string, language: string);
}

export abstract class DatatypedLiteral extends GenericLiteral implements RDF.Literal {
    readonly isNamedNode: false;
    readonly isBlankNode: false;
    // --
    readonly isLanguagedLiteral: false;
    readonly isDatatypedLiteral: true;
    readonly isSimpleLiteral: false;

    constructor(value: string, datatype: NamedNode);
}

export class NumericLiteral extends DatatypedLiteral {
    readonly isNumericLiteral: true;
    readonly isBooleanLiteral: false;

    readonly number: number;
}

export class IntegerLiteral extends NumericLiteral {
    readonly isIntegerLiteral: true;
    readonly isDoubleLiteral: false;
    readonly isDecimalLiteral: false;
    readonly isInfiniteLiteral: false;
    readonly isNaNLiteral: false;

    constructor(value: number | string);
}

export class DoubleLiteral extends NumericLiteral {
    readonly isIntegerLiteral: false;
    readonly isDoubleLiteral: true;
    readonly isDecimalLiteral: false;

    constructor(value: number | string);
}

export class InfiniteLiteral extends DoubleLiteral {
    readonly isInfiniteLiteral: true;
    readonly isNaNLiteral: false;

    readonly boolean: boolean;
}

export class PositiveInfinityLiteral extends InfiniteLiteral {
    readonly value: 'INF';
    // readonly number: Infinity;
}

export class NegativeInfinityLiteral extends InfiniteLiteral {
    readonly value: '-INF';
    // readonly number: -Infinity;
}

export class NaNLiteral extends DoubleLiteral {
    readonly isNaNLiteral: true;

    readonly value: 'NaN';
}

export class DecimalLiteral extends NumericLiteral {
    readonly isIntegerLiteral: false;
    readonly isDoubleLiteral: false;
    readonly isDecimalLiteral: true;
    readonly isInfiniteLiteral: false;
    readonly isNaNLiteral: false;

    constructor(value: number | string);
}

export class BooleanLiteral extends DatatypedLiteral {
    readonly isNumericLiteral: false;
    readonly isIntegerLiteral: false;
    readonly isDoubleLiteral: false;
    readonly isDecimalLiteral: false;
    readonly isBooleanLiteral: true;
    readonly isInfiniteLiteral: false;
    readonly isNaNLiteral: false;

    readonly boolean: boolean;
}

export class SimpleLiteral extends GenericLiteral implements RDF.Literal {
    readonly isNamedNode: false;
    readonly isBlankNode: false;
    // --
    readonly isLanguagedLiteral: false;
    readonly isDatatypedLiteral: false;
    readonly isSimpleLiteral: true;
    readonly isNumericLiteral: false;
    readonly isIntegerLiteral: false;
    readonly isDoubleLiteral: false;
    readonly isDecimalLiteral: false;
    readonly isBooleanLiteral: false;
    readonly isInfiniteLiteral: false;
    readonly isNaNLiteral: false;

    constructor(value: string, datatype: NamedNode);
}

export class DefaultGraph extends Graphable implements RDF.DefaultGraph {
    readonly isDefaultGraph: true;
    
    readonly termType: 'DefaultGraph';
    readonly value: '';
    
    constructor();
    concise(prefixes?: PrefixMap): ConciseDefaultGraph;
    terse(prefix?: PrefixMap): TerseDefaultGraph;
    star(prefixes?: PrefixMap): StarDefaultGraph;
    verbose(): VerboseDefaultGraph;
    isolate(): IsolatedDefaultGraph;
}

export abstract class NonDataTerm extends NonLiteralTerm {
    readonly isDefaultGraph: false;
    readonly isGraphable: false;
    readonly isNode: false;
    readonly isNamedNode: false;
    readonly isBlankNode: false;
    readonly isAnonymousBlankNode: false;
    readonly isEphemeralBlankNode: false;
}

export class Variable extends NonDataTerm implements RDF.Variable {
    readonly isGraphyQuad: false;
    readonly isVariable: true;

    readonly termType: 'Variable';
    readonly value: string;
    constructor(value: string);
    concise(prefixes?: PrefixMap): ConciseVariable;
    terse(prefixes?: PrefixMap): TerseVariable;
    star(prefixes?: PrefixMap): StarVariable;
    verbose(): VerboseVariable;
    isolate(): IsolatedVariable;
}

export interface Reification {
    readonly node: BlankNode;
    readonly quads: Array<Quad>;
}

export class Quad extends NonDataTerm /* implements RDF.Quad */ {
    readonly isGraphyQuad: true;
    readonly isVariable: false;

    readonly termType: 'Quad';
    readonly value: '';
    readonly subject: Node;
    readonly predicate: NamedNode;
    readonly object: GenericTerm;
    readonly graph: Graphable;
    constructor(subject: RDF.Quad_Subject, predicate: RDF.Quad_Predicate, object: RDF.Quad_Object, graph?: RDF.Quad_Graph);
    isolate(): IsolatedQuad;
    reify(label?: string): Reification;
}


export class IterablePortableQuads implements Iterable<Quad> {
    [Symbol.iterator]: () => Iterator<Quad>;
    toString(): ConciseJson;
}

export namespace DataFactory {
    function namedNode(value: Iri): NamedNode;
    function blankNode(value?: string): BlankNode;
    function literal(value: string, languageOrDatatype?: string | RDF.NamedNode): GenericLiteral;
    function defaultGraph(): DefaultGraph;
    function variable(): Variable;
    function quad(): Quad;

    /**
     * @deprecated Use `.quad()` instead
     */
    function triple(): Quad;

    function integer(value: number | string): IntegerLiteral;
    function double(value: number | string): DoubleLiteral;
    function decimal(value: number | string | bigint): DecimalLiteral;
    function boolean(value: boolean | number | string): BooleanLiteral;

    function number(value: number | bigint): NumericLiteral;
    function date(date: Date): DatatypedLiteral;
    function dateTime(dateTime: Date): DatatypedLiteral;
    function ephemeral(): EphemeralBlankNode;

    function fromTerm(term: RDF.Term): GenericTerm;
    function fromQuad(quad: RDF.Quad): Quad;

    function comment(): ConciseDirective;
    function newlines(): ConciseDirective;

    function concise(iri: Iri, prefixes?: PrefixMap): ConciseNamedNode;
    function terse(iri: Iri, prefixes?: PrefixMap): TerseNamedNode;

    function c1(term: ConciseTerm, prefixes?: PrefixMap): GenericTerm;
    function c3(triples: ConciseTriples, prefixes?: PrefixMap, graph?: ConciseGraphable): IterablePortableQuads;
    function c4(quads: ConciseQuads, prefixes?: PrefixMap): IterablePortableQuads;
}