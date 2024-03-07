/**
 * core/match -- a pattern matching library for JavaScript and TypeScript
 * 
 * Copyright (c) 2023 TANIGUCHI Masaya. All rights reserved.
 * This code is licensed under the MIT License. See LICENSE file for more information.
 * 
 * SPDX-License-Identifier: MIT
 */

import { U, A } from "npm:ts-toolbelt@9.6.0";

type Key = string | number | symbol;
type Pred = (v: unknown) => boolean;
type Is<T> = (v: unknown) => v is T;

/**
 * Checks if the value is an instance of the specified class.
 * @param v - The value to check.
 * @param t - The class to check against.
 * @returns True if the value is an instance of the specified class, false otherwise.
 * @template T - The type of the class.
 */
function is<T>(v: unknown, t: new (...args: any[]) => T): v is T {
  return v instanceof Object && Object.getPrototypeOf(v) === t.prototype;
}

export class Placeholder {}

/**
 * AnonymousPlaceholder class that holds a test function.
 * 
 * @template V - Type guard function.
 */
export class AnonymousPlaceholder<V extends Pred = Is<unknown>>  extends Placeholder {
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
export class RegularPlaceholder<T extends Key, V extends Pred = Is<unknown>> extends Placeholder {
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

function _placeholder<V extends Pred = Is<unknown>>(test?: V): AnonymousPlaceholder<V>;
function _placeholder<T extends Key, V extends Pred = Is<unknown>>(name: T, test?: V): RegularPlaceholder<T, V>;
function _placeholder<T extends Placeholder[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T>;
function _placeholder<T extends Key, U extends RegularPlaceholder<Key>[], V extends Pred = Is<unknown>>(
  nameOrStringsOrTest?: T | TemplateStringsArray | V,
  ...testOrPlaceholders: [] | [V] | U
): RegularPlaceholder<T, V> | TemplateStringPlaceholder<U> | AnonymousPlaceholder<V> {
  const isAbstractPlaceholders =
    (v: unknown[]): v is U => v.every(p => p instanceof Placeholder);
  const isKey =
    (v: unknown): v is T => typeof v === 'string' || typeof v === 'number' || typeof v === 'symbol';
  const maybeTypeGuard =
    (v: unknown): v is V | undefined => typeof v === 'function' || v === undefined;
  const isTemplateStringsArray =
    (v: unknown): v is TemplateStringsArray => Array.isArray(v) && v.every(s => typeof s === 'string');
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
  <V extends Pred = Is<unknown>>(test?: V): AnonymousPlaceholder<V>;

  /**
   * Creates a regular placeholder with an optional name and test function.
   * 
   * @param name - The name of the placeholder.
   * @param test - The test function to validate the placeholder value.
   * @returns A regular placeholder with the specified name and test function.
   */
  <T extends Key, V extends Pred = Is<unknown>>(name: T, test?: V): RegularPlaceholder<T, V>;

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
export type Result<P> =
  P extends RegularPlaceholder<infer V, Is<infer U>> ? 
    { [v in V]: U } :
    P extends TemplateStringPlaceholder<infer T> ? 
      LoopTemplateStringArgs<T> :
      P extends AnonymousPlaceholder ? 
        never :
        P extends Array<infer A> ?
          LoopOtherArgs<U.ListOf<A>> :
          P extends Record<Key, infer V> ? 
            LoopOtherArgs<U.ListOf<V>> :
            never;

type LoopTemplateStringArgs<P, Acc extends Record<Key, unknown> = never> =
  P extends [RegularPlaceholder<infer V, Is<infer U>>, ...infer Others] ? 
    A.Equals<U, unknown> extends 1 ? 
      LoopTemplateStringArgs<Others, Acc | Result<RegularPlaceholder<V, Is<string>>>> :
      LoopTemplateStringArgs<Others, Acc | Result<RegularPlaceholder<V, Is<U>>>> :
    P extends [infer T, ...infer Others] ? 
      LoopTemplateStringArgs<Others, Acc | Result<T>> :
      U.Merge<Acc>;

type LoopOtherArgs<P, Acc extends Record<Key, unknown> = never> =
  P extends [infer V, ...infer Others] ? 
    LoopOtherArgs<Others, Acc | Result<V>> :
    U.Merge<Acc>;

/**
 * Matches a pattern against a target object.
 * @param pattern - The pattern to match against.
 * @param target - The target object to match.
 * @returns The result of the match or undefined if there is no match.
 */
export function match<T>(pattern: T, target: unknown): Result<T> | undefined {
  if (is(pattern, AnonymousPlaceholder)) {
    if (!pattern.test || pattern.test(target)) {
      return {} as Result<T>;
    }
    return undefined;
  }
  if (is(pattern, RegularPlaceholder)) {
    if (!pattern.test || pattern.test(target)) {
      return { [pattern.name]: target } as Result<T>;
    }
    return undefined;
  }
  if (is(pattern, TemplateStringPlaceholder)) {
    if (typeof target !== 'string') {
      return undefined;
    }
    const sep = pattern.greedy ? '(.*)' : '(.*?)';
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^${pattern.strings.map(esc).join(sep)}$`);
    const m = target.match(re);
    let result: Result<T> | undefined;
    for (let i = 0; m && i < pattern.placeholders.length; i++) {
      const subResult = match(pattern.placeholders[i], m[i+1]);
      if (subResult) {
        result = { ...(result ?? {} as Result<T>), ...subResult };
        continue;
      }
      return undefined;
    }
    return result;
  }
  if (Array.isArray(pattern)) {
    let result: Result<T> | undefined;
    const ok = Array.isArray(target) && pattern.length <= target.length;
    for (let i = 0; ok && i < pattern.length; i++) {
      const subResult = match(pattern[i], target[i]);
      if (subResult) {
        result = { ...(result ?? {} as Result<T>), ...subResult };
        continue;
      }
      return undefined;
    }
    return result;
  }
  if (is(pattern, Object) && target instanceof Object) {
    const result = {} as Result<T>;
    for (const [key, value] of Object.entries(pattern)) {
      if (key in target) {
        const subResult = match(value, (target as any)[key]);
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
    return {} as Result<T>;
  }
  return undefined;
}
