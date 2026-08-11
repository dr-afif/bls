import { Link } from "react-router-dom";

import { AppLogo } from "../../../components/common/app-logo";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center p-4 sm:p-6">
      <AppLogo className="mb-6 justify-center" />
      <StatePanel
        as="h1"
        description="The requested prototype screen does not exist."
        kind="empty"
        title="Page not found"
      >
        <Button asChild className="mt-5">
          <Link to="/">Return to role selection</Link>
        </Button>
      </StatePanel>
    </main>
  );
}
