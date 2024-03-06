# TS Match

\[ [GitHub tani/ts-match](https://github.com/tani/ts-match) \] \[
[JSR @core/match](https://jsr.io/@core/match) \]

A pattern matching library for JavaScript/ TypeScript

EcmaScript has a structured binding. It is a very useful notation for extracting
only the necessary parts from a complex structure. However, this structured
binding is incomplete for use as pattern matching. Because, To do a structured
binding, the pre-assigned value must match the pattern, If it does not match the
pattern, an exception is thrown.

```ts
const { a } = JSON.parse("{}"); // ERROR!
```

Therefore, to do structured binding, TypeScript either guarantees that the
structure matches at compile time, or it does not, validation libraries such as
zod or unknownutil checks at runtime that the structure matches. The former is
impotent for data whose structure is not determined at compile time, such as
JSON data. The latter required writing two structured binding patterns and two
validation patterns.

This library can perform structured binding and validation simultaneously, while
preserving compile-time type information, It is a library that enables true
pattern matching and brings EcmaScript's structured binding to perfection.

Again, this is not just for TypeScript, it is also useful in JavaScript.

## Usage

This library is published in JSR and can be used in Deno with `jsr:@core/match`.
There are only two functions that users need to remember: `_` and `match`.

```ts
import { match, placeholder as _ } from "jsr:@core/match";
```

- `_` is a function for creating structured bound patterns. If you already use
  `_` for other library, you can use other name like `__`.

  ```ts
  const pattern = {
    name: _("name"), // this value will be captured as unknown value
    address: {
      country: _("country"), // you can write the placeholder anywhere,.
      state: "NY", // without place holder, matcher will compares the values using ===
    },
    age: _("age", isNumber), // you can specify the type of placeholder with the type guard,
    favorites: ["baseball", _("favorite")], // you can put the placeholder in an array
    others: [_(1), _(Symbol.other)], // you can declare the placeholder with number or symbol
  };
  ```

- `match` is a function for performing structured binding. If you execute a
  structured binding based on the above pattern, the value corresponding to the
  following `Result` type is:
  - an object whose key is the name declared as placeholder, and
  - the placeholder given the type guard will be of that type, and
  - if the structure does not match or the type guard fails, `undefined` is
    returned.

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

In TypeScript, a type guard is a function with type `(v: unknown) => v is T`, It
can be declared as follows. There is also a collection of generic type guards,
such as unknownutil.

```ts
function isNumber(v: unknown): v is number {
  return typeof v === "number";
}
```

## License.

This library is licensed under the MIT License. Please feel free to use it as
long as you comply with the licence.

---

## Scenarios for using this library

First, load the library.

```ts
import { match, placeholder as _ } from "./mod.ts";
import { assertEquals } from "jsr:@std/assert";
```

This library can be used to check if an object matches a specific pattern. The
following example demonstrates how to match an object with a simple string
value. If the object matches the pattern, the result will be an empty object,
since the pattern does not contain any placeholders yet.

```ts
Deno.test("match object with primitive string value", () => {
  const pattern = "hello";
  const value = "hello";
  const result = match(pattern, value);
  assertEquals(result, {});
});
```

You can also use numeric values as patterns.

```ts
Deno.test("match object with primitive number value", () => {
  const pattern = 123;
  const value = 123;
  const result = match(pattern, value);
  assertEquals(result, {});
});
```

Boolean values also can be used as patterns.

```ts
Deno.test("match object with primitive boolean value", () => {
  const pattern = true;
  const value = true;
  const result = match(pattern, value);
  assertEquals(result, {});
});
```

Null values can be used as patterns as well. Note that the match function
returns an empty object even if both the pattern and the value are null.

```ts
Deno.test("match object with primitive null value", () => {
  const pattern = null;
  const value = null;
  const result = match(pattern, value);
  assertEquals(result, {});
});
```

Undefined values can also be used as patterns. Note that the match function
returns an empty object even if both the pattern and the value are undefined.

```ts
Deno.test("match object with primitive undefined value", () => {
  const pattern = undefined;
  const value = undefined;
  const result = match(pattern, value);
  assertEquals(result, {});
});
```

Symbol values can be used as patterns as well.

```ts
Deno.test("match object with primitive symbol value", () => {
  const symbol = Symbol("hello");
  const pattern = symbol;
  const value = symbol;
  const result = match(pattern, value);
  assertEquals(result, {});
});
```

You can also use compound objects as patterns. If the object matches the
pattern, the result will still be an empty object, because there are no
placeholders in the pattern.

```ts
Deno.test("match object with compound object value", () => {
  const pattern = { name: "hello", age: 1 };
  const value = { name: "hello", age: 1 };
  const result = match(pattern, value);
  assertEquals(result, {});
});
```

Arrays can be used as patterns too. If the object matches the pattern, the
result will still be an empty object, because there are no placeholders in the
pattern.

```ts
Deno.test("match object with array value", () => {
  const pattern = ["hello", 123];
  const value = ["hello", 123];
  const result = match(pattern, value);
  assertEquals(result, {});
});
```

If the object does not match the pattern, the match function returns undefined.
In the following pattern, the value of the object does not match the pattern
because the value is not object.

```ts
Deno.test("match object with primitive value (not equal)", () => {
  const pattern = { a: 1 };
  const value = 123;
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

Now, let's use a placeholder. The first step is to declare a single placeholder.
The placeholder is declared using the `_` function, and the name of the
placeholder is passed as an argument. The placeholder holds the name's string
value and the type guard function `test`. The following placeholder does not
have a type guard, making it the simplest form of a placeholder.

```ts
Deno.test("declare single placeholder", () => {
  const pattern = _("a");
  assertEquals(pattern.name, "a");
  assertEquals(pattern.test, undefined);
});
```

To use the placeholder, apply the match function. The match function returns an
object containing the key-value pair of the placeholder's name and the
associated object's value. If the object does not match the pattern, the match
function returns undefined. Note that the resulting object has an `a` key, the
value of the object is `hello`, and its type is `unknown` in TypeScript because
the placeholder has no type guard.

```ts
Deno.test("match object with single placeholder", () => {
  const pattern = _("a");
  const value = "hello";
  const result = match(pattern, value);
  assertEquals(result, { a: "hello" });
});
```

To provide a type guard for the placeholder, declare the type guard function as
the second argument of the `_` function.

```ts
Deno.test("match object with single placeholder and type guard", () => {
  const pattern = _("a", (v: unknown): v is string => typeof v === "string");
  const value = "hello";
  const result = match(pattern, value);
  assertEquals(result, { a: "hello" });
});
```

If the type guard fails, the match function returns undefined.

```ts
Deno.test("match object with single placeholder and type guard", () => {
  const pattern = _("a", (v: unknown): v is string => typeof v === "string");
  const value = 123;
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

Placeholders can also be used in compound objects. The following pattern has two
placeholders, `a` and `b`. Note that the resulting object has `a` and `b` keys,
and the values of the object are `hello` and `123` respectively. Furthermore,
the type of the `a` value is `unknown`, and the type of the `b` value is
`unknown` in TypeScript.

```ts
Deno.test("match object with compound object and placeholders", () => {
  const pattern = { name: _("a"), age: _("b") };
  const value = { name: "hello", age: 1 };
  const result = match(pattern, value);
  assertEquals(result, { a: "hello", b: 1 });
});
```

Similarly, you can pass the type guard to the placeholder. In this case, the
type of the `a` value is `string`, while the type of the `b` value is `number`
in TypeScript.

```ts
Deno.test("match object with compound object and placeholders (type guard)", () => {
  const pattern = {
    name: _("a", (v: unknown): v is string => typeof v === "string"),
    age: _("b", (v: unknown): v is number => typeof v === "number"),
  };
  const value = { name: "hello", age: 1 };
  const result = match(pattern, value);
  assertEquals(result, { a: "hello", b: 1 });
});
```

It is expected that the match function returns undefined if the object does not
match the pattern. In the following pattern, there are two placeholders, `a` and
`b`. The value of the object does not match the pattern because the `name` key
is missing. Therefore, the match function returns undefined.

```ts
Deno.test("match object with compound object and placeholders (missing key)", () => {
  const pattern = { name: _("a"), age: _("b") };
  const value = { age: 1 };
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

You can also use the placeholder to skip the key. The following pattern has two
placeholders, anonymous placeholder and `b`. Note that the resulting object has
only `b` key, and the value of the object is `1`. Furthermore, the type of the
`b` value is `unknown` in TypeScript because the placeholder has no type guard.

```ts
Deno.test("match object with compound object and placeholders (skip key)", () => {
  const pattern = { name: _(), age: _("b") };
  const value = { name: "john", age: 1 };
  const result = match(pattern, value);
  assertEquals(result, { b: 1 });
});
```

As the same as other cases, the anonymous placeholder can be used with the type
guard. The following pattern has two placeholders, anonymous placeholder and
`b`. Note that the resulting object has only `b` key, and the value of the
object is `1`. Furthermore, the type of the `b` value is `unknown` in TypeScript
because the placeholder has no type guard.

```ts
Deno.test("match object with compound object and placeholders (skip key, type guard)", () => {
  const pattern = {
    name: _((v: unknown): v is string => typeof v === "string"),
    age: _("b"),
  };
  const value = { name: "john", age: 1 };
  const result = match(pattern, value);
  assertEquals(result, { b: 1 });
});
```

The match function returns undefined if the object does not match the pattern.
The following pattern has two placeholders, anonymous placeholder and `b`. The
value of the object does not match the pattern because the type guard fails.
Therefore, the match function returns undefined.

```ts
Deno.test("match object with compound object and placeholders (skip key, type guard, fail)", () => {
  const pattern = {
    name: _((v: unknown): v is string => typeof v === "string"),
    age: _("b"),
  };
  const value = { name: 1, age: 1 };
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

In other cases, the match function returns undefined if the type guard fails.
The following pattern has two placeholders, `a` and `b`. The value of the object
does not match the pattern because the `age` value is not a number. Therefore,
the match function returns undefined.

```ts
Deno.test("match object with compound object and placeholders (type guard fail)", () => {
  const pattern = {
    name: _("a", (v: unknown): v is string => typeof v === "string"),
    age: _("b", (v: unknown): v is number => typeof v === "number"),
  };
  const value = { name: "hello", age: "123" };
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

Placeholders can be used in arrays as well. The following pattern has two
placeholders, `a` and `b`. Note that the resulting object has `a` and `b` keys,
and the values of the object are `hello` and `123` respectively. Furthermore,
the type of the `a` value is `unknown`, and the type of the `b` value is
`unknown` in TypeScript.

```ts
Deno.test("match object with array and placeholders", () => {
  const pattern = [_("a"), _("b")];
  const value = ["hello", 123];
  const result = match(pattern, value);
  assertEquals(result, { a: "hello", b: 123 });
});
```

You can pass the type guard to the placeholder in the same way as before, so the
type of the `a` value is `string`, and the type of the `b` value is `number` in
TypeScript.

```ts
Deno.test("match object with array and placeholders (type guard)", () => {
  const pattern = [
    _("a", (v: unknown): v is string => typeof v === "string"),
    _("b", (v: unknown): v is number => typeof v === "number"),
  ];
  const value = ["hello", 123];
  const result = match(pattern, value);
  assertEquals(result, { a: "hello", b: 123 });
});
```

It is expected that the match function returns undefined if the object does not
match the pattern. The following pattern has two placeholders, `a` and `b`. The
value of the object does not match the pattern because the `name` key is
missing.

```ts
Deno.test("match object with array and placeholders (missing key)", () => {
  const pattern = [_("a"), _("b")];
  const value = [123];
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

In other cases, the match function returns undefined if the type guard fails.
The following pattern has two placeholders, `a` and `b`. The value of the object
does not match the pattern because the `age` value is not a number.

```ts
Deno.test("match object with array and placeholders (type guard fail)", () => {
  const pattern = [
    _("a", (v: unknown): v is string => typeof v === "string"),
    _("b", (v: unknown): v is number => typeof v === "number"),
  ];
  const value = ["hello", "123"];
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

Placeholders can be used in both objects and arrays at the same time. The
following pattern has two placeholders, `a` and `b`. Note that the resulting
object has `a` and `b` keys, and the values of the object are `hello` and `123`
respectively. Furthermore, the type of the `a` value is `unknown`, and the type
of the `b` value is `unknown` in TypeScript.

```ts
Deno.test("match object with object, array, and placeholders", () => {
  const pattern = { name: _("a"), age: [_("b")] };
  const value = { name: "hello", age: [123] };
  const result = match(pattern, value);
  assertEquals(result, { a: "hello", b: 123 });
});
```

In the same manner, you can pass the type guard to the placeholder. Now, the
type of the `a` value is `string`, and the type of the `b` value is `number` in
TypeScript.

```ts
Deno.test("match object with object, array, and placeholders (type guard)", () => {
  const pattern = {
    name: _("a", (v: unknown): v is string => typeof v === "string"),
    age: [_("b", (v: unknown): v is number => typeof v === "number")],
  };
  const value = { name: "hello", age: [123] };
  const result = match(pattern, value);
  assertEquals(result, { a: "hello", b: 123 });
});
```

It is expected that the match function will return undefined if the object does
not match the pattern. In the following pattern, there are two placeholders, `a`
and `b`. The value of the object does not match the pattern because the `name`
key is missing.

```ts
Deno.test("match object with object, array, and placeholders (missing key)", () => {
  const pattern = { name: _("a"), age: [_("b")] };
  const value = { age: [123] };
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

In other cases, the match function returns undefined if the type guard fails.
The following pattern has two placeholders, `a` and `b`. The value of the object
does not match the pattern because the `age` value is not a number.

```ts
Deno.test("match object with object, array, and placeholders (type guard fail)", () => {
  const pattern = {
    name: _("a", (v: unknown): v is string => typeof v === "string"),
    age: [_("b", (v: unknown): v is number => typeof v === "number")],
  };
  const value = { name: "hello", age: ["123"] };
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

As a niche feature, pattern matching with placeholders can be used with
user-defined classes. Note that the resulting object has `name` and `age` keys,
and the values of the object are `hello` and `123` respectively. Furthermore,
the type of the `name` value is `unknown`, and the type of the `age` value is
`number` in TypeScript because the placeholder has no type guard for the `name`
value.

```ts
class User {
  name: string;
  age: number;
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}
Deno.test("match object with user-defined class and placeholders", () => {
  const pattern = {
    name: _("name"),
    age: _("age", (v: unknown): v is number => typeof v === "number"),
  };
  const value = new User("hello", 123);
  const result = match(pattern, value);
  assertEquals(result, { name: "hello", age: 123 });
});
```

In the same manner, you can pass the type guard to the placeholder. Now, the
type of the `name` value is `string`, and the type of the `age` value is
`number` in TypeScript.

```ts
Deno.test("match object with user-defined class and placeholders (type guard)", () => {
  const pattern = {
    name: _("name", (v: unknown): v is string => typeof v === "string"),
    age: _("age", (v: unknown): v is number => typeof v === "number"),
  };
  const value = new User("hello", 123);
  const result = match(pattern, value);
  assertEquals(result, { name: "hello", age: 123 });
});
```

It is expected that the match function will return undefined if the object does
not match the pattern. In the following pattern, there are two placeholders,
`name` and `age`. The value of the object does not match the pattern because the
`name` key is missing.

```ts
Deno.test("match object with user-defined class and placeholders (missing key)", () => {
  const pattern = { name: _("name"), age: _("age") };
  const value = new User("hello", 123);
  const result = match(pattern, value);
  assertEquals(result, { name: "hello", age: 123 });
});
```

Additionally, if the pattern is not a direct instance of an `Object` or an
`Array`, the match function tries to check the equality of the pattern and the
value using the `===` operator. Hence, the following pattern does not match the
value, and the match function returns undefined.

```ts
Deno.test("match object with primitive string value (not equal)", () => {
  const pattern = new User("hello", 123);
  const value = new User("hello", 123);
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

The match function also supports template string placeholders. The following
pattern has a template string placeholder, `name`. Note that the resulting
object has a `name` key, and the value of the object is `world`. The type of the
`name` value is `unknown` in TypeScript because the placeholder has no type
guard.

```ts
Deno.test("match object with template string placeholder", () => {
  const pattern = _`hello ${_("name")}`;
  const value = "hello world";
  const result = match(pattern, value);
  assertEquals(result, { name: "world" });
});
```

You can also pass the type guard to the placeholder in the same way as before.
Now, the type of the `name` value is `string` in TypeScript.

```ts
Deno.test("match object with template string placeholder (type guard)", () => {
  const pattern = _`hello ${
    _("name", (v: unknown): v is string => typeof v === "string")
  }`;
  const value = "hello world";
  const result = match(pattern, value);
  assertEquals(result, { name: "world" });
});
```

The match function returns undefined if the object does not match the pattern.
The following pattern has a template string placeholder, `answer`. The value of
the object does not match the pattern because the value is not a number.

```ts
Deno.test("match object with template string placeholder (type guard, fail)", () => {
  const pattern = _`1 + 1 = ${
    _(
      "answer",
      (
        v: unknown,
      ): v is `${number}` => (typeof v === "string" && !isNaN(Number(v))),
    )
  }`;
  const value = "1 + 1 = infinity";
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

The positive case of the type guard is also tested. The following pattern has a
template string placeholder, `answer`. The value of the object matches the
pattern, and the match function returns an object containing the key-value pair
of the placeholder's name and the associated object's value. Note that the
resulting object has an `answer` key, and the value of the object is `2`. The
type of the `answer` value is `'${numver}'`, which is a string shape of a number
in TypeScript.

```ts
Deno.test("match object with template string placeholder (type guard)", () => {
  const pattern = _`1 + 1 = ${
    _(
      "answer",
      (
        v: unknown,
      ): v is `${number}` => (typeof v === "string" && !isNaN(Number(v))),
    )
  }`;
  const value = "1 + 1 = 2";
  const result = match(pattern, value);
  assertEquals(result, { answer: "2" });
});
```

It is expected that the match function will return undefined if the object does
not match the pattern. In the following pattern, there is a template string
placeholder, `name`. The value of the object does not match the pattern because
the length of the value is not equal to the length of the pattern.

```ts
Deno.test("match object with template string placeholder (length not match)", () => {
  const pattern = _`hello ${_("name")}`;
  const value = "hello";
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

In other cases, the match function returns undefined. The following pattern has
a template string placeholder, `name`. The value of the object does not match
the pattern because the value is not a string.

```ts
Deno.test("match object with template string placeholder (not string)", () => {
  const pattern = _`hello ${_("name")}`;
  const value = 123;
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

The match function also supports template string placeholders with multiple
placeholders. The following pattern has two template string placeholders, `name`
and `age`. Note that the resulting object has `name` and `age` keys, and the
values of the object are `world` and `123` respectively. The type of the `name`
value is `unknown`, and the type of the `age` value is `unknown` in TypeScript
because the placeholders have no type guards.

```ts
Deno.test("match object with template string placeholder with multiple placeholders", () => {
  const pattern = _`${_("name")} is ${_("age")} years old`;
  const value = "world is 123 years old";
  const result = match(pattern, value);
  assertEquals(result, { name: "world", age: "123" });
});
```

Match funciton returns undefined if the object does not match the pattern. The
following pattern has two template string placeholders, `name` and `age`. The
value of the object does not match the pattern because the value is shorter than
the pattern.

```ts
Deno.test("match object with template string placeholder with multiple placeholders (not equal)", () => {
  const pattern = _`${_("name")} is ${_("age")} years old`;
  const value = "world is 123 years";
  const result = match(pattern, value);
  assertEquals(result, undefined);
});
```

The match function also supports template string placeholders with greedy mode.
The following pattern has two template string placeholders, `name` and `age`.
Note that the resulting object has `name` and `age` keys, and the values of the
object are `world` and `123` respectively. The type of the `name` value is
`unknown`, and the type of the `age` value is `unknown` in TypeScript because
the placeholders have no type guards.

```ts
Deno.test("match object with template string placeholder with multiple placeholders (greedy, not equal)", () => {
  const pattern = _.greedy`${_("name")} is ${_("age")} years old`;
  const value = "world is 123 years old";
  const result = match(pattern, value);
  assertEquals(result, { name: "world", age: "123" });
});
```

Ultimately, the match function could run with a pattern that contains a regular
placeholder and a template string placeholder. The following pattern has a
regular placeholder, `address`, and a template string placeholder, `message`.
Note that the resulting object has `address`, `name`, and `age` keys, and the
values of the object are `123`, `world`, and `123` respectively. The type of the
`address` value is `unknown`, and the type of the `name` and `age` values are
`unknown` in TypeScript because the placeholders have no type guards.

```ts
Deno.test("match object with a regular placeholder with the template string placeholder", () => {
  const pattern = {
    address: _("address"),
    message: _`${_("name")} is ${_("age")} years old`,
  };
  const value = {
    address: "123",
    message: "world is 123 years old",
  };
  const result = match(pattern, value);
  assertEquals(result, { address: "123", name: "world", age: "123" });
});
```
