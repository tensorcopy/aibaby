import { useLocalSearchParams } from "expo-router";

import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";
import { MealLogRoute } from "../src/features/meal-log/MealLogRoute.tsx";

export default function LogMealScreen() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;

  return <MealLogRoute babyId={routeBabyId ?? session.currentBabyId} session={session} />;
}
