import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

// Regression guard for issue #115: alasql declares `react-native-fs` as an
// optionalDependency, and npm auto-installed that package's `react-native` and
// `react-native-windows` peers, dragging the whole React Native / metro
// toolchain into the production tree. None of it ever reached the bundle --
// esbuild only follows reachable imports -- but it made `npm audit --omit=dev`
// report seven high-severity advisories, so the pre-release audit stopped
// meaning anything. `legacy-peer-deps=true` in .npmrc stops the peer
// auto-install; react-native-fs itself stays, and carries no advisories.
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));

// A lockfile v3 entry is dev-only when it carries `dev: true`; everything else
// is reachable from the production tree, optional or not.
const productionPaths = Object.entries(lock.packages)
  .filter(([path, entry]) => path !== "" && !entry.dev)
  .map(([path]) => path);

describe("production dependency tree", function() {
  test("does not carry the React Native toolchain", function() {
    const toolchain = ["react-native", "react-native-windows", "metro", "image-size", "@react-native"];
    const reached = productionPaths.filter((path) =>
      toolchain.some(
        (name) => path === `node_modules/${name}` || path.includes(`node_modules/${name}/`)
      )
    );
    expect(reached).toEqual([]);
  });
});
