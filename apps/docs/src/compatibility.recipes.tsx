import { useState } from "react";
import { Field } from "@klein-ui/react";
import entries from "../../../packages/contracts/compatibility.json";
export default { title: "Migration" };
export function CompatibilityReference() {
  const [query, setQuery] = useState("");
  return (
    <main className="docs-catalogue">
      <h1>Compatibility reference</h1>
      <p>
        These are the extracted application APIs. They preserve existing
        callers. For new work use the main catalogue's closed APIs; extend them
        here when something is missing.
      </p>
      <Field
        label="Find a migrated module"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {entries
        .filter((entry) =>
          JSON.stringify(entry).toLowerCase().includes(query.toLowerCase()),
        )
        .map((entry) => (
          <article key={entry.name}>
            <h2>{entry.name}</h2>
            <code>{entry.import}</code>
            <p>{entry.usage}</p>
            <details>
              <summary>Exports and props</summary>
              <pre>
                {[...entry.exports, ...entry.declarations].join("\n\n")}
              </pre>
            </details>
          </article>
        ))}
    </main>
  );
}
