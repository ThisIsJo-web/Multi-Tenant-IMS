import React from "react";
import { WorkspaceProvider } from "@/components/workspace/workspace-context";
import { WorkspaceGuard } from "@/components/workspace/workspace-guard";
import { TopBar } from "@/components/workspace/topbar";
import { Sidebar } from "@/components/workspace/sidebar";
import { EditWorkspaceModal } from "@/components/workspace/edit-workspace-modal";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ enterpriseSlug: string }>;
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { enterpriseSlug } = await params;

  return (
    <WorkspaceProvider slug={enterpriseSlug}>
      <WorkspaceGuard>
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-slate-200">
          <TopBar />
          <div className="flex-1 flex flex-row">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
          <EditWorkspaceModal />
        </div>
      </WorkspaceGuard>
    </WorkspaceProvider>
  );
}
