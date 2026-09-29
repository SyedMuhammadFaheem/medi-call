# Contributing to medi-call

Thanks for helping! This project is intentionally small, so please read the scope rules first.

## Scope

medi-call is a phone-call medication reminder for **one person**. Before proposing a feature, check it against
the README's out-of-scope list. In particular, these will not be accepted:

- anything that infers, adjusts, or suggests medication or dosage;
- LLM- or chatbot-generated narration;
- multi-user/patient support, accounts, analytics, or SMS/WhatsApp/push channels.

Bug fixes, tests, docs, security hardening, and improvements within the current scope are very welcome. If in
doubt, open an issue to discuss before writing code.

## Development setup

Requires Node.js ≥ 22.18.

```bash
git clone https://github.com/SyedMuhammadFaheem/medi-call.git
cd medi-call
npm ci
cp .env.example .env
npm run dev
```

## Before opening a pull request

```bash
npm run typecheck
npm test
```

- Add or update tests for behaviour changes; tests must not make real network calls or place real calls.
- Keep changes small and focused; match the surrounding style. Relative imports use explicit `.ts` extensions.
- Avoid new dependencies unless clearly justified (the project has five runtime dependencies).
- Never commit secrets, `.env`, or database files.
- Update the README/CHANGELOG when behaviour or configuration changes.

## Reporting bugs and security issues

Use the issue templates for bugs and feature requests. For vulnerabilities, follow [SECURITY.md](SECURITY.md)
instead of opening a public issue.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
