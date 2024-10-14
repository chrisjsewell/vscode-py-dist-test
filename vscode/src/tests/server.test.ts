import * as vscode from "vscode";
import * as assert from "assert";

import { activate } from "./helper";

suite("Server Test Suite", () => {
  suiteSetup(async () => {
    await activate();
  });

  test("debug information", async () => {
    const result = await vscode.commands.executeCommand(
      "test-lsp.server.getDebugInformation",
    );
    assert.ok(result);
    assert.deepEqual(Object.getOwnPropertyNames(result), ["name", "version"]);
  });
});
