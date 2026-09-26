import { tokens } from "@klein-ui/tokens";
export default { title: "Foundations" };
export const ColourAndGeometry = () => (
  <main className="docs-catalogue">
    <div className="docs-eyebrow">Foundations</div>
    <h1>Exact by design.</h1>
    <p>
      Klein 600 is the accent. White is the page ground. Geist is the interface;
      Geist Mono carries measured values. Radius is zero; rules are one pixel.
    </p>
    <div className="docs-swatches">
      {[
        "klein-600",
        "paper",
        "band",
        "tint",
        "border",
        "ink",
        "body",
        "good",
        "watch",
        "bad",
      ].map((name) => (
        <div key={name}>
          <div
            className="docs-swatch"
            style={{ background: `var(--k-${name})` }}
          />
          <strong>{name}</strong>
          <code>{tokens[name as keyof typeof tokens]}</code>
        </div>
      ))}
    </div>
    <h2>Spacing</h2>
    <p>
      2 / 4 / 5 / 7 / 10 / 12 / 16 / 20 / 22 / 24 / 26 / 28 / 34 / 48 / 56 /
      72px
    </p>
    <h2>Colour follows consequence</h2>
    <p>
      Callers choose semantic meaning. A negative cost variance is not
      automatically bad. Muted text is reserved for inactive controls;
      supporting copy uses body tone for contrast.
    </p>
    <h2>Product extensions</h2>
    <p>
      Full-width pages use 24px outer gutters; view shells own 16px internals.
      Route and local tabs are distinct. Dark mode and additional glyphs require
      an explicit extension; this release is light-only.
    </p>
  </main>
);
