// "page" only on an exact match; "true" for a page inside the section.
export function navState(path: string, href: string): "page" | "true" | undefined {
  if (path === href) return "page";
  return href !== "/" && path.startsWith(href) ? "true" : undefined;
}
