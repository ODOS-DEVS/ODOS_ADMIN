import type { ReactNode } from "react";

import { AuthBrandMark } from "@/components/auth/AuthBrandMark";
import { AuthShowcasePanel } from "@/components/auth/AuthShowcasePanel";

export type AuthShowcaseContent = {
  title: string;
  description: string;
  tagline?: string;
};

type AuthShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  showcase: AuthShowcaseContent;
  brandLinkTo?: string;
};

export function AuthShell({ children, footer, showcase, brandLinkTo = "/login" }: AuthShellProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      <div className="flex w-full flex-1 flex-col overflow-y-auto lg:w-[54%] xl:w-[52%]">
        <div className="px-8 pt-7 sm:px-10 lg:px-14 lg:pt-9">
          <AuthBrandMark to={brandLinkTo} />
        </div>

        <div className="flex flex-1 flex-col justify-center px-8 py-8 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-[380px] animate-fade-up opacity-0">{children}</div>
          {footer ? (
            <div
              className="mx-auto mt-8 w-full max-w-[380px] animate-fade-up border-t border-line pt-5 text-center text-sm text-textMuted opacity-0"
              style={{ animationDelay: "140ms" }}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden shrink-0 border-l border-line lg:block lg:w-[46%] xl:w-[48%]">
        <AuthShowcasePanel
          title={showcase.title}
          description={showcase.description}
          tagline={showcase.tagline}
        />
      </div>
    </div>
  );
}
