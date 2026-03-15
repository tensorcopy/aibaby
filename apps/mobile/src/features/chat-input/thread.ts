import type { MealComposerSubmission } from "./composer.ts";
import type {
  ConfirmableMealRecord,
  MealRecordConfirmationDraft,
} from "./draft-confirmation.ts";

export type MealThreadEntry = MealComposerSubmission & {
  deliveryStatus: "local" | "uploading" | "uploaded" | "error";
  detailText: string;
  remoteMessageId?: string;
  mealRecord?: ConfirmableMealRecord;
  confirmationDraft?: MealRecordConfirmationDraft;
  confirmationState?: "idle" | "editing" | "saving" | "confirmed";
};

export type MealThreadStore = Record<string, MealThreadEntry[]>;

export function readMealThreadEntries(
  store: MealThreadStore,
  babyId?: string,
): MealThreadEntry[] {
  const scopeId = normalizeMealThreadScopeId(babyId);

  if (!scopeId) {
    return [];
  }

  return store[scopeId] ?? [];
}

export function prependMealThreadEntry(
  store: MealThreadStore,
  babyId: string | undefined,
  entry: MealThreadEntry,
): MealThreadStore {
  const scopeId = normalizeMealThreadScopeId(babyId);

  if (!scopeId) {
    return store;
  }

  return {
    ...store,
    [scopeId]: [entry, ...readMealThreadEntries(store, scopeId)],
  };
}

export function updateMealThreadEntry(
  store: MealThreadStore,
  babyId: string | undefined,
  entryId: string,
  transform: (entry: MealThreadEntry) => MealThreadEntry,
): MealThreadStore {
  const scopeId = normalizeMealThreadScopeId(babyId);

  if (!scopeId) {
    return store;
  }

  const currentEntries = readMealThreadEntries(store, scopeId);
  let changed = false;

  const nextEntries = currentEntries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }

    changed = true;
    return transform(entry);
  });

  if (!changed) {
    return store;
  }

  return {
    ...store,
    [scopeId]: nextEntries,
  };
}

function normalizeMealThreadScopeId(babyId?: string): string | undefined {
  const normalized = babyId?.trim();
  return normalized ? normalized : undefined;
}
