import { useLocalSearchParams } from "expo-router";

import Review30DayRoute from "./review-30-day.tsx";
import Review7DayRoute from "./review-7-day.tsx";
import { resolveReviewWindowDays } from "../src/features/review/route.ts";

export default function ReviewRoute() {
  const params = useLocalSearchParams<{ days?: string | string[] }>();
  const routeDays = Array.isArray(params.days) ? params.days[0] : params.days;
  const windowDays = resolveReviewWindowDays(routeDays);

  return windowDays === 30 ? <Review30DayRoute /> : <Review7DayRoute />;
}
