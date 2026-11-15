export function pageTitle(title: string, siteTitle: string): string {
  return title === siteTitle ? title : `${title} | ${siteTitle}`;
}
