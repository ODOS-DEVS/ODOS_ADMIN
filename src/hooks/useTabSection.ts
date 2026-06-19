import { useEffect, useState } from "react";

export function useTabSection<T extends string>(initial: T) {
  const [activeSection, setActiveSection] = useState<T>(initial);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  return { activeSection, setActiveSection };
}
