# Vendored Runtime Dependencies

AskPage loads several third-party browser libraries directly from `lib/`. These files are runtime dependencies even though they do not appear as production dependencies in `package.json`.

Because npm audit does not cover these vendored files, version review must include this inventory.

| Library | Vendored path | Version evidence in repository |
|---|---|---|
| Marked | `lib/marked.min.js` | `marked v15.0.12` header |
| DOMPurify | `lib/purify.min.js` | `DOMPurify 3.0.2` license header |
| Highlight.js | `lib/highlight.min.js` | `Highlight.js v11.11.1` header |
| KaTeX | `lib/katex/` | CSS `.katex-version:after{content:"0.18.1"}` |

## Update procedure

When replacing a vendored library:

1. obtain it from the library's official release/distribution channel;
2. verify the expected license/header and release version;
3. replace the complete related asset set when the library includes companion CSS/fonts;
4. run `npm test` and the extension quality workflow;
5. update this inventory and `tests/vendor-versions.test.js` in the same pull request;
6. manually exercise rendered Markdown/code/math content because syntax-level tests do not prove browser compatibility.

Do not interpret an npm vulnerability report as coverage for these files, and do not interpret this inventory as a vulnerability scan. It is a provenance/version-control mechanism.
