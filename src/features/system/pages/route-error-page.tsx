import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

import { AppLogo } from "../../../components/common/app-logo";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";

export function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status}: ${error.statusText}`
    : "The prototype could not render this route.";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center p-4 sm:p-6">
      <AppLogo className="mb-6 justify-center" />
      <StatePanel description={message} kind="error">
        <Button asChild className="mt-5">
          <Link to="/">Return to prototype entry</Link>
        </Button>
      </StatePanel>
    </main>
  );
}
