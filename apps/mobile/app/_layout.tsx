import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
      </Stack>
    </SafeAreaProvider>
  );
}
