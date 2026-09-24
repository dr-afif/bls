import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

import { AppLogo } from "../../../components/common/app-logo";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { useTranslation } from "../../../lib/i18n/use-translation";

export function RouteErrorPage() {
  const error = useRouteError();
  const { t } = useTranslation();
  const message = isRouteErrorResponse(error)
    ? `${error.status}: ${error.statusText}`
    : "The application could not render this route.";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center p-4 sm:p-6">
      <AppLogo className="mb-6 justify-center" />
      <StatePanel description={message} kind="error">
        <Button asChild className="mt-5">
          <Link to="/">{t("state.returnHome")}</Link>
        </Button>
      </StatePanel>
    </main>
  );
}
