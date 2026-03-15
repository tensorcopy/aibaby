import path from "node:path";

import { buildLocalSessionToken } from "../apps/web/src/features/baby-profile/session-token.js";

const userId = process.argv[2] || "demo-owner-1";
const token = buildLocalSessionToken({
  userId,
});

process.stdout.write(`${token}\n`);
