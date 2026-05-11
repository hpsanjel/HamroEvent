import { useEffect, useState } from "react";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 1000);

    return () => {
      clearTimeout(timer);
      return hydrated;
    };
  }, []);
}
