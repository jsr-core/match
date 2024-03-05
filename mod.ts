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

/**
 * Function to create a new Placeholder object.
 * 
 * @template T - The type of the key, which extends Key.
 * @template V - The type of the test function, which extends Pred.
 * @param {T} name - The name of the placeholder.
 * @param {V} [test] - The test function of the placeholder.
 * @returns {RegularPlaceholder<T, V>} - A new Placeholder object.
 */
export function regularPlaceholder<T extends Key, V extends Pred = Is<unknown>>(name: T, test?: V): RegularPlaceholder<T, V> {
  return new RegularPlaceholder(name, test);
}

export class TemplateStringPlaceholder<T extends RegularPlaceholder<Key>[]> {
  strings: TemplateStringsArray;
  placeholders: T;
  constructor(strings: TemplateStringsArray, ...placeholders: T) {
    this.strings = strings;
    this.placeholders = placeholders;
  }
}

export function templateStringPlaceholder<T extends RegularPlaceholder<Key>[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T> {
  return new TemplateStringPlaceholder(strings, ...placeholders);
}

export function placeholder<T extends Key, V extends Pred = Is<unknown>>(name: T, test?: V): RegularPlaceholder<T, V>;
export function placeholder<T extends RegularPlaceholder<Key>[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T>;
export function placeholder<T extends Key, U extends RegularPlaceholder<Key>[], V extends Pred = Is<unknown>>(name: T, ...test: [U] | U): RegularPlaceholder<T, V> | TemplateStringPlaceholder<U> {
  if (name instanceof Array) {
    return templateStringPlaceholder(name as any, ...test as any);
  }
  return regularPlaceholder(name, ...test as any);
}

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
    if (!(target instanceof String || 
          typeof target === 'string')) {
      return undefined;
    }
    const result = {} as any;
    if (target.startsWith(pattern.strings[0]) === false) {
      return undefined;
    }
    let prevEnd = pattern.strings[0].length;
    for (let i = 0; i < pattern.placeholders.length - 1; i++) {
      const nextStart = target.indexOf(pattern.strings[i+1], prevEnd);
      if (nextStart === -1) {
        return undefined;
      }
      const subResult = match(pattern.placeholders[i], target.slice(prevEnd, nextStart));
      if (subResult) {
        Object.assign(result, subResult);
        prevEnd = nextStart + pattern.strings[i+1].length;
        continue;
      }
      return undefined;
    }
    if (pattern.strings.at(-1) !== '') {
      const nextStart = target.indexOf(pattern.strings.at(-1)!, prevEnd);
      if (nextStart === -1) {
        return undefined;
      }
      const subResult = match(pattern.placeholders.at(-1), target.slice(prevEnd, nextStart));
      if (subResult) {
        Object.assign(result, subResult);
        return result;
      }
      return undefined;
    }
    const subResult = match(pattern.placeholders.at(-1), target.slice(prevEnd));
    if (subResult) {
      Object.assign(result, subResult);
      return result;
    }
    return undefined;
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
