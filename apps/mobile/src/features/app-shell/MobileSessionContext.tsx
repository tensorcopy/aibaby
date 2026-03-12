import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";

import {
  createMobileSessionContextValue,
  readMobileSessionBootstrapEnv,
  type MobileSessionBootstrapInput,
  type MobileSessionContextValue,
} from "./mobileSession.ts";

const MobileSessionContext = createContext<MobileSessionContextValue>(
  createMobileSessionContextValue(),
);

export function MobileSessionProvider({
  children,
  bootstrap,
}: PropsWithChildren<{
  bootstrap?: MobileSessionBootstrapInput;
}>) {
  const value = useMemo(
    () => createMobileSessionContextValue(bootstrap ?? readMobileSessionBootstrapEnv()),
    [bootstrap],
  );

  return (
    <MobileSessionContext.Provider value={value}>{children}</MobileSessionContext.Provider>
  );
}

export function useMobileSession(): MobileSessionContextValue {
  return useContext(MobileSessionContext);
}
