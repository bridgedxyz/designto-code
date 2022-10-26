import React from "react";
import { Toaster } from "react-hot-toast";

export function ToastProvider({ children }: React.PropsWithChildren<{}>) {
  return (
    <>
      {children}
      <Toaster position="bottom-center" />
    </>
  );
}
