---
title: "JavaScript Arcana: Part #86464843759093"
date: 2024-02-21
categories: [programming]
---

One of the most common ways to convert a string to a number in JavaScript is to use the unary `+` operator:

```jsx
+"42"
> 42
```

This [coerces](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#number_coercion) a numeric string to a decimal integer or floating-point number, ignoring all leading and trailing whitespace (positive binary and hexadecimal numbers are also supported, when prefixed by `0b` and `0x` respectively):

```jsx
+"0b1111111"
> 255
+"0x1111111"
> 17895697
+"   -6.674e-11 "
> -6.674e-11
```

In fact, `+` is (almost) equivalent to the rarely used `Number(value)` constructor, and it has conversions defined for many classes of values:

```jsx
+false
> 0
+[]
> 0 // Not 1, even though [] is a truthy value
+null
> 0
+undefined
> NaN
```

As you can see, most objects (like `undefined` and `{}`, but not `[]`) are coerced to `NaN`. This is a somewhat counterintuitive byproduct of [how numeric conversions are implemented](https://stackoverflow.com/a/3306465).

There is another way to convert strings to numbers: `parseInt` (or `Number.parseInt`). It’s often preferred (along with `parseFloat`, its floating-point counterpart) because it is more explicit.

`parseInt` is also nice because it allows you to work with more exotic radices:

```jsx
parseInt("30") // Base 10 (decimal)
> 30
parseInt("30", 4) // Base 4
> 12 // 3 * 4 + 0
parseInt("30", 13) // Base 13
> 39 // 3 * 13 + 0
```

If we try to parse `null` or `undefined` using `parseInt`, we get `NaN` in both cases, which seems more reasonable than the behavior of `+`:

```jsx
parseInt(null)
> NaN
parseInt(undefined)
> NaN
```

But if we crank the base up to 36, we see something weird:

```jsx
parseInt(undefined, 36)
> 86464843759093
```

What went wrong?

Nothing! This is simply [string coercion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#string_coercion) in action. `parseInt` first converted `undefined` to `"undefined"` and successfully parsed it as a base-36 (“hexatrigesimal”) integer, using the digits 0–9 plus the letters A–Z.

Likewise, `null` was turned into `"null"` before being converted to a number:

```jsx
+null
> 0
parseInt(null, 36)
> 1112745
```

Not so perfect after all.

In fact, `parseInt` has another quirk where it stops parsing as soon as it reaches the first invalid character of its argument. However, instead of returning `NaN`, it parses the (valid) prefix and returns its value:

```jsx
parseInt("12345thisisnotadecimalinteger")
> 12345
```

This feature makes it straightforward to extract the numeric value of a quantity like `42px` and `100%` (e.g., `"42px"` → `42`) but can be surprising if you’re unfamiliar with it. I’ve never seen either of these behaviors cause real bugs, but they’re worth keeping in mind.

The [MDN docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript) are a fantastic resource for learning about such pitfalls, but realistically you can’t memorize everything. TypeScript can help with type safety; the first case would have thrown a compile-time error because `parseInt` expects a string. For everything else, test and verify.
