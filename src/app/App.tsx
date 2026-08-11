import { RouterProvider } from "react-router-dom";

import { DemoSessionProvider } from "../features/demo/context/demo-session-context";
import { router } from "./router";

export function App() {
  return (
    <DemoSessionProvider>
      <RouterProvider
        future={{ v7_startTransition: true }}
        router={router}
      />
    </DemoSessionProvider>
  );
}
