import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createFileStore,
  nodeFileSystem,
} from "../../../scripts/fonts/file-store.ts";
import { filesUnder, placeFile, readText, temporaryRoot } from "./support.ts";

const target = "fonts/testface/Testface-Variable.woff2";
const fontBytes = new TextEncoder().encode("Testface variable font bytes");

describe("createFileStore", () => {
  it("reads a missing file as undefined", async (t) => {
    const store = createFileStore(await temporaryRoot(t));

    assert.equal(await store.read(target), undefined);
  });

  it("writes a file into a folder that does not exist yet", async (t) => {
    const root = await temporaryRoot(t);

    await createFileStore(root).writeAtomically(target, fontBytes);

    assert.equal(await readText(root, target), "Testface variable font bytes");
  });

  it("leaves neither the font nor a temporary file when the final rename fails", async (t) => {
    const root = await temporaryRoot(t);
    const store = createFileStore(root, {
      ...nodeFileSystem,
      rename: async () => {
        throw new Error("EPERM: operation not permitted, rename");
      },
    });

    await assert.rejects(store.writeAtomically(target, fontBytes), /EPERM/);
    assert.deepEqual(await filesUnder(root), []);
  });

  it("keeps the previous font intact when replacing it fails", async (t) => {
    const root = await temporaryRoot(t);
    await placeFile(root, target, "previous font bytes");
    const store = createFileStore(root, {
      ...nodeFileSystem,
      rename: async () => {
        throw new Error("EPERM: operation not permitted, rename");
      },
    });

    await assert.rejects(store.writeAtomically(target, fontBytes), /EPERM/);
    assert.equal(await readText(root, target), "previous font bytes");
    assert.deepEqual(await filesUnder(root), [target]);
  });
});
