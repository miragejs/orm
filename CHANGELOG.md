# miragejs-orm

## 1.1.0

### Minor Changes

- [#68](https://github.com/miragejs/orm/pull/68) [`cb0ef7a`](https://github.com/miragejs/orm/commit/cb0ef7ac35eaefdd2474ca49379968833f6173dc) Thanks [@iamkyrylo](https://github.com/iamkyrylo)! - Simplify derived factory attributes by typing the attribute function `this` context as resolved values. Reading another attribute inside a factory function (e.g. `this.name`) now returns its already-resolved value directly, so the `resolveFactoryAttr` helper and the `FactoryAttrFunc` type are no longer needed and have been removed.

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

- [#66](https://github.com/miragejs/orm/pull/66) [`f5bcd23`](https://github.com/miragejs/orm/commit/f5bcd23e7fa82a9893099ddb5cdb712f38486462) Thanks [@iamkyrylo](https://github.com/iamkyrylo)! - Add `schema.emptyData()` convenience method that wraps `schema.db.emptyData()`, so all collection data can be cleared directly from the schema instance.

## 1.0.0

### Major Changes

- [#23](https://github.com/miragejs/orm/pull/23) [`b49251a`](https://github.com/miragejs/orm/commit/b49251a8a7f66eacb3b3307f8ff89fd6829e20a8) Thanks [@iamkyrylo](https://github.com/iamkyrylo)! - Initial 1.0.0 prerelease

## 1.0.0-next.0

### Major Changes

- [#23](https://github.com/miragejs/orm/pull/23) [`b49251a`](https://github.com/miragejs/orm/commit/b49251a8a7f66eacb3b3307f8ff89fd6829e20a8) Thanks [@iamkyrylo](https://github.com/iamkyrylo)! - Initial 1.0.0 prerelease
