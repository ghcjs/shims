#ifndef __GHCJS_RTS_H_
#define __GHCJS_RTS_H_

/*
 * low-level heap object manipulation macros
 */

#ifdef GHCJS_PROF
#define MK_TUP2(x1,x2) (h$c2(h$ghczmprimZCGHCziTupleziZLz2cUZR_con_e,(x1),(x2),h$currentThread?h$currentThread.ccs:h$CCS_SYSTEM))
#define MK_TUP3(x1,x2,x3) (h$c3(h$ghczmprimZCGHCziTupleziZLz2cUz2cUZR_con_e,(x1),(x2),(x3),h$currentThread?h$currentThread.ccs:h$CCS_SYSTEM))
#define MK_TUP4(x1,x2,x3,x4) (h$c4(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),h$currentThread?h$currentThread.ccs:h$CCS_SYSTEM))
#define MK_TUP5(x1,x2,x3,x4,x5) (h$c5(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5)),h$currentThread?h$currentThread.ccs:h$CCS_SYSTEM))
#define MK_TUP6(x1,x2,x3,x4,x5,x6) (h$c6(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5),(x6),h$currentThread?h$currentThread.ccs:h$CCS_SYSTEM))
#define MK_TUP7(x1,x2,x3,x4,x5,x6,x7) (h$c7(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5),(x6),(x7),h$currentThread?h$currentThread.ccs:h$CCS_SYSTEM))
#define MK_TUP8(x1,x2,x3,x4,x5,x6,x7,x8) (h$c8(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5),(x6),(x7),(x8),h$currentThread?h$currentThread.ccs:h$CCS_SYSTEM))
#define MK_TUP9(x1,x2,x3,x4,x5,x6,x7,x8) (h$c8(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5),(x6),(x7),(x8),h$currentThread?h$currentThread.ccs:h$CCS_SYSTEM))
#define MK_TUP10(x1,x2,x3,x4,x5,x6,x7,x8) (h$c8(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5),(x6),(x7),(x8),h$currentThread?h$currentThread.ccs:h$CCS_SYSTEM))
#else
#define MK_TUP2(x1,x2) (h$c2(h$ghczmprimZCGHCziTupleziZLz2cUZR_con_e,(x1),(x2)))
#define MK_TUP3(x1,x2,x3) (h$c3(h$ghczmprimZCGHCziTupleziZLz2cUz2cUZR_con_e,(x1),(x2),(x3)))
#define MK_TUP4(x1,x2,x3,x4) (h$c4(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4)))
#define MK_TUP5(x1,x2,x3,x4,x5) (h$c5(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5)))
#define MK_TUP6(x1,x2,x3,x4,x5,x6) (h$c6(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5),(x6)))
#define MK_TUP7(x1,x2,x3,x4,x5,x6,x7) (h$c7(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5),(x6),(x7)))
#define MK_TUP8(x1,x2,x3,x4,x5,x6,x7,x8) (h$c8(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5),(x6),(x7),(x8)))
#define MK_TUP9(x1,x2,x3,x4,x5,x6,x7,x8,x9) (h$c8(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5),(x6),(x7),(x8),(x9)))
#define MK_TUP10(x1,x2,x3,x4,x5,x6,x7,x8) (h$c8(h$ghczmprimZCGHCziTupleziZLz2cUz2cUz2cUz2cUz2cUz2cUz2cUz2cUz2cUZR_con_e,(x1),(x2),(x3),(x4),(x5),(x6),(x7),(x8),(x9),(x10)))
#endif

// GHCJS.Prim.JSRef
#ifdef GHCJS_PROF
#define MK_JSREF(x) (h$c1($ghcjszmprimZCGHCJSziPrimziJSRef_con_e, (x), h$CCS_SYSTEM))
#else
#define MK_JSREF(x) (h$c1($ghcjszmprimZCGHCJSziPrimziJSRef_con_e, (x))
#endif
#define JSREF_VAL(x) ((x).d1)

// GHCJS.Prim.JSException
#ifdef GHCJS_PROF
#define MK_JSEXCEPTION(msg,hsMsg) (h$c2(h$ghcjszmprimZCGHCJSziPrimziJSException_con_e,(msg),(hsMsg),h$CCS_SYSTEM))
#else
#define MK_JSEXCEPTION(msg,hsMsg) (h$c2(h$ghcjszmprimZCGHCJSziPrimziJSException_con_e,(msg),(hsMsg)))
#endif
// Exception dictionary for JSException
#define HS_JSEXCEPTION_EXCEPTION h$ghcjszmprimZCGHCJSziPrimzizdfExceptionJSException


