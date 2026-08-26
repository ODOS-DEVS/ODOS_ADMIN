import clsx from "clsx";

/** Below this, a listing is close enough to selling out that it needs attention. */
export const LOW_STOCK_THRESHOLD = 10;

/** The bar is capped here so a 900-unit listing does not make a 40-unit one look empty. */
const FULL_BAR_AT = 50;

/**
 * Stock on hand, as a level rather than only a number.
 *
 * The number alone makes an operator do the comparison in their head on every
 * row; the bar does it for them, and the colour flags the two states worth
 * acting on — out of stock, and low enough to reorder.
 */
export function StockMeter({ stock }: { stock: number }) {
  const isOut = stock <= 0;
  const isLow = !isOut && stock < LOW_STOCK_THRESHOLD;
  const fill = Math.min(100, Math.max(stock <= 0 ? 0 : 4, (stock / FULL_BAR_AT) * 100));

  return (
    <div className="flex min-w-[5.5rem] flex-col gap-1.5">
      <span
        className={clsx(
          "text-sm font-semibold tabular-nums",
          isOut ? "text-danger" : isLow ? "text-warning" : "text-textStrong",
        )}
      >
        {stock.toLocaleString()}
      </span>
      <span className="block h-1 w-full overflow-hidden rounded-full bg-line" aria-hidden>
        <span
          className={clsx(
            "block h-full rounded-full",
            isOut ? "bg-danger" : isLow ? "bg-warning" : "bg-success",
          )}
          style={{ width: `${fill}%` }}
        />
      </span>
      <span
        className={clsx(
          "text-[11px]",
          isOut ? "text-danger" : isLow ? "text-warning" : "text-textSubtle",
        )}
      >
        {isOut ? "Out of stock" : isLow ? "Low stock" : "In stock"}
      </span>
    </div>
  );
}
