export type SearchParams = Record<string, string | string[] | undefined>;

export function getFirstSearchParam(searchParams: SearchParams | undefined, key: string): string {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
