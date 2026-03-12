export type BabyProfileLoadRequest =
  | {
      method: "GET";
      path: "/api/babies";
      target: "current";
    }
  | {
      method: "GET";
      path: `/api/babies/${string}`;
      target: "explicit";
      babyId: string;
    };

export function toBabyProfileLoadRequest(
  babyId?: string,
): BabyProfileLoadRequest {
  const normalizedBabyId = babyId?.trim();

  if (!normalizedBabyId) {
    return {
      method: "GET",
      path: "/api/babies",
      target: "current",
    };
  }

  return {
    method: "GET",
    path: `/api/babies/${encodeURIComponent(normalizedBabyId)}`,
    target: "explicit",
    babyId: normalizedBabyId,
  };
}
