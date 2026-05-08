import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) {
    return nextResolve(specifier, context);
  }

  const withoutAlias = specifier.slice(2);
  const basePath = path.join(ROOT, withoutAlias);
  const resolvedPath = [basePath, `${basePath}.ts`, `${basePath}.tsx`].find((candidate) =>
    fs.existsSync(candidate)
  );

  if (!resolvedPath) {
    return nextResolve(specifier, context);
  }

  return {
    shortCircuit: true,
    url: pathToFileURL(resolvedPath).href
  };
}
