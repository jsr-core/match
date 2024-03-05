import { U } from "npm:ts-toolbelt@9.6.0";

type Key = string | number | symbol
type Pred = (v: unknown) => boolean;
type Is<T> = (v: unknown) => v is T;

/**
 * Placeholder class that holds a name and a test function.
 * 
 * @template T - The type of the key, which extends Key.
 * @template V - The type of the test function, which extends Pred.
 */
export class RegularPlaceholder<T extends Key, V extends Pred = Is<unknown>> {
  name: T;
  test?: V;
  constructor(name: T, test?: V) {
    this.name = name;
    this.test = test;
  }
}

export class TemplateStringPlaceholder<T extends RegularPlaceholder<Key>[]> {
  strings: TemplateStringsArray;
  placeholders: T;
  greedy: boolean;
  constructor(greedy: boolean, strings: TemplateStringsArray, ...placeholders: T) {
    this.greedy = greedy;
    this.strings = strings;
    this.placeholders = placeholders;
  }
}

export function placeholder<T extends Key, V extends Pred = Is<unknown>>(name: T, test?: V): RegularPlaceholder<T, V>;
export function placeholder<T extends RegularPlaceholder<Key>[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T>;
export function placeholder<T extends Key, U extends RegularPlaceholder<Key>[], V extends Pred = Is<unknown>>(name: T, ...test: [U] | U): RegularPlaceholder<T, V> | TemplateStringPlaceholder<U> {
  if (name instanceof Array) {
    return new TemplateStringPlaceholder(false, name as any, ...test as any);
  }
  return new RegularPlaceholder(name, ...test as any);
}
function greedy<T extends RegularPlaceholder<Key>[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T> {
  return new TemplateStringPlaceholder(true, strings, ...placeholders);
}
placeholder.greedy = greedy;

/** 
 * Result type is a recursive type that represents the result of `match` function.
 * This type is a record of keys and values that are matched.
 * All the keys are declared as placeholders in `P` and the values are the types of the matched values.
 */
export type Result<P> =
  P extends RegularPlaceholder<infer V, Is<infer U>> ? { [v in V]: U } :
  P extends TemplateStringPlaceholder<infer T> ? Loop<T> :
  P extends Array<infer A> ? Loop<U.ListOf<A>> :
  P extends Record<Key, infer V> ? Loop<U.ListOf<V>> :
  never;

type Loop<P, Acc extends object = {}> =
  P extends [infer V, ...infer Others] ? Loop<Others, Acc | Result<V>> :
  U.Merge<Acc>;

/**
 * Matches a pattern against a target object.
 * @param pattern - The pattern to match against.
 * @param target - The target object to match.
 * @returns The result of the match or undefined if there is no match.
 */
export function match<T>(pattern: T, target: any): Result<T> | undefined {
  if (pattern instanceof RegularPlaceholder) {
    if (!pattern.test || pattern.test(target)) {
      return { [pattern.name]: target } as any;
    }
    return undefined;
  }
  if (pattern instanceof TemplateStringPlaceholder) {
    if (typeof target !== 'string') {
      return undefined;
    }
    const sep = pattern.greedy ? '(.*)' : '(.*?)';
    const re = `^${pattern.strings.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(sep)}$`
    const m = target.match(new RegExp(re));
    if (!m) {
      return undefined;
    }
    const result = {} as any;
    for (let i = 0; i < pattern.placeholders.length; i++) {
      const subResult = match(pattern.placeholders[i], m[i+1]);
      if (subResult) {
        Object.assign(result, subResult);
        continue;
      }
      return undefined;
    }
    return result;
  }
  if (pattern instanceof Array) {
    const result = {} as any;
    if (!(target instanceof Array) ||
        pattern.length > target.length) {
      return undefined;
    }
    for (let i = 0; i < pattern.length; i++) {
      const element = pattern[i];
      const subResult = match(element, target[i]);
      if (subResult) {
        Object.assign(result, subResult);
        continue;
      }
      return undefined;
    }
    return result;
  }
  if (pattern instanceof Object && 
      target instanceof Object && 
      Object.getPrototypeOf(pattern) === Object.getPrototypeOf({})) {
    const result = {} as any;
    for (const [key, value] of Object.entries(pattern)) {
      const subResult = match(value, target[key])
      if (key in target && subResult) {
        Object.assign(result, subResult);
        continue;
      }
      return undefined;
    }
    return result;
  }
  if (pattern === target) {
    return {} as Result<T>;
  }
  return undefined;
}
