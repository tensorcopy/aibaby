export function resolveReviewWindowDays(value?: string): 7 | 30 {
  return value === "30" ? 30 : 7;
}
