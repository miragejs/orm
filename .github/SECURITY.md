# Security Policy

## Supported Versions

Security fixes are applied to the latest `1.x` release line.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Report vulnerabilities privately through GitHub's built-in advisory flow:

1. Go to the [Security tab](https://github.com/miragejs/orm/security) of this repository.
2. Click **"Report a vulnerability"** to open a private advisory ([direct link](https://github.com/miragejs/orm/security/advisories/new)).
3. Include as much detail as you can:
   - affected version(s),
   - a description of the issue and its impact,
   - steps to reproduce or a proof of concept,
   - any suggested fix or mitigation.

We will acknowledge your report within **5 business days** and keep you updated on remediation progress. Once a fix is released, we will publish a security advisory and credit you unless you prefer to remain anonymous.

## Scope

`miragejs-orm` is an in-memory ORM intended for **testing and local development**. It is not designed to run in production or to handle untrusted input as a security boundary. Reports are most relevant when they concern:

- the published npm package contents or build output,
- the library's own runtime behavior (it ships with zero runtime dependencies).

The example application under [`examples/`](../examples) is a demo and is not a published artifact; issues there are handled as regular bugs, not security advisories.