// SomeException
#ifdef GHCJS_PROF
#define MK_SOMEEXCEPTION(dict,except) (h$c2(h$baseZCGHCziExceptionziSomeException_con_e,(dict),(except),h$CCS_SYSTEM))
#else
#define MK_SOMEEXCEPTION(dict,except) (h$c2(h$baseZCGHCziExceptionziSomeException_con_e,(dict),(except)))
#endif

// GHC.Integer.GMP.Internals
#ifdef GHCJS_PROF
#define MK_INTEGER_S(i) (h$c1(h$integerzmgmpZCGHCziIntegerziTypeziSzh_con_e, (i), h$CCS_SYSTEM));
#define MK_INTEGER_J(i) (h$c2(h$integerzmgmpZCGHCziIntegerziTypeziJzh_con_e, 0, (i), h$CCS_SYSTEM));
#else
#define MK_INTEGER_S(i) (h$c1(h$integerzmgmpZCGHCziIntegerziTypeziSzh_con_e, (i)));
#define MK_INTEGER_J(i) (h$c2(h$integerzmgmpZCGHCziIntegerziTypeziJzh_con_e, 0, (i)));
#endif

// Data.Maybe.Maybe
#define HS_NOTHING
#define IS_NOTHING(x) ((x).f === h$baseZCGHCziBaseziNothing_con_e)
#define IS_JUST(x) ((x).f === h$baseZCGHCziBaseziJust_con_e)
#define JUST_VAL(x) ((x).d1)
// #define HS_NOTHING h$nothing
#ifdef GHCJS_PROF
#define MK_JUST(v) (h$c1(h$baseZCGHCziBaseziJust_con_e, (v)))
#else
#define MK_JUST(v) (h$c1(h$baseZCGHCziBaseziJust_con_e, (v), h$CCS_SYSTEM))
#endif

// Data.List
#define HS_NIL h$ghczmprimZCGHCziTypesziZMZN
#define HS_NIL_CON h$ghczmprimZCGHCziTypesziZMZN_con_e
#define IS_CONS(x) ((x).f === h$ghczmprimZCGHCziTypesziZC_con_e)
#define IS_NIL(x) ((x).f === h$ghczmprimZCGHCziTypesziZMZN_con_e)
#define CONS_HEAD(x) ((x).d1)
#define CONS_TAIL(x) ((x).d2)
#ifdef GHCJS_PROF
#define MK_CONS(h,t) (h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, (h), (t), h$CCS_SYSTEM)))
#define MK_CONS_CC(h,t,cc) (h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, (h), (t), (cc)))
#else
#define MK_CONS(h,t) (h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, (h), (t)))
#define MK_CONS_CC(h,t,cc) (h$c2(h$ghczmprimZCGHCziTypesziZC_con_e, (h), (t)))
#endif

// Data.Text
#define DATA_TEXT_ARRAY(x) ((x).d1)
#define DATA_TEXT_OFFSET(x) ((x).d2.d1)
#define DATA_TEXT_LENGTH(x) ((x).d2.d2)

// Data.Text.Lazy
#define LAZY_TEXT_IS_CHUNK(x) ((x).f.a === 2)
#define LAZY_TEXT_IS_NIL(x) ((x).f.a. === 1)
#define LAZY_TEXT_CHUNK_TAIL(x) ((x).d3)

// black holes
// can we skip the indirection for black holes?
#define IS_BLACKHOLE(x) ((x).f.t === 5)
#define BLACKHOLE_TID(bh) ((bh).d1)
#define SET_BLACKHOLE_TID(bh,tid) ((
#define BLACKHOLE_QUEUE(bh) ((bh).d2)
#define BLACKHOLE_SET_QUEUE(bh,v) ((bh).d2 = (v))

// resumable thunks
#define MAKE_RESUMABLE(c,stack) { c.f = h$resume_e; c.d1 = (stack), c.d2 = null; }

// general deconstruction
#define IS_THUNK(x) ((x).f.t === 0)
#define CONSTR_TAG(x) ((x).f.a)
// retrieve  a numeric value that's possible stored as an indirection
#define UNWRAP_NUMBER(x) ((typeof(x) === 'number')?x:x.d1)

