import { Link } from "react-router-dom";

import { AppLogo } from "../../../components/common/app-logo";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { useTranslation } from "../../../lib/i18n/use-translation";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center p-4 sm:p-6">
      <AppLogo className="mb-6 justify-center" />
      <StatePanel
        as="h1"
        description={t("state.notFoundDesc")}
        kind="empty"
        title={t("state.notFound")}
      >
        <Button asChild className="mt-5">
          <Link to="/">{t("state.returnHome")}</Link>
        </Button>
      </StatePanel>
    </main>
  );
}
