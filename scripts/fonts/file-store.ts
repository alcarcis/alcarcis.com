import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import type { FontStore } from "./ensure-fonts.ts";

export interface FileSystem {
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  rm(path: string, options: { force: boolean }): Promise<void>;
  mkdir(path: string, options: { recursive: true }): Promise<unknown>;
}

export const nodeFileSystem: FileSystem = {
  readFile,
  writeFile,
  rename,
  rm,
  mkdir,
};

const isMissingFile = (error: unknown): boolean =>
  error instanceof Error && "code" in error && error.code === "ENOENT";

/** Stores files under `root`; writes go to a temporary sibling first and are renamed into place. */
export function createFileStore(
  root: string,
  fileSystem: FileSystem = nodeFileSystem,
): FontStore {
  return {
    async read(target) {
      try {
        return await fileSystem.readFile(resolve(root, target));
      } catch (error) {
        if (isMissingFile(error)) return undefined;
        throw error;
      }
    },

    async writeAtomically(target, data) {
      const path = resolve(root, target);
      const temporary = join(
        dirname(path),
        `.${basename(path)}.${randomBytes(6).toString("hex")}.tmp`,
      );
      await fileSystem.mkdir(dirname(path), { recursive: true });
      try {
        await fileSystem.writeFile(temporary, data);
        await fileSystem.rename(temporary, path);
      } catch (error) {
        await fileSystem.rm(temporary, { force: true });
        throw error;
      }
    },
  };
}
