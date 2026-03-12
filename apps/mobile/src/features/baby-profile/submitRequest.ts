import type {
  BabyProfilePayload,
  BabyProfileUpdatePayload,
} from "@aibaby/ui";

import type { submitBabyProfileCreateEditState } from "./createEditFlow.ts";

type BabyProfileSubmission = Extract<
  ReturnType<typeof submitBabyProfileCreateEditState>,
  { ok: true }
>;

export type BabyProfileSubmitRequest =
  | {
      method: "POST";
      path: "/api/babies";
      body: BabyProfilePayload;
    }
  | {
      method: "PATCH";
      path: `/api/babies/${string}`;
      body: BabyProfileUpdatePayload;
    };

export function toBabyProfileSubmitRequest(
  submission: BabyProfileSubmission,
  babyId?: string,
): BabyProfileSubmitRequest | null {
  if (submission.mode === "create") {
    return {
      method: "POST",
      path: "/api/babies",
      body: submission.payload,
    };
  }

  if (!submission.hasChanges) {
    return null;
  }

  if (!babyId?.trim()) {
    throw new Error("A baby id is required for edit submissions.");
  }

  return {
    method: "PATCH",
    path: `/api/babies/${encodeURIComponent(babyId.trim())}`,
    body: submission.patch,
  };
}