// generic lazy values
#ifdef GHCJS_PROFILING
#define MK_LAZY(f) (h$c1(h$lazy_e, (f))
#define MK_LAZY_CC(f,cc) (h$c1(h$lazy_e, (f))
#else
#define MK_LAZY(f) (h$c1(h$lazy_e, (f), h$CCS_SYSTEM))
#define MK_LAZY_CC(f,cc) (h$c1(h$lazy_e, (f), (cc)))
#endif

// generic data constructors and selectors
#ifdef GHCJS_PROFILING
#define MK_DATA1_1(val) (h$c1(h$data1_e, (val), h$CCS_SYSTEM))
#define MK_DATA1_2(val1,val2) (h$c2(h$data1_e, (val1), (val2), h$CCS_SYSTEM))
#define MK_DATA2_1(val) (h$c1(h$data2_e, (val), h$CCS_SYSTEM))
#define MK_DATA2_2(val1,val2) (h$c2(h$data1_e, (val1), (val2), h$CCS_SYSTEM))
#define MK_SELECT1(val) (h$c1(h$select1_e, (val), h$CCS_SYSTEM))
#define MK_SELECT2(val) (h$c1(h$select2_e, (val), h$CCS_SYSTEM))
#define MK_AP1(f,x) (h$c1(h$ap1_e, (f), (x), h$CCS_SYSTEM))
#define MK_AP2(f,x,y) (h$c2(h$ap2_e, (f), (x), (y), h$CCS_SYSTEM))
#else
#define MK_DATA1_1(val) (h$c1(h$data1_e, (val)))
#define MK_DATA1_2(val1,val2) (h$c2(h$data1_e, (val1), (val2)))
#define MK_DATA2_1(val) (h$c1(h$data2_e, (val)))
#define MK_DATA2_2(val1,val2) (h$c2(h$data2_e, (val1), (val2)))
#define MK_SELECT1(val) (h$c1(h$select1_e, (val)))
#define MK_SELECT2(val) (h$c1(h$select2_e, (val)))
#define MK_AP1(f,x) (h$c1(h$ap1_e,(f),(x)))
#define MK_AP2(f,x,y) (h$c2(h$ap2_e,(f),(x),(y)))
#endif

// unboxed tuple returns
#define RETURN_UBX_TUP1(x) return x;
#define RETURN_UBX_TUP2(x1,x2) { h$ret1 = x2; return x1; }
#define RETURN_UBX_TUP3(x1,x2,x3) { h$ret1 = x2; h$ret2 = x3; return x1; }
#define RETURN_UBX_TUP4(x1,x2,x3,x4) { h$ret1 = x2; h$ret2 = x3; h$ret3 = x4; return x1; }
#define RETURN_UBX_TUP5(x1,x2,x3,x4,x5) { h$ret1 = x2; h$ret2 = x3; h$ret3 = x4; h$ret4 = x5;return x1; }
#define RETURN_UBX_TUP6(x1,x2,x3,x4,x5,x6) { h$ret1 = x2; h$ret2 = x3; h$ret3 = x4; h$ret4 = x5; h$ret5 = x6; return x1; }
#define RETURN_UBX_TUP7(x1,x2,x3,x4,x5,x6,x7) { h$ret1 = x2; h$ret2 = x3; h$ret3 = x4; h$ret4 = x5; h$ret5 = x6; h$ret6 = x7; return x1; }
#define RETURN_UBX_TUP8(x1,x2,x3,x4,x5,x6,x7,x8) { h$ret1 = x2; h$ret2 = x3; h$ret3 = x4; h$ret4 = x5; h$ret5 = x6; h$ret6 = x7; h$ret7 = x8; return x1; }
#define RETURN_UBX_TUP9(x1,x2,x3,x4,x5,x6,x7,x8,x9) { h$ret1 = x2; h$ret2 = x3; h$ret3 = x4; h$ret4 = x5; h$ret5 = x6; h$ret6 = x7; h$ret7 = x8; h$ret8 = x9; return x1; }
#define RETURN_UBX_TUP10(x1,x2,x3,x4,x5,x6,x7,x8,x9,x10) { h$ret1 = x2; h$ret2 = x3; h$ret3 = x4; h$ret4 = x5; h$ret5 = x6; h$ret6 = x7; h$ret7 = x8; h$ret8 = x9; h$ret9 = x10; return x1; }

#endif
