import test from "node:test";
import assert from "node:assert/strict";

import {
  createBabyProfileHref,
  createMobileRootNavigationModel,
} from "./rootNavigation.ts";

test("createMobileRootNavigationModel points first-time users to create baby profile", () => {
  const model = createMobileRootNavigationModel();

  assert.equal(model.title, "AI Baby");
  assert.equal(model.primaryAction.label, "Create baby profile");
  assert.equal(model.primaryAction.href, "/baby-profile");
  assert.match(model.subtitle, /Start with a baby profile/);
});

test("createMobileRootNavigationModel keeps explicit baby profile navigation stable", () => {
  const model = createMobileRootNavigationModel({ babyId: "baby_123" });

  assert.equal(model.primaryAction.label, "Open baby profile");
  assert.equal(model.primaryAction.href, "/baby-profile?babyId=baby_123");
  assert.match(model.subtitle, /current baby profile flow/);
});

test("createBabyProfileHref trims and encodes the baby id query parameter", () => {
  assert.equal(createBabyProfileHref("  baby 123  "), "/baby-profile?babyId=baby%20123");
});
