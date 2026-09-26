import * as components from "./components.recipes";
import * as organisms from "./migrated.recipes";
const recipes: Record<string, () => React.ReactNode> = {
  actions: components.Actions,
  fields: components.Fields,
  "local-panels": components.LocalPanels,
  "list-page": components.ListPage,
  "edge-to-edge": components.EdgeToEdge,
  table: organisms.Table,
  "forecast-table": organisms.ForecastTable,
  "eddy-rail": organisms.EddyRail,
};
export const recipeNames = Object.keys(recipes);
export default function RecipeIsland({ name }: { name: string }) {
  const Recipe = recipes[name];
  return <Recipe />;
}
