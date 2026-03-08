"use client";

import dynamic from "next/dynamic";

const AuthHashRedirect = dynamic(
  () => import("./AuthHashRedirect").then((m) => ({ default: m.AuthHashRedirect })),
  { ssr: false }
);

export function ClientAuthHashRedirect() {
  return <AuthHashRedirect />;
}
