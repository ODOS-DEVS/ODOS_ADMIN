import clsx from "clsx";

type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({ name, imageUrl, size = "md", className }: UserAvatarProps) {
  const sizeClass = size === "sm" ? "size-9 text-xs" : "size-10 text-sm";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={clsx("rounded-full object-cover", sizeClass, className)}
      />
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accentSoft font-semibold text-accent",
        sizeClass,
        className,
      )}
    >
      {initialsFromName(name || "?")}
    </span>
  );
}
