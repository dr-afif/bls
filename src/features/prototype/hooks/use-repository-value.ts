import { useEffect, useState } from "react";

type RepositoryState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: Error };

export function useRepositoryValue<T>(load: () => Promise<T>) {
  const [state, setState] = useState<RepositoryState<T>>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    load()
      .then((data) => {
        if (active) setState({ status: "ready", data, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            data: null,
            error:
              error instanceof Error
                ? error
                : new Error("Unknown prototype error."),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [load]);

  return state;
}

