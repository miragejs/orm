/**
 * Extracts the userId from MSW cookies, with a workaround for happy-dom.
 *
 * In development/production, uses the parsed cookies object directly.
 * In test environment (happy-dom), concurrent fetch requests with `credentials: 'include'`
 * cause the Cookie header to accumulate duplicate values (e.g., "userId=1, userId=1").
 * Falls back to parsing the raw cookie header to extract the correct value.
 *
 * @param cookies - The MSW parsed cookies object
 * @param request - The MSW request object (used for fallback parsing in tests)
 * @returns The extracted userId or undefined if not found
 */
export function parseCookieUserId(
  cookies: Record<string, string>,
  request: Request,
): string | undefined {
  // In test environment, use header parsing workaround for happy-dom bug
  if (process.env.NODE_ENV === 'test') {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return undefined;
    }
    // Extract the first userId value before any comma or semicolon
    const match = cookieHeader.match(/userId=([^,;\s]+)/);
    return match ? match[1] : undefined;
  }

  // In development/production, use MSW's parsed cookies directly
  return cookies.userId;
}
