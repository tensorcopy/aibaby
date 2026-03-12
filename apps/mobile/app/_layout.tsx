import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MobileSessionProvider } from "../src/features/app-shell/MobileSessionContext.tsx";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MobileSessionProvider>
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerTitleStyle: {
              color: "#0f172a",
              fontWeight: "600",
            },
            contentStyle: {
              backgroundColor: "#f8fafc",
            },
          }}
        >
        <Stack.Screen
          name="index"
          options={{
            title: "AI Baby",
          }}
        />
        <Stack.Screen
          name="baby-profile"
          options={{
            title: "Baby profile",
          }}
        />
        <Stack.Screen
          name="log-meal"
          options={{
            title: "Log a meal",
          }}
        />
        <Stack.Screen
          name="today"
          options={{
            title: "Today's timeline",
          }}
        />
        <Stack.Screen
          name="summaries"
          options={{
            title: "Summary history",
          }}
        />
        </Stack>
      </MobileSessionProvider>
    </SafeAreaProvider>
  );
}
