import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  const bootstrapValue = useMemo(
    () => bootstrap ?? readMobileSessionBootstrapEnv(),
    [bootstrap],
  );
  const [currentBabyId, setCurrentBabyId] = useState(bootstrapValue.currentBabyId);

  useEffect(() => {
    setCurrentBabyId(bootstrapValue.currentBabyId);
  }, [bootstrapValue.currentBabyId]);

  const value = useMemo(
    () =>
      createMobileSessionContextValue(
        {
          ...bootstrapValue,
          currentBabyId,
        },
        {
          setCurrentBabyId,
        },
      ),
    [bootstrapValue, currentBabyId],
  );

  return (
    <MobileSessionContext.Provider value={value}>{children}</MobileSessionContext.Provider>
  );
}

export function useMobileSession(): MobileSessionContextValue {
  return useContext(MobileSessionContext);
}
