/**
 * core/match -- a pattern matching library for JavaScript and TypeScript
 *
 * Copyright (c) 2024 TANIGUCHI Masaya. All rights reserved.
 * This code is licensed under the MIT License. See LICENSE file for more information.
 *
 * SPDX-License-Identifier: MIT
 */

import type { U, A } from "npm:ts-toolbelt@9.6.0";
import type { Predicate } from "jsr:@core/unknownutil@3.18.0";
import { is } from "jsr:@core/unknownutil@3.18.0";

type Key = string | number | symbol;
type Entries<Obj, Keys = U.ListOf<keyof Obj>, Acc extends ([keyof Obj, Obj[keyof Obj]])[] = []> =
  Keys extends [infer Key extends keyof Obj, ...infer Rest extends (keyof Obj)[]] ? Entries<Obj, Rest, [[Key, Obj[Key]], ...Acc]> : Acc;

export class Placeholder {}

/**
 * AnonymousPlaceholder class that holds a test function.
 *
 * @template V - Type guard function.
 */
export class AnonymousPlaceholder<V extends Predicate<unknown> = Predicate<unknown>>  extends Placeholder {
  /** The test function to validate the placeholder value. */
  test?: V;

  /**
   * Represents a class constructor
   * @param [test] - The test parameter (optional).
   */
  constructor(test?: V) {
    super();
    this.test = test;
  }
}

/**
 * RegularPlaceholder class that holds a name and a test function.
 *
 * @template T - Name of the placeholder.
 * @template V - Type guard function.
 */
export class RegularPlaceholder<T extends Key, V extends Predicate<unknown> = Predicate<unknown>> extends Placeholder {
  /** The name of the placeholder. */
  name: T;
  /** The test function to validate the placeholder value. */
  test?: V;

  /**
   * Represents a class constructor.
   * @param name - The name parameter.
   * @param [test] - The test parameter (optional).
   */
  constructor(name: T, test?: V) {
    super();
    this.name = name;
    this.test = test;
  }
}

/**
 * Represents a template string placeholder with optional regular placeholders.
 * @template T - Tuple of regular placeholders.
 */
export class TemplateStringPlaceholder<T extends Placeholder[]>  extends Placeholder {
  /** The template strings array. */
  strings: TemplateStringsArray;
  /** The regular placeholders. */
  placeholders: T;
  /** Indicates whether the matching should be greedy or not. */
  greedy: boolean;

  /**
   * Creates a new instance of TemplateStringPlaceholder.
   * @param greedy - Indicates whether the matching should be greedy or not.
   * @param strings - The template strings array.
   * @param placeholders - The regular placeholders.
   */
  constructor(greedy: boolean, strings: TemplateStringsArray, ...placeholders: T) {
    super();
    this.greedy = greedy;
    this.strings = strings;
    this.placeholders = placeholders;
  }
}

