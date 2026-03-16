import type { BabyProfileAuth } from "../baby-profile/transport.ts";

export type MobileSupabaseAuthConfig = {
  url: string;
  anonKey: string;
};

export type MobileSupabaseSession = {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email?: string;
  };
};

export type MobileSupabaseSessionSource = {
  getCurrentSession: () => Promise<MobileSupabaseSession | null>;
  subscribe: (listener: (session: MobileSupabaseSession | null) => void) => () => void;
  signOut: () => Promise<void>;
};

type DynamicSupabaseClient = {
  auth?: {
    getSession?: () => Promise<{
      data?: {
        session?: unknown;
      };
    }>;
    onAuthStateChange?: (
      listener: (_event: string, session: unknown) => void,
    ) => {
      data?: {
        subscription?: {
          unsubscribe?: () => void;
        };
      };
    };
    signOut?: () => Promise<unknown>;
  };
};

type DynamicSecureStoreModule = {
  getItemAsync?: (key: string) => Promise<string | null>;
  setItemAsync?: (key: string, value: string) => Promise<void>;
  deleteItemAsync?: (key: string) => Promise<void>;
};

export function readMobileSupabaseAuthConfig(
  env: Record<string, string | undefined> = process.env,
): MobileSupabaseAuthConfig | undefined {
  const url = normalizeOptionalString(env.EXPO_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeOptionalString(env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    return undefined;
  }

  return {
    url,
    anonKey,
  };
}

export function createSupabaseSessionAuth(
  session?: MobileSupabaseSession | null,
): BabyProfileAuth | undefined {
  const normalizedSession = normalizeMobileSupabaseSession(session);

  if (!normalizedSession) {
    return undefined;
  }

  return {
    authorization: `Bearer ${normalizedSession.accessToken}`,
    ownerUserId: normalizedSession.user.id,
  };
}

export function normalizeMobileSupabaseSession(
  session?: unknown,
): MobileSupabaseSession | null {
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    return null;
  }

  const candidate = session as {
    access_token?: unknown;
    accessToken?: unknown;
    refresh_token?: unknown;
    refreshToken?: unknown;
    user?: unknown;
  };
  const accessToken = normalizeOptionalString(
    typeof candidate.accessToken === "string"
      ? candidate.accessToken
      : typeof candidate.access_token === "string"
        ? candidate.access_token
        : undefined,
  );
  const refreshToken = normalizeOptionalString(
    typeof candidate.refreshToken === "string"
      ? candidate.refreshToken
      : typeof candidate.refresh_token === "string"
        ? candidate.refresh_token
        : undefined,
  );
  const user = normalizeMobileSupabaseUser(candidate.user);

  if (!accessToken || !user) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    user,
  };
}

export function createMobileSupabaseSessionSource(
  client: DynamicSupabaseClient,
): MobileSupabaseSessionSource {
  return {
    async getCurrentSession() {
      const response = await client.auth?.getSession?.();
      return normalizeMobileSupabaseSession(response?.data?.session);
    },
    subscribe(listener) {
      const subscription = client.auth?.onAuthStateChange?.((_event, session) => {
        listener(normalizeMobileSupabaseSession(session));
      });

      return () => {
        subscription?.data?.subscription?.unsubscribe?.();
      };
    },
    async signOut() {
      await client.auth?.signOut?.();
    },
  };
}

export async function loadExpoSupabaseSessionSource(
  config: MobileSupabaseAuthConfig,
): Promise<MobileSupabaseSessionSource> {
  try {
    await import("react-native-url-polyfill/auto");

    const [{ createClient }, secureStoreModule] = await Promise.all([
      import("@supabase/supabase-js"),
      import("expo-secure-store"),
    ]);

    const secureStore = normalizeSecureStoreModule(secureStoreModule);
    const client = createClient(config.url, config.anonKey, {
      auth: {
        storage: createExpoSecureStoreAdapter(secureStore),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    return createMobileSupabaseSessionSource(client);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? `Supabase mobile auth setup failed: ${error.message}`
        : "Supabase mobile auth setup failed.";
    throw new Error(
      `${message} Install @supabase/supabase-js, expo-secure-store, and react-native-url-polyfill before enabling Expo Supabase auth.`,
    );
  }
}

function createExpoSecureStoreAdapter(secureStore: Required<DynamicSecureStoreModule>) {
  return {
    getItem(key: string) {
      return secureStore.getItemAsync(key);
    },
    setItem(key: string, value: string) {
      return secureStore.setItemAsync(key, value);
    },
    removeItem(key: string) {
      return secureStore.deleteItemAsync(key);
    },
  };
}

function normalizeSecureStoreModule(
  module: unknown,
): Required<DynamicSecureStoreModule> {
  const candidate = (module ?? {}) as DynamicSecureStoreModule;

  if (
    typeof candidate.getItemAsync !== "function" ||
    typeof candidate.setItemAsync !== "function" ||
    typeof candidate.deleteItemAsync !== "function"
  ) {
    throw new Error("expo-secure-store is unavailable");
  }

  return {
    getItemAsync: candidate.getItemAsync,
    setItemAsync: candidate.setItemAsync,
    deleteItemAsync: candidate.deleteItemAsync,
  };
}

function normalizeMobileSupabaseUser(
  user: unknown,
): MobileSupabaseSession["user"] | null {
  if (!user || typeof user !== "object" || Array.isArray(user)) {
    return null;
  }

  const candidate = user as {
    id?: unknown;
    email?: unknown;
  };
  const id = normalizeOptionalString(candidate.id as string | undefined);

  if (!id) {
    return null;
  }

  const email = normalizeOptionalString(candidate.email as string | undefined);

  return email ? { id, email } : { id };
}

function normalizeOptionalString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
