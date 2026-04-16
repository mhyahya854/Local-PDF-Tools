export function parsePageRanges(input: string, maxPage?: number): number[] {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Page range cannot be empty.");
  }

  const tokens = trimmed
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new Error("No page ranges were provided.");
  }

  const pages = new Set<number>();

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const page = Number(token);
      assertValidPage(page, maxPage);
      pages.add(page);
      continue;
    }

    if (/^\d+-\d+$/.test(token)) {
      const [startRaw, endRaw] = token.split("-");
      const start = Number(startRaw);
      const end = Number(endRaw);

      if (start > end) {
        throw new Error(`Invalid range "${token}": start page cannot be greater than end page.`);
      }

      assertValidPage(start, maxPage);
      assertValidPage(end, maxPage);

      for (let page = start; page <= end; page += 1) {
        pages.add(page);
      }
      continue;
    }

    throw new Error(`Invalid token "${token}". Use values like 1,3,5-8.`);
  }

  return [...pages].sort((a, b) => a - b);
}

export function normalizePageRanges(input: string, maxPage?: number): string {
  const pages = parsePageRanges(input, maxPage);
  if (pages.length === 0) {
    return "";
  }

  const chunks: string[] = [];
  let start = pages[0];
  let prev = pages[0];

  for (let i = 1; i < pages.length; i += 1) {
    const current = pages[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }

    chunks.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = current;
    prev = current;
  }

  chunks.push(start === prev ? `${start}` : `${start}-${prev}`);
  return chunks.join(",");
}

export function isValidPageRanges(input: string, maxPage?: number): boolean {
  try {
    parsePageRanges(input, maxPage);
    return true;
  } catch {
    return false;
  }
}

function assertValidPage(page: number, maxPage?: number) {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error(`Invalid page number "${page}".`);
  }

  if (typeof maxPage === "number" && page > maxPage) {
    throw new Error(`Page ${page} exceeds the document page count (${maxPage}).`);
  }
}
