import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "POS Terminal — Cashier Counter",
  description: "Enterprise Point of Sale Cashier Terminal connected to IMS live inventory.",
};

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased selection:bg-slate-200">
      {children}
    </div>
  );
}
