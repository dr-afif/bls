import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

import type { DemoRole } from "../model/demo-role";

type DemoSessionContextValue = {
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  resetDemo: () => void;
};

const DemoSessionContext = createContext<DemoSessionContextValue | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DemoRole>("learner");

  const value = useMemo(
    () => ({
      role,
      setRole,
      resetDemo: () => setRole("learner"),
    }),
    [role],
  );

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);

  if (!context) {
    throw new Error("useDemoSession must be used inside DemoSessionProvider.");
  }

  return context;
}
