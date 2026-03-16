import test from "node:test";
import assert from "node:assert/strict";

import { createMobileFeatureScreenModel } from "./featureScreen.ts";

test("createMobileFeatureScreenModel links feature shells back to the active baby home route", () => {
  assert.deepEqual(
    createMobileFeatureScreenModel({
      feature: "log-meal",
      babyId: " baby_123 ",
    }),
    {
      title: "Log a meal",
      subtitle:
        "This route is ready to host the chat-first meal composer and image attachment flow.",
      statusTitle: "Active baby linked",
      statusMessage:
        "The next slice can build the text and image composer here without changing the home navigation again.",
      homeHref: "/?babyId=baby_123",
    },
  );
});

test("createMobileFeatureScreenModel explains missing baby context for downstream routes", () => {
  const model = createMobileFeatureScreenModel({
    feature: "today-timeline",
  });

  assert.equal(model.title, "Today's timeline");
  assert.equal(model.statusTitle, "Baby profile still required");
  assert.match(model.statusMessage, /Create a baby profile first/);
  assert.equal(model.homeHref, "/");
});

test("createMobileFeatureScreenModel reserves a stable growth route for future history and charts", () => {
  assert.deepEqual(
    createMobileFeatureScreenModel({
      feature: "growth",
      babyId: " baby_123 ",
    }),
    {
      title: "Growth",
      subtitle:
        "This route is reserved for future weight, height, and chart cards once growth entries land.",
      statusTitle: "Growth shell ready",
      statusMessage:
        "The home quick action can land here now while growth history and chart work ship in later Team 1 slices.",
      homeHref: "/?babyId=baby_123",
    },
  );
});
