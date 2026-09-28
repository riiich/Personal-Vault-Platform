import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoVault } from "../src/data/vault.ts";

test("published snapshots remain immutable across subsequent changes", () => {
  const vault = createDemoVault();
  const before = vault.getSnapshot();
  vault.createFolder("personal-root", "A new folder");
  assert.notEqual(before, vault.getSnapshot());
  assert.equal(before.folders.some(folder => folder.name === "A new folder"), false);
});

test("new Spaces own a root folder and nested folders retain their Space", () => {
  const vault = createDemoVault();
  const root = vault.createSpace("Family", "coast", "Shared memories");
  const child = vault.createFolder(root, "Holidays");
  const state = vault.getSnapshot();
  const space = state.spaces.find((item) => item.rootFolderId === root);
  assert.equal(
    state.folders.find((item) => item.id === child).spaceId,
    space.id,
  );
  assert.throws(
    () => vault.createSpace(" family ", "coast", ""),
    /already exists/,
  );
  assert.throws(() => vault.createFolder(root, "holidays"), /already exists/);
});

test("categories are folder scoped and invalid batch edits are atomic", () => {
  const vault = createDemoVault();
  assert.throws(() => vault.categorize(["w1", "p1"], "working"), /this folder/);
  assert.equal(
    vault.getSnapshot().files.find((item) => item.id === "w1").categoryId,
    "reference",
  );
  vault.categorize(["w1", "w2"], "working");
  assert.equal(
    vault.getSnapshot().files.find((item) => item.id === "w2").categoryId,
    "working",
  );
});

test("deleting a category preserves its files, including files in Trash", () => {
  const vault = createDemoVault();
  vault.trashFiles(["w1"]);
  const before = vault.getSnapshot().files.length;
  vault.deleteCategory("reference");
  assert.equal(vault.getSnapshot().files.length, before);
  assert.ok(
    vault
      .getSnapshot()
      .files.filter((item) => ["w1", "w2", "w3"].includes(item.id))
      .every((item) => item.categoryId === null),
  );
  vault.trashFiles(["w1"], true);
  assert.equal(
    vault.getSnapshot().files.find((item) => item.id === "w1").deletedAt,
    null,
  );
});

test("moving to a different folder clears the old category, same-folder moves preserve it", () => {
  const vault = createDemoVault();
  vault.moveFiles(["w1"], "workshop");
  assert.equal(
    vault.getSnapshot().files.find((item) => item.id === "w1").categoryId,
    "reference",
  );
  vault.moveFiles(["w1"], "personal-root");
  const file = vault.getSnapshot().files.find((item) => item.id === "w1");
  assert.equal(file.folderId, "personal-root");
  assert.equal(file.categoryId, null);
});

test("demo locks apply to descendants and block edits until the correct PIN is entered", () => {
  const vault = createDemoVault();
  vault.setPin("projects-root", "1234");
  vault.lock("projects-root");
  assert.equal(vault.lockedAncestor("workshop").id, "projects-root");
  assert.throws(() => vault.renameFile("w1", "hidden.jpg"), /Unlock/);
  assert.throws(
    () => vault.addFiles([new File(["abc"], "test.txt")], "workshop", null),
    /Unlock/,
  );
  assert.throws(() => vault.unlock("projects-root", "9999"), /incorrect/);
  vault.unlock("projects-root", "1234");
  assert.equal(vault.lockedAncestor("workshop"), undefined);
  assert.throws(() => vault.setPin("projects-root", "", "9999"), /incorrect/);
  vault.setPin("projects-root", "", "1234");
  assert.equal(
    vault.getSnapshot().folders.find((item) => item.id === "projects-root")
      .pinEnabled,
    false,
  );
  assert.throws(() => vault.setPin("workshop", "abcd"), /numeric/);
});

test("any file type is accepted and identical names receive distinct identities", () => {
  const vault = createDemoVault();
  const files = vault.addFiles(
    [new File(["one"], "backup.custom"), new File(["two"], "backup.custom")],
    "workshop",
    "working",
  );
  assert.notEqual(files[0].id, files[1].id);
  assert.notEqual(files[0].source, files[1].source);
  assert.equal(files[0].mimeType, "application/octet-stream");
  assert.equal(files[0].size, 3);
  assert.equal(files[0].categoryId, "working");
  vault.reset();
});

test("reset restores demo state and subscriptions stop after cleanup", () => {
  const vault = createDemoVault();
  let updates = 0;
  const stop = vault.subscribe(() => updates++);
  vault.createFolder("personal-root", "Scratch");
  vault.reset();
  assert.equal(updates, 2);
  assert.equal(
    vault.getSnapshot().folders.some((item) => item.name === "Scratch"),
    false,
  );
  stop();
  vault.favorite("p1");
  assert.equal(updates, 2);
});
