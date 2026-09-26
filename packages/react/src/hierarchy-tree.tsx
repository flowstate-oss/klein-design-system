import type { ReactNode } from "react";
import {
  HierarchyFrame,
  HierarchyLevel,
  HierarchyNode,
  HierarchyAddAction,
} from "./patterns/Hierarchy.js";
export interface HierarchyTreeNode {
  /** Stable node identity. */
  id: string;
  /** Display-ready card or canonical organism, with its own actions. */
  content: ReactNode;
  /** Already ordered and filtered children. Omit collapsed branches in the data model. */
  children?: readonly HierarchyTreeNode[];
}
export interface HierarchyTreeProps {
  /** Optional application-authorized action at the foot of the diagram. */
  addAction?: { label: string; onSelect: () => void };
  /** Accessible name of the hierarchy region. */
  label: string;
  /** Prepared roots. Cycle detection, permissions and business ordering belong to the application. */
  nodes: readonly HierarchyTreeNode[];
  /** Apply the standalone diagram gutter; omit inside PanZoomCanvas. */
  padded?: boolean;
}
function Branch({ nodes }: { nodes: readonly HierarchyTreeNode[] }) {
  return (
    <HierarchyLevel>
      {nodes.map((node) => (
        <HierarchyNode key={node.id}>
          {node.content}
          {!!node.children?.length && <Branch nodes={node.children} />}
        </HierarchyNode>
      ))}
    </HierarchyLevel>
  );
}
/** Content-driven hierarchy with shared hairline connectors. Compose with PanZoomCanvas for large diagrams. */
export function HierarchyTree({
  label,
  nodes,
  padded = false,
  addAction,
}: HierarchyTreeProps) {
  return (
    <HierarchyFrame role="region" aria-label={label} padded={padded}>
      <Branch nodes={nodes} />
      {addAction && (
        <HierarchyAddAction
          label={addAction.label}
          onClick={addAction.onSelect}
        />
      )}
    </HierarchyFrame>
  );
}
