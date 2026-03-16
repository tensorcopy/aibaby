import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MobileSessionProvider } from "../src/features/app-shell/MobileSessionContext.tsx";
import { MealThreadProvider } from "../src/features/chat-input/MealThreadContext.tsx";
import { brandColors } from "../src/design/brand.tsx";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MobileSessionProvider>
        <MealThreadProvider>
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: {
                backgroundColor: "#fff8f2",
              },
              headerTintColor: brandColors.text,
              headerTitleStyle: {
                color: brandColors.text,
                fontWeight: "700",
              },
              contentStyle: {
                backgroundColor: brandColors.page,
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
            <Stack.Screen
              name="review"
              options={{
                title: "Review",
              }}
            />
            <Stack.Screen
              name="reminders"
              options={{
                title: "Reminders",
              }}
            />
            <Stack.Screen
              name="growth"
              options={{
                title: "Growth",
              }}
            />
          </Stack>
        </MealThreadProvider>
      </MobileSessionProvider>
    </SafeAreaProvider>
  );
}
