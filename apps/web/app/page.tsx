import { DevShellPage } from "./dev-shell";

export default function HomePage() {
  return (
    <DevShellPage
      defaultOwnerUserId={process.env.EXPO_PUBLIC_AIBABY_OWNER_USER_ID || "dev-user-1"}
      defaultTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
    />
  );
}
