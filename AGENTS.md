# Working on Klein

Read README.md, docs/DECISIONS.md and the applicable entry in packages/contracts/catalogue.source.json before editing components. PLAN.md describes the staged extraction, not a list of components already shipped.

- This repository is the canonical implementation boundary. Native HTML and approved vendor primitives belong here; consumers use public exports.
- Reuse the existing component before creating a new one. Update the canonical API and its usage contract, not an alternative implementation.
- Keep data fetching, persistence, Next/Apollo/Prisma imports and business calculations out of packages/react. No app aliases. Only presentation state belongs here.
- Use token names from source.json. A new visual value requires a documented foundation/product-extension decision. No arbitrary public style/className/vendor-options props.
- Add public Props types with JSDoc, a catalogue entry, a typed executable example, relevant behaviour/type tests and state stories together. Update index.ts deliberately.
- Use native semantics and names. Buttons default to type=button. Composed selection uses value/onValueChange. Native Input uses value/onChange(event). No synonyms.
- Read docs/CONSUMER_AGENTS.md when changing enforcement. Do not weaken it to make a test pass. Document checker limitations honestly.
- Generate tokens/contracts, run npm run check, npm run build:docs and affected browser tests. Run smoke:pack when changing exports/build/client boundaries.
- Generated files are checked in; dist/build/node_modules are not. Keep package versions aligned. Do not publish or configure a remote without a requested destination.
