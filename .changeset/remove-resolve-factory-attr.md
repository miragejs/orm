---
'miragejs-orm': minor
---

Simplify derived factory attributes by typing the attribute function `this` context as resolved values. Reading another attribute inside a factory function (e.g. `this.name`) now returns its already-resolved value directly, so the `resolveFactoryAttr` helper and the `FactoryAttrFunc` type are no longer needed and have been removed.

Migrate by replacing `resolveFactoryAttr(this.name, id)` with `this.name`:

```ts
// Before
email(id) {
  const name = resolveFactoryAttr(this.name, id);
  return `${name}@example.com`;
}

// After
email() {
  const name = this.name;
  return `${name}@example.com`;
}
```
