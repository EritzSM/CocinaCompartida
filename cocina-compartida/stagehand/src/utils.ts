export async function waitForURL(
  page: { url: () => string },
  pattern: RegExp,
  timeoutMs = 12000
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pattern.test(page.url())) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timeout: URL "${page.url()}" no coincide con ${pattern}`);
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
