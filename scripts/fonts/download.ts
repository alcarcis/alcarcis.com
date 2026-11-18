export type FetchLike = (
  url: string,
  init: { signal: AbortSignal },
) => Promise<Pick<Response, "ok" | "status" | "statusText" | "arrayBuffer">>;

export type Download = (url: string) => Promise<Uint8Array>;

const TIMEOUT_MS = 60_000;

export class HttpStatusError extends Error {
  override name = "HttpStatusError";
  readonly status: number;

  constructor(status: number, statusText: string) {
    super(`HTTP ${status} ${statusText}`.trim());
    this.status = status;
  }
}

function describeNetworkError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  return error.cause instanceof Error
    ? `${error.message}: ${error.cause.message}`
    : error.message;
}

/** Downloads a URL into memory; rejects with the HTTP status or the network cause. */
export function createDownloader(fetchImpl: FetchLike = fetch): Download {
  return async (url) => {
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await fetchImpl(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new Error(describeNetworkError(error), { cause: error });
    }
    if (!response.ok) {
      throw new HttpStatusError(response.status, response.statusText);
    }
    return new Uint8Array(await response.arrayBuffer());
  };
}
