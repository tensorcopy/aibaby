import { useLocalSearchParams } from "expo-router";

import { FeaturePlaceholderRoute } from "../src/features/app-shell/FeaturePlaceholderRoute.tsx";
import { useMobileSession } from "../src/features/app-shell/MobileSessionContext.tsx";

export default function TodayRoute() {
  const params = useLocalSearchParams<{ babyId?: string | string[] }>();
  const session = useMobileSession();
  const routeBabyId = Array.isArray(params.babyId) ? params.babyId[0] : params.babyId;

  return (
    <FeaturePlaceholderRoute babyId={routeBabyId ?? session.currentBabyId} feature="today-timeline" />
  );
}
