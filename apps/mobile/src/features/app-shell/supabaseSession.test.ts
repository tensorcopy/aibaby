import test from "node:test";
import assert from "node:assert/strict";

import {
  createMobileSupabaseSessionSource,
  createSupabaseSessionAuth,
  normalizeMobileSupabaseSession,
} from "./supabaseSession.ts";

test("normalizeMobileSupabaseSession trims and validates a Supabase auth session", () => {
  assert.deepEqual(
    normalizeMobileSupabaseSession({
      access_token: " access-token-123 ",
      refresh_token: " refresh-token-123 ",
      user: {
        id: " user_123 ",
        email: " caregiver@example.com ",
      },
    }),
    {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-123",
      user: {
        id: "user_123",
        email: "caregiver@example.com",
      },
    },
  );

  assert.equal(
    normalizeMobileSupabaseSession({
      access_token: "access-token-123",
      user: {},
    }),
    null,
  );
});

test("createSupabaseSessionAuth maps a Supabase session into bearer transport auth", () => {
  assert.deepEqual(
    createSupabaseSessionAuth({
      accessToken: "access-token-123",
      user: {
        id: "user_123",
      },
    }),
    {
      authorization: "Bearer access-token-123",
      ownerUserId: "user_123",
    },
  );
});

test("createMobileSupabaseSessionSource normalizes getSession, auth updates, and signOut", async () => {
  const authEvents: Array<(session: unknown) => void> = [];
  let didUnsubscribe = false;
  let didSignOut = false;

  const source = createMobileSupabaseSessionSource({
    auth: {
      async getSession() {
        return {
          data: {
            session: {
              access_token: "access-token-123",
              user: {
                id: "user_123",
              },
            },
          },
        };
      },
      onAuthStateChange(listener) {
        authEvents.push((session) => listener("SIGNED_IN", session));

        return {
          data: {
            subscription: {
              unsubscribe() {
                didUnsubscribe = true;
              },
            },
          },
        };
      },
      async signOut() {
        didSignOut = true;
      },
    },
  });

  assert.deepEqual(await source.getCurrentSession(), {
    accessToken: "access-token-123",
    refreshToken: undefined,
    user: {
      id: "user_123",
    },
  });

  const received: Array<unknown> = [];
  const unsubscribe = source.subscribe((session) => {
    received.push(session);
  });

  authEvents[0]?.({
    access_token: "access-token-456",
    user: {
      id: "user_456",
      email: "next@example.com",
    },
  });

  assert.deepEqual(received, [
    {
      accessToken: "access-token-456",
      refreshToken: undefined,
      user: {
        id: "user_456",
        email: "next@example.com",
      },
    },
  ]);

  unsubscribe();
  assert.equal(didUnsubscribe, true);

  await source.signOut();
  assert.equal(didSignOut, true);
});
