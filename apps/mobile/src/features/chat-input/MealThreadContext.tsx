import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";

import {
  prependMealThreadEntry,
  readMealThreadEntries,
  updateMealThreadEntry,
  type MealThreadEntry,
  type MealThreadStore,
} from "./thread.ts";

const MealThreadContext = createContext<{
  threadsByBabyId: MealThreadStore;
  setThreadsByBabyId: Dispatch<SetStateAction<MealThreadStore>>;
}>({
  threadsByBabyId: {},
  setThreadsByBabyId: () => {},
});

export function MealThreadProvider({ children }: PropsWithChildren) {
  const [threadsByBabyId, setThreadsByBabyId] = useState<MealThreadStore>({});

  return (
    <MealThreadContext.Provider value={{ threadsByBabyId, setThreadsByBabyId }}>
      {children}
    </MealThreadContext.Provider>
  );
}

export function useMealThread(babyId?: string) {
  const { threadsByBabyId, setThreadsByBabyId } = useContext(MealThreadContext);

  return {
    thread: readMealThreadEntries(threadsByBabyId, babyId),
    prependEntry(entry: MealThreadEntry) {
      setThreadsByBabyId((current) => prependMealThreadEntry(current, babyId, entry));
    },
    updateEntry(entryId: string, transform: (entry: MealThreadEntry) => MealThreadEntry) {
      setThreadsByBabyId((current) =>
        updateMealThreadEntry(current, babyId, entryId, transform),
      );
    },
  };
}
