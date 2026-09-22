/**
 * Native Apple token exchange and browser OAuth are separate Clerk strategies.
 * Retry only the native strategy's explicit authorization rejection, never a
 * cancellation, network failure, or session activation failure.
 */
export async function signInWithAppleFallback<T>(
  nativeSignIn: () => Promise<T>,
  browserSignIn: () => Promise<T>,
  onBrowserFallback: () => void,
): Promise<T> {
  try {
    return await nativeSignIn();
  } catch (error) {
    const errors =
      error && typeof error === "object" && "errors" in error
        ? error.errors
        : undefined;
    const nativeStrategyRejected =
      Array.isArray(errors) &&
      errors.some(
        (item: unknown) =>
          item !== null &&
          typeof item === "object" &&
          "code" in item &&
          item.code === "authorization_invalid",
      );
    if (!nativeStrategyRejected) throw error;
    onBrowserFallback();
    return browserSignIn();
  }
}

export function isAuthCancelled(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ERR_REQUEST_CANCELED"
  );
}

export function authErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  if ("errors" in error && Array.isArray(error.errors)) {
    const detail = error.errors[0];
    if (detail && typeof detail === "object") {
      const message = detail.longMessage ?? detail.message;
      if (typeof message === "string") return message;
    }
  }
  return "message" in error && typeof error.message === "string"
    ? error.message
    : fallback;
}