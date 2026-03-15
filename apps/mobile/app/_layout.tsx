import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MobileSessionProvider } from "../src/features/app-shell/MobileSessionContext.tsx";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MobileSessionProvider>
        <Slot />
      </MobileSessionProvider>
    </SafeAreaProvider>
  );
}
