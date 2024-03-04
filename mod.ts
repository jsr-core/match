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
export class Placeholder<T extends Key, V extends Pred = Is<unknown>> {
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
 * @returns {Placeholder<T, V>} - A new Placeholder object.
 */
export function placeholder<T extends Key, V extends Pred = Is<unknown>>(name: T, test?: V): Placeholder<T, V> {
    return new Placeholder(name, test); 
}

/**
 * Result type is a recursive type that represents the result of `match` function.
 * This type is a record of keys and values that are matched.
 * All the keys are declared as placeholders in `P` and the values are the types of the matched values.
 */
export type Result<P> = 
  P extends Array<infer A> ? Loop<U.ListOf<A>> :
  P extends Record<Key, infer V> ? Loop<U.ListOf<V>> :
  never;

type Loop<P, Acc extends object = {}> =
  P extends [Placeholder<infer V, Is<infer U>>, ...infer Others] ? Loop<Others, Acc | { [v in V]: U }> : 
  P extends [infer V, ...infer Others] ? Loop<Others, Acc | Result<V>> :
  U.Merge<Acc>;

/**
 * Matches a pattern against a target object.
 * @param pattern - The pattern to match against.
 * @param target - The target object to match.
 * @returns The result of the match or undefined if there is no match.
 */
export function match<T>(pattern: T, target: any): Result<T> | undefined {
  const result: any = {};
  if (pattern instanceof Placeholder) {
    if (!pattern.test || pattern.test(target)) {
      result[pattern.name] = target;
      return result;
    } else {
      return undefined;
    }
  }
  if (pattern === null || pattern === undefined) {
    if (pattern === target) {
      return result;
    }
    return undefined;
  }
  if (pattern instanceof Array) {
    if (!(target instanceof Array)) {
      return undefined;
    }
    if (pattern.length > target.length) {
      return undefined;
    }
    for (let i = 0; i < pattern.length; i++) {
      const value = pattern[i];
      if (value instanceof Placeholder) {
        if (!value.test || value.test(target[i])) {
          result[value.name] = target[i];
          continue;
        }
        return undefined;
      }
      const subResult = match(value, target[i]);
      if (subResult) {
        Object.assign(result, subResult);
        continue;
      }
      return undefined;
    }
    return result;
  }
  if (Object.getPrototypeOf(pattern) === Object.getPrototypeOf({}) && target instanceof Object) {
    for (const key in pattern) {
      if (key in target) {
        const value = pattern[key];
        if (value instanceof Placeholder) {
          if (!value.test || value.test(target[key])) {
            result[value.name] = target[key];
            continue;
          } else if (value.test) {
            return undefined;
          }
        }
        const subResult = match(value, target[key]);
        if (subResult) {
          Object.assign(result, subResult);
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    }
    return result;
  }
  if (pattern === target) {
    return result;
  }
  return undefined;
}