import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MobileSessionProvider } from "../src/features/app-shell/MobileSessionContext.tsx";
import { MealThreadProvider } from "../src/features/chat-input/MealThreadContext.tsx";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MobileSessionProvider>
        <MealThreadProvider>
          <Slot />
        </MealThreadProvider>
      </MobileSessionProvider>
    </SafeAreaProvider>
  );
}
