# TS Match

A pattern matching library for JavaScript/ TypeScript

EcmaScript has a structured binding. It is a very useful notation for extracting only the necessary parts from a complex structure.
However, this structured binding is incomplete for use as pattern matching. Because,
To do a structured binding, the pre-assigned value must match the pattern,
If it does not match the pattern, an exception is thrown.

Therefore, to do structured binding, TypeScript either guarantees that the structure matches at compile time, or it does not,
Validation libraries such as zod or unknownutils to check at runtime that the structure matches.
The former is impotent for data whose structure is not determined at compile time, such as JSON data,
The latter required writing two structured binding patterns and two validation patterns.

This library can perform structured binding and validation simultaneously, while preserving compile-time type information,
It is a library that enables true pattern matching and brings EcmaScript's structured binding to perfection.

Again, this is not just for TypeScript, it is also useful in JavaScript.

## Usage

This library is published in JSR and can be used in Deno with `jsr:@core/match`.
There are only two functions that users need to remember: `$` and `match`.

```ts
import { $, match } from 'jsr:@core/match';
```

- `$` is a function for creating structured bound patterns.

    ```ts
    const pattern = {
        name: $('name'), // this value will be captured as unknown value
        address: {
            country: $('country'), // you can write the placeholder anywhere,.
            state: 'NY', // without place holder, matcher will compares the values using ===
        },
        age: $('age', isNumber), // you can specify the type of placeholder with the type guard,
        favorites: ['baseball', $('favorite')], // you can put the placeholder in an array
        others: [$(1), $(Symbol.other)], // you can declare the placeholder with number or symbol
    }
    ```

- `match` is a function for performing structured binding. If you execute a structured binding based on the above pattern,
  the value corresponding to the following `Result` type is:
  - an object whose key is the name declared as placeholder, and
  - the placeholder given the type guard will be of that type, and
  - if the structure does not match or the type guard fails, `undefined` is returned.

  ```ts
  type Result = {
    [1]: unknown,
    [Symbol.other]: unknown
    name: unknown,
    country: unknown,
    age: number,
    favorite: unknown
  } | undefined;.
  const result: Result = match(pattern, value);
  ```

## How to declare type guards.

In TypeScript, a type guard is a function with type `(v: unknown) => v is T`,
It can be declared as follows. There is also a collection of generic type guards, such as unknownutils.

```ts
function isNumber(v: unknown): v is number {
    return typeof v === "number";
}
```

## License.

This library is licensed under the MIT License.
Please feel free to use it as long as you comply with the licence.