function _placeholder<V extends Predicate<unknown> = Predicate<unknown>>(test?: V): AnonymousPlaceholder<V>;
function _placeholder<T extends Key, V extends Predicate<unknown> = Predicate<unknown>>(name: T, test?: V): RegularPlaceholder<T, V>;
function _placeholder<T extends Placeholder[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T>;
function _placeholder<T extends Key, U extends RegularPlaceholder<Key>[], V extends Predicate<unknown> = Predicate<unknown>>(
  nameOrStringsOrTest?: T | TemplateStringsArray | V,
  ...testOrPlaceholders: [] | [V] | U
): RegularPlaceholder<T, V> | TemplateStringPlaceholder<U> | AnonymousPlaceholder<V> {
  const isAbstractPlaceholders =
    (v: unknown[]): v is U => is.ArrayOf(is.InstanceOf(Placeholder))(v);
  const isKey = is.UnionOf([is.String, is.Number, is.Symbol]);
  const maybeTypeGuard =
    (v: unknown): v is V | undefined => is.UnionOf([is.Function, is.Undefined])(v);
  const isTemplateStringsArray =
    (v: unknown): v is TemplateStringsArray => is.ArrayOf(is.String)(v);
  if (maybeTypeGuard(nameOrStringsOrTest)) {
    return new AnonymousPlaceholder(nameOrStringsOrTest);
  } else if (isKey(nameOrStringsOrTest)) {
    if (maybeTypeGuard(testOrPlaceholders[0])) {
      return new RegularPlaceholder(nameOrStringsOrTest, testOrPlaceholders[0]);
    }
  } else if (isTemplateStringsArray(nameOrStringsOrTest)) {
    if (isAbstractPlaceholders(testOrPlaceholders)) {
      return new TemplateStringPlaceholder(false, nameOrStringsOrTest, ...testOrPlaceholders);
    }
  }
  throw new Error('Invalid arguments');
}

function greedy<T extends Placeholder[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T> {
  return new TemplateStringPlaceholder(true, strings, ...placeholders);
}
_placeholder.greedy = greedy;

/**
 * Represents a placeholder that can be used in pattern matching.
 */
export interface PlaceholderFactory {
  /**
   * Creates an anonymous placeholder with an optional test function.
   *
   * @param test - The test function to validate the placeholder value.
   * @returns An anonymous placeholder with the specified test function.
   */
  <V extends Predicate<unknown> = Predicate<unknown>>(test?: V): AnonymousPlaceholder<V>;

  /**
   * Creates a regular placeholder with an optional name and test function.
   *
   * @param name - The name of the placeholder.
   * @param test - The test function to validate the placeholder value.
   * @returns A regular placeholder with the specified name and test function.
   */
  <T extends Key, V extends Predicate<unknown> = Predicate<unknown>>(name: T, test?: V): RegularPlaceholder<T, V>;

  /**
   * Creates a template string placeholder with multiple regular placeholders.
   *
   * @param strings - The template strings array.
   * @param placeholders - The regular placeholders to be used in the template string.
   * @returns A template string placeholder with the specified regular placeholders.
   */
  <T extends Placeholder[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T>;

  /**
   * Creates a template string placeholder with greedy matching.
   *
   * @param strings - The template strings array.
   * @param placeholders - The regular placeholders to be used in the template string.
   * @returns A template string placeholder with the specified regular placeholders.
   */
  greedy<T extends Placeholder[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T>;
}


/**
 * A placeholder constant.
 */
export const placeholder: PlaceholderFactory = _placeholder;

/**
 * Result type is a recursive type that represents the result of `match` function.
 * This type is a record of keys and values that are matched.
 * All the keys are declared as placeholders in `P` and the values are the types of the matched values.
 *
 * @template P - The pattern to match against.
 */
export type Match<P> =
  P extends RegularPlaceholder<infer V, Predicate<infer U>> ?
    { [v in V]: U } :
    P extends TemplateStringPlaceholder<infer T> ?
      MatchTemplateString<T> :
      P extends AnonymousPlaceholder ?
        Record<Key, unknown> :
        P extends Array<infer A> ?
          MatchArrayOrRecord<U.ListOf<A>> :
          P extends Record<Key, infer V> ?
            MatchArrayOrRecord<U.ListOf<V>> :
            Record<Key, unknown>;

type MatchTemplateString<P, Acc extends Record<Key, unknown> = Record<Key, unknown>> =
  P extends [RegularPlaceholder<infer V, Predicate<infer U>>, ...infer Others] ?
    A.Equals<U, unknown> extends 1 ?
      MatchTemplateString<Others, Acc | Match<RegularPlaceholder<V, Predicate<string>>>> :
      MatchTemplateString<Others, Acc | Match<RegularPlaceholder<V, Predicate<U>>>> :
    P extends [infer T, ...infer Others] ?
      MatchTemplateString<Others, Acc | Match<T>> :
      U.Merge<Acc>;

type MatchArrayOrRecord<P, Acc extends Record<Key, unknown> = Record<Key, unknown>> =
  P extends [infer V, ...infer Others] ?
    MatchArrayOrRecord<Others, Acc | Match<V>> :
    U.Merge<Acc>;

/**
 * Returns a type that represents the expected type of the pattern.
 * Note that this type is experimental and no gurarantee is provided.
 * @template P - The pattern to match against.
 * @returns The expected type of the pattern.
 **/
export type Expected<P> =
  P extends RegularPlaceholder<infer _V, Predicate<infer U>> ?
    U :
    P extends TemplateStringPlaceholder<infer _T> ?
      string :
      P extends AnonymousPlaceholder ?
        unknown :
        P extends Array<infer A> ?
          ExpectedArray<U.ListOf<A>> :
          P extends Record<Key, unknown> ?
            ExpectedRecord<Entries<P>> :
              P;

type ExpectedArray<P, Acc extends unknown[] = []> =
  P extends [infer V, ...infer Rest] ?
    ExpectedArray<Rest, [...Acc, Expected<V>]> :
    Acc;

type ExpectedRecord<P, Acc extends Record<Key, unknown> = never> =
  P extends [[infer K extends Key, infer V], ...infer Rest] ?
    ExpectedRecord<Rest, { [k in K]: Expected<V> } | Acc> :
    U.Merge<Acc>;

/**
 * Matches a pattern against a target object.
 * @param pattern - The pattern to match against.
 * @param target - The target object to match.
 * @returns The result of the match or undefined if there is no match.
 */
export function match<T>(pattern: T, target: unknown): Match<T> | undefined {
  if (is.InstanceOf(AnonymousPlaceholder)(pattern)) {
    if (!pattern.test || pattern.test(target)) {
      return {} as Match<T>;
    }
    return undefined;
  }
  if (is.InstanceOf(RegularPlaceholder)(pattern)) {
    if (!pattern.test || pattern.test(target)) {
      return { [pattern.name]: target } as Match<T>;
    }
    return undefined;
  }
  if (is.InstanceOf(TemplateStringPlaceholder<any[]>)(pattern)) {
    if (typeof target !== 'string') {
      return undefined;
    }
    const sep = pattern.greedy ? '(.*)' : '(.*?)';
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^${pattern.strings.map(esc).join(sep)}$`);
    const m = target.match(re);
    let result: Match<T> | undefined;
    for (let i = 0; m && i < pattern.placeholders.length; i++) {
      const subResult = match(pattern.placeholders[i], m[i+1]);
      if (subResult) {
        result = { ...(result ?? {} as Match<T>), ...subResult };
        continue;
      }
      return undefined;
    }
    return result;
  }
  if (is.ArrayOf(is.Any)(pattern)) {
    if (!(is.Array(target) && pattern.length <= target.length)) {
      return undefined;
    }
    const result = {} as Match<T>;
    for (let i = 0; i < pattern.length; i++) {
      const subResult = match(pattern[i], target[i]);
      if (subResult) {
        Object.assign(result, subResult);
        continue;
      }
      return undefined;
    }
    return result;
  }
  // pattern should be a direct instance of Object
  if (pattern instanceof Object && Object.getPrototypeOf(pattern) === Object.prototype && is.Record(target)) {
    const result = {} as Match<T>;
    for (const [key, value] of Object.entries(pattern)) {
      if (key in target) {
        const subResult = match(value, target[key]);
        if (subResult) {
          Object.assign(result, subResult);
          continue;
        }
      }
      return undefined;
    }
    return result;
  }
  if (pattern === target) {
    return {} as Match<T>;
  }
  return undefined;
}
