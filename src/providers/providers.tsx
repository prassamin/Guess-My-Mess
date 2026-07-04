"use client";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProgressProvider
      color="orange"
      options={{
        showSpinner: false,
      }}
      height="3px"
    >
      {children}
    </ProgressProvider>
  );
};
