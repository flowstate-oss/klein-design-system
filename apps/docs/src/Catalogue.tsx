import { useState } from "react";
import { Field } from "@klein-ui/react";
import catalogue from "../../../packages/contracts/components.json";
import references from "../../../packages/contracts/props.json";
import * as examples from "./examples";

/** The human and agent catalogue share the same generated release metadata. */
export function Catalogue() {
  const [query, setQuery] = useState("");
  const selected = catalogue.filter((item) =>
    `${item.name} ${item.layer} ${item.purpose} ${item.aliases.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <main className="docs-catalogue">
      <div className="docs-masthead">
        <span>KLEIN / COMPONENT SYSTEM</span>
        <span>0.1.0 · Experimental</span>
      </div>
      <h1>Build from a shared contract.</h1>
      <p className="docs-intro">
        Finance-grade interfaces. One accent, exact numerics, flat surfaces. Use
        the component and its documented recipe; keep data and decisions in the
        application.
      </p>
      <Field
        label="Find a component"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try header, field or layout"
      />
      <p className="docs-count">
        {selected.length} documented components · Tables, charts, forecast, Eddy
        and edge-to-edge layouts.
      </p>
      <nav className="docs-index" aria-label="Component index">
        {selected.map((item) => (
          <a key={item.name} href={`#${item.name}`}>
            {item.name}
          </a>
        ))}
      </nav>
      {selected.map((item) => {
        const Example =
          examples[`${item.name}Example` as keyof typeof examples];
        const reference = references[item.name as keyof typeof references];
        return (
          <article key={item.name} id={item.name} className="docs-component">
            <div className="docs-eyebrow">
              {item.layer} · {item.status}
            </div>
            <h2>{item.name}</h2>
            <p>{item.purpose}</p>
            <h3>Use it</h3>
            <p>{item.usage}</p>
            <pre>
              <code>{item.import}</code>
            </pre>
            <div className="docs-specimen">
              <Example />
            </div>
            <details>
              <summary>Example source</summary>
              <pre>
                <code>{item.example}</code>
              </pre>
            </details>
            <h3>Behaviour and ownership</h3>
            <p>{item.behavior}</p>
            <h3>Props</h3>
            <p>
              Native controls also accept applicable React HTML and ARIA
              attributes, excluding visual overrides. Read union signatures for
              mode-specific requirements.
            </p>
            <div className="docs-table-scroll">
              <table>
                <caption>{item.name} public props</caption>
                <thead>
                  <tr>
                    <th>Prop</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {reference.props.map((prop) => (
                    <tr key={prop.name}>
                      <th scope="row">{prop.name}</th>
                      <td>
                        <code>{prop.type}</code>
                      </td>
                      <td>{prop.default ?? "—"}</td>
                      <td>
                        {prop.description ||
                          (prop.required
                            ? "Required in the applicable mode."
                            : "Optional in the applicable mode.")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details>
              <summary>Type signature</summary>
              <pre>
                <code>{reference.declaration}</code>
              </pre>
            </details>
            <h3>Avoid</h3>
            <p>{item.avoid}</p>
          </article>
        );
      })}
      {selected.length === 0 && (
        <p role="status">
          No matching component. Check the roadmap before creating a new
          primitive.
        </p>
      )}
    </main>
  );
}
