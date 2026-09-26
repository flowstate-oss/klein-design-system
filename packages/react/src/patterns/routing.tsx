"use client";
import {
  createContext,
  useContext,
  type ComponentType,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";
type LinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>;
const DefaultLink: LinkComponent = (props) => <a {...props} />;
const LinkContext = createContext<LinkComponent>(DefaultLink);
/** Supply client navigation without importing an application router. */
export function PatternLinkProvider({
  link,
  children,
}: {
  link: LinkComponent;
  children: ReactNode;
}) {
  return <LinkContext.Provider value={link}>{children}</LinkContext.Provider>;
}
export function usePatternLink() {
  return useContext(LinkContext);
}
