import * as examples from "./examples";
export default function ExampleIsland({ name }: { name: string }) {
  const Example = examples[`${name}Example` as keyof typeof examples];
  return Example ? <Example /> : null;
}
