"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function RootRouterPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/enterprise/context")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.user?.role === "superadmin") {
          router.replace("/superadmin");
        } else if (data.activeEnterprise) {
          router.replace(`/${data.activeEnterprise.slug}`);
        } else if (data.user?.role === "manager") {
          router.replace("/manager");
        } else {
          router.replace("/enter-key");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center text-slate-500 text-xs">
      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
      <span>Connecting to workspace...</span>
    </div>
  );
}
