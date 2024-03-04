import { U } from "npm:ts-toolbelt";

type Key = string | number | symbol
type Pred = (v: unknown) => boolean;
type Is<T> = (v: unknown) => v is T;

export class Placeholder<T extends Key, V extends Pred = Is<unknown>> {
  name: T;
  test?: V;
  constructor(name: T, test?: V) {
    this.name = name;
    this.test = test;
  }
}

export function placeholder<T extends Key, V extends Pred = Is<unknown>>(name: T, test?: V): Placeholder<T, V> {
    return new Placeholder(name, test); 
}

export type Result<P> = 
  P extends Array<infer A> ? Loop<U.ListOf<A>> :
  P extends Record<Key, infer V> ? Loop<U.ListOf<V>> :
  never;

type Loop<P, Acc extends object = {}> =
  P extends [Placeholder<infer V, Is<infer U>>, ...infer Others] ? Loop<Others, Acc | { [v in V]: U }> : 
  P extends [infer V, ...infer Others] ? Loop<Others, Acc | Result<V>> :
  U.Merge<Acc>;

export function match<T>(pattern: T, target: any): Result<T> | undefined {
  const result: any = {};
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