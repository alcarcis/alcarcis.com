import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beats,
  fixAt,
  runFrameAt,
  sceneEnd,
  type RunFrame,
} from "../../../src/scripts/instrument/timeline.ts";

const specLength = 90;
const leadMs = 300;
/* 90 characters at 3 per 30 ms step: the last step lands at 300 + 29 × 30 ms. */
const lastKeystrokeMs = leadMs + 29 * 30;
const sceneStartMs = lastKeystrokeMs + 250;
const doneMs = sceneStartMs + sceneEnd * 1000 + 450;

const frameAt = (ms: number): RunFrame => runFrameAt(ms, specLength, leadMs);
const atSceneTime = (seconds: number): RunFrame =>
  frameAt(sceneStartMs + seconds * 1000);
const runningStage = (frame: RunFrame): number =>
  frame.stages.indexOf("running");

describe("runFrameAt", () => {
  it("shows an empty spec with a caret until the lead has passed", () => {
    const frame = frameAt(leadMs - 1);

    assert.equal(frame.typed, 0);
    assert.equal(frame.typing, true);
    assert.deepEqual(frame.stages, Array(5).fill("pending"));
    assert.equal(frame.caption, null);
  });

  it("types three characters every 30 ms", () => {
    assert.equal(frameAt(leadMs).typed, 3);
    assert.equal(frameAt(leadMs + 29).typed, 3);
    assert.equal(frameAt(leadMs + 30).typed, 6);
    assert.equal(frameAt(lastKeystrokeMs).typed, specLength);
  });

  it("keeps every stage pending while the spec types", () => {
    const frame = frameAt(sceneStartMs - 1);

    assert.equal(frame.typing, true);
    assert.deepEqual(frame.stages, Array(5).fill("pending"));
  });

  it("starts the scene 250 ms after the last keystroke with the first stage running", () => {
    const frame = frameAt(sceneStartMs);

    assert.equal(frame.typing, false);
    assert.equal(frame.sceneTime, 0);
    assert.deepEqual(frame.stages, [
      "running",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
    assert.deepEqual(frame.caption, { stage: 0, fixed: false });
  });

  it("runs one stage at a time, in order, and captions the running stage", () => {
    const seen: number[] = [];
    for (let ms = sceneStartMs; ms < sceneStartMs + beats[4] * 1000; ms += 10) {
      const frame = frameAt(ms);
      const running = runningStage(frame);
      assert.equal(frame.stages.filter((s) => s === "running").length, 1);
      assert.equal(frame.caption?.stage, running);
      assert.ok(frame.stages.slice(0, running).every((s) => s === "passed"));
      if (seen.at(-1) !== running) seen.push(running);
    }

    assert.deepEqual(seen, [0, 1, 2, 3, 4]);
  });

  it("passes a stage at its beat and starts the next in the same frame", () => {
    const frame = atSceneTime(beats[1]);

    assert.deepEqual(frame.stages.slice(0, 3), ["passed", "passed", "running"]);
  });

  it("captions the fix once it merges in ci/cd", () => {
    assert.deepEqual(atSceneTime(fixAt - 0.01).caption, {
      stage: 3,
      fixed: false,
    });
    assert.deepEqual(atSceneTime(fixAt).caption, { stage: 3, fixed: true });
  });

  it("passes every stage at the last beat and keeps the production caption", () => {
    const frame = atSceneTime(beats[4]);

    assert.deepEqual(frame.stages, Array(5).fill("passed"));
    assert.deepEqual(frame.caption, { stage: 4, fixed: false });
    assert.equal(frame.done, false);
  });

  it("finishes 450 ms after the scene ends and holds its last frame", () => {
    assert.equal(frameAt(doneMs - 1).done, false);
    assert.equal(frameAt(doneMs).done, true);
    assert.equal(frameAt(doneMs + 60_000).sceneTime, sceneEnd);
  });
});
