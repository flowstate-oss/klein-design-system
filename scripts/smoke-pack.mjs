import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = path.resolve(import.meta.dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "klein-consumer-"));
const run = (command, args, cwd = temp) =>
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
run("npm", ["run", "build"], root);
const tarballs = [];
for (const name of [
  "tokens",
  "react",
  "contracts",
  "table",
  "charts",
  "forecast",
  "eddy",
]) {
  const output = execFileSync(
    "npm",
    [
      "pack",
      "--workspace",
      `@klein-ui/${name}`,
      "--pack-destination",
      temp,
      "--json",
    ],
    { cwd: root, encoding: "utf8" },
  );
  const packed = JSON.parse(output)[0];
  if (!packed.files.some(file => file.path === 'LICENSE')) throw new Error(`${name}: missing package license`);
  if (!packed.files.some(file => file.path === 'README.md')) throw new Error(`${name}: missing package documentation`);
  tarballs.push(path.join(temp, packed.filename));
}
fs.writeFileSync(
  path.join(temp, "package.json"),
  JSON.stringify({
    name: "klein-consumer-smoke",
    private: true,
    type: "module",
  }),
);
run("npm", [
  "install",
  "--ignore-scripts",
  "--no-audit",
  "--no-fund",
  ...tarballs,
  "react@19.2.8",
  "react-dom@19.2.8",
  "vite@6",
  "next@16.3.0",
  "typescript@5.9.3",
  "@types/react@19.2.17",
  "@types/node@22.20.1",
]);
fs.writeFileSync(
  path.join(temp, "api.tsx"),
  `import {tokens} from '@klein-ui/tokens'; import {ForecastTable} from '@klein-ui/forecast'; import {EddyComposer} from '@klein-ui/eddy'; import {Table} from '@klein-ui/table'; import {Chart} from '@klein-ui/charts'; const accent: string = tokens.klein;
import {Button, type ButtonProps} from '@klein-ui/react'; const props: ButtonProps = {children: 'Save', tone: 'accent'}; const valid = <Button {...props}/>;
// @ts-expect-error Visual overrides are not public API.
const invalid = <Button style={{color:'red'}}>Save</Button>;`,
);
run("npx", [
  "tsc",
  "--noEmit",
  "--strict",
  "--skipLibCheck",
  "--jsx",
  "react-jsx",
  "--moduleResolution",
  "bundler",
  "--module",
  "esnext",
  "--target",
  "es2022",
  "api.tsx",
]);
fs.writeFileSync(
  path.join(temp, "index.html"),
  '<div id="root"></div><script type="module" src="/main.jsx"></script>',
);
fs.writeFileSync(
  path.join(temp, "main.jsx"),
  `import React from 'react'; import {createRoot} from 'react-dom/client'; import {Button,Field} from '@klein-ui/react'; import {Table} from '@klein-ui/table'; import {Chart} from '@klein-ui/charts'; import {ForecastTable} from '@klein-ui/forecast'; import {EddyMessage} from '@klein-ui/eddy'; import '@klein-ui/react/styles.css'; import '@klein-ui/forecast/styles.css'; import '@klein-ui/eddy/styles.css'; createRoot(document.getElementById('root')).render(<><Field label="Budget"/><Button>Save</Button><Table label="People" rows={[{id:'1',name:'Alex'}]} rowKey={row=>row.id} columns={[{id:'name',label:'Name',render:row=>row.name}]}/><Chart label="Capacity" type="bar" labels={['Jan']} series={[{id:'capacity',label:'Capacity',values:[2]}]}/><ForecastTable label="Forecast" periods={[]} rows={[]}/><EddyMessage role="assistant" status="complete" content="Ready" thinkingLabel="Thinking" retryLabel="Retry"/></>);`,
);
run("npx", ["vite", "build"]);
fs.mkdirSync(path.join(temp, "app"));
fs.writeFileSync(
  path.join(temp, "app/layout.jsx"),
  `import '@klein-ui/react/styles.css'; export default function Layout({children}) { return <html lang="en"><body>{children}</body></html>; }`,
);
fs.writeFileSync(
  path.join(temp, "app/page.jsx"),
  `import {Button,Field,PageHeader} from '@klein-ui/react'; export default function Page() { return <><PageHeader title="Budgets"/><Field label="Budget name"/><Button>Save</Button></>; }`,
);
run("npx", ["next", "build", "--webpack"]);
fs.mkdirSync(path.join(temp, "adopted"));
fs.writeFileSync(
  path.join(temp, "adopted/valid.tsx"),
  `import {Button} from '@klein-ui/react'; export const Action=()=> <Button>Save</Button>;`,
);
run("npx", ["klein-check", "adopted"]);
fs.writeFileSync(
  path.join(temp, "adopted/invalid.tsx"),
  `export const Action=()=> <button>Duplicate</button>;`,
);
let rejected = false;
try {
  run("npx", ["klein-check", "adopted"]);
} catch (error) {
  if (error.status === 1) rejected = true;
  else throw error;
}
if (!rejected)
  throw new Error("Packed consumer checker accepted a raw button.");
console.log(
  `Packed Vite/Next consumers and enforcement passed. Evidence: ${temp}`,
);
