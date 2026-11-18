import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDownloader,
  HttpStatusError,
  type FetchLike,
} from "../../../scripts/fonts/download.ts";

const url = "https://fonts.example.test/download/testface";

function respondWith(status: number, statusText: string, body = ""): FetchLike {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  });
}

function failWith(error: Error): FetchLike {
  return async () => {
    throw error;
  };
}

describe("createDownloader", () => {
  it("returns the response body", async () => {
    const download = createDownloader(respondWith(200, "OK", "archive bytes"));

    const body = await download(url);

    assert.equal(new TextDecoder().decode(body), "archive bytes");
  });

  it("rejects with the HTTP status of a failed response", async () => {
    const download = createDownloader(respondWith(503, "Service Unavailable"));

    await assert.rejects(download(url), (error: unknown) => {
      assert.ok(error instanceof HttpStatusError);
      assert.equal(error.status, 503);
      assert.equal(error.message, "HTTP 503 Service Unavailable");
      return true;
    });
  });

  it("names the status alone when the server sends no reason phrase", async () => {
    const download = createDownloader(respondWith(404, ""));

    await assert.rejects(download(url), { message: "HTTP 404" });
  });

  it("rejects with the cause of a network error", async () => {
    const lookupFailure = Object.assign(
      new Error("getaddrinfo ENOTFOUND fonts.example.test"),
      { code: "ENOTFOUND" },
    );
    const download = createDownloader(
      failWith(new TypeError("fetch failed", { cause: lookupFailure })),
    );

    await assert.rejects(download(url), {
      message: "fetch failed: getaddrinfo ENOTFOUND fonts.example.test",
    });
  });
});
