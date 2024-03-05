/**
 * core/match -- a pattern matching library for JavaScript and TypeScript
 * 
 * Copyright (c) 2023 TANIGUCHI Masaya. All rights reserved.
 * This code is licensed under the MIT License. See LICENSE file for more information.
 * 
 * SPDX-License-Identifier: MIT
 */

import { U } from "npm:ts-toolbelt@9.6.0";

type Key = string | number | symbol
type Pred = (v: unknown) => boolean;
type Is<T> = (v: unknown) => v is T;

/**
 * RegularPlaceholder class that holds a name and a test function.
 * 
 * @template T - Name of the placeholder.
 * @template V - Type guard function.
 */
export class RegularPlaceholder<T extends Key, V extends Pred = Is<unknown>> {
  name: T;
  test?: V;

  /**
   * Represents a class constructor.
   * @param name - The name parameter.
   * @param [test] - The test parameter (optional).
   */
  constructor(name: T, test?: V) {
    this.name = name;
    this.test = test;
  }
}

/**
 * Represents a template string placeholder with optional regular placeholders.
 * @template T - Tuple of regular placeholders.
 */
export class TemplateStringPlaceholder<T extends RegularPlaceholder<Key>[]> {
  strings: TemplateStringsArray;
  placeholders: T;
  greedy: boolean;

  /**
   * Creates a new instance of TemplateStringPlaceholder.
   * @param greedy - Indicates whether the matching should be greedy or not.
   * @param strings - The template strings array.
   * @param placeholders - The regular placeholders.
   */
  constructor(greedy: boolean, strings: TemplateStringsArray, ...placeholders: T) {
    this.greedy = greedy;
    this.strings = strings;
    this.placeholders = placeholders;
  }
}


function _placeholder<T extends Key, V extends Pred = Is<unknown>>(name: T, test?: V): RegularPlaceholder<T, V>;
function _placeholder<T extends RegularPlaceholder<Key>[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T>;
function _placeholder<T extends Key, U extends RegularPlaceholder<Key>[], V extends Pred = Is<unknown>>(nameOrStrings: T, ...testOrPlaceholders: [U] | U): RegularPlaceholder<T, V> | TemplateStringPlaceholder<U> {
  if (nameOrStrings instanceof Array) {
    return new TemplateStringPlaceholder(false, nameOrStrings as any, ...testOrPlaceholders as any);
  }
  return new RegularPlaceholder(nameOrStrings, ...testOrPlaceholders as any);
}

function greedy<T extends RegularPlaceholder<Key>[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T> {
  return new TemplateStringPlaceholder(true, strings, ...placeholders);
}
_placeholder.greedy = greedy;

/**
 * Represents a placeholder that can be used in pattern matching.
 */
export interface Placeholder {
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
  <T extends RegularPlaceholder<Key>[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T>;

  /**
   * Creates a template string placeholder with greedy matching.
   * 
   * @param strings - The template strings array.
   * @param placeholders - The regular placeholders to be used in the template string.
   * @returns A template string placeholder with the specified regular placeholders.
   */
  greedy<T extends RegularPlaceholder<Key>[]>(strings: TemplateStringsArray, ...placeholders: T): TemplateStringPlaceholder<T>;
}


/**
 * A placeholder constant.
 */
export const placeholder: Placeholder = _placeholder;

/** 
 * Result type is a recursive type that represents the result of `match` function.
 * This type is a record of keys and values that are matched.
 * All the keys are declared as placeholders in `P` and the values are the types of the matched values.
 * 
 * @template P - The pattern to match against.
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
      return { [pattern.name]: target } as Result<T>;
    }
    return undefined;
  }
  if (pattern instanceof TemplateStringPlaceholder) {
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
      const element = pattern[i];
      const subResult = match(element, target[i]);
      if (subResult) {
        result = { ...(result ?? {} as Result<T>), ...subResult };
        continue;
      }
      return undefined;
    }
    return result;
  }
  if (pattern instanceof Object &&
      target instanceof Object &&
      Object.getPrototypeOf(pattern) === Object.prototype) {
    const result = {} as Result<T>;
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
