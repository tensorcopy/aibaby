import { useLocalSearchParams } from "expo-router";

import { MealChatExperience } from "./log-meal.tsx";

export default function HomeRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;

  return <MealChatExperience babyId={routeBabyId} />;
}
