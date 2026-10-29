import { useCallback, useState } from "react";

import { useToast } from "@/hooks/useToast";

/**
 * Run one operation across a selection, honestly.
 *
 * None of these endpoints take a list — every admin API here is
 * `doThing(token, id)` — so a bulk action is really N requests, and the whole
 * difficulty is what to say when some of them fail. Written per page, that
 * logic drifted: one page would claim success after a partial run, another
 * would leave the table disagreeing with the server until a refresh.
 *
 * The rules this encodes:
 *
 *   * **Sequential, not parallel.** A partial failure then has a shape you
 *     can describe — rows before the failure are done, the rest are
 *     untouched. Parallel scatters failures unpredictably across the
 *     selection and leaves no safe thing to tell the user.
 *   * **Apply each success as it lands.** A run that dies halfway still
 *     leaves the table agreeing with the server, rather than needing a
 *     refresh to stop lying.
 *   * **Report what changed, not what was attempted.** "9 of 12 updated · 3
 *     failed" beats a success toast over a job that half worked.
 *   * **Never throw.** A bulk action is a loop over user data; one bad row
 *     must not take down the page around it.
 *
 * Progress is exposed so a caller can label its confirm button — a twelve
 * request run is long enough that a static dialog reads as a hang.
 */

export type BulkProgress = { done: number; total: number };

type RunOptions<T> = {
  items: T[];
  /** Performs the operation for one item. Throwing marks that item failed. */
  perform: (item: T) => Promise<void>;
  /** Singular noun for the toast, e.g. "store". Pluralised with a trailing s. */
  noun: string;
  /** Past-tense verb for the toast, e.g. "deleted", "suspended". */
  verb: string;
};

export function useBulkAction() {
  const { showToast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BulkProgress | null>(null);

  const run = useCallback(
    async <T,>({ items, perform, noun, verb }: RunOptions<T>) => {
      if (items.length === 0) {
        return { done: 0, failed: 0 };
      }

      setIsRunning(true);
      setProgress({ done: 0, total: items.length });

      let done = 0;
      let failed = 0;
      let firstError: string | null = null;

      for (const item of items) {
        try {
          await perform(item);
          done += 1;
          setProgress({ done, total: items.length });
        } catch (error) {
          failed += 1;
          if (!firstError) {
            firstError = error instanceof Error ? error.message : "Please try again.";
          }
        }
      }

      setIsRunning(false);
      setProgress(null);

      const plural = (count: number) => (count === 1 ? noun : `${noun}s`);

      if (failed === 0) {
        showToast({ title: `${done} ${plural(done)} ${verb}`, tone: "success" });
      } else if (done === 0) {
        showToast({
          title: `Could not ${verb.replace(/e?d$/, "")} ${plural(failed)}`,
          description: firstError ?? "Please try again.",
          tone: "error",
        });
      } else {
        showToast({
          title: `${done} of ${items.length} ${verb}`,
          description: `${failed} failed. ${firstError ?? ""}`.trim(),
          tone: "error",
        });
      }

      return { done, failed };
    },
    [showToast],
  );

  /** `"3 of 12…"` while running, otherwise the caller's own label. */
  const label = useCallback(
    (idle: string) => (progress ? `${progress.done} of ${progress.total}…` : idle),
    [progress],
  );

  return { run, isRunning, progress, label };
}
