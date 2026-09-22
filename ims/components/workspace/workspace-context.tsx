"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ActiveEnterprise,
  ActiveMembership,
  UserContext,
} from "@/types/inventory";

interface WorkspaceContextValue {
  user: UserContext | null;
  activeEnterprise: ActiveEnterprise | null;
  activeMembership: ActiveMembership | null;
  enterprises: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    enterpriseKey?: string;
  }>;
  isLoading: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
  canEditWorkspace: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  effectivePermissions: string[];
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  openEditModal: () => void;
  closeEditModal: () => void;
  refreshContext: () => Promise<void>;
  switchEnterprise: (enterpriseId: string) => Promise<void>;
  targetSlug: string;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}

interface WorkspaceProviderProps {
  children: React.ReactNode;
  slug: string;
}

export function WorkspaceProvider({ children, slug }: WorkspaceProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserContext | null>(null);
  const [activeEnterprise, setActiveEnterprise] = useState<ActiveEnterprise | null>(null);
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchContext = useCallback(async () => {
    try {
      const res = await fetch("/api/enterprise/context");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setEnterprises(data.enterprises || []);

      // Match enterprise by slug
      const matched = (data.enterprises || []).find((e: any) => e.slug === slug);

      if (matched) {
        // If current active in session doesn't match this slug, switch active context
        if (data.activeEnterprise?.slug !== slug) {
          await fetch("/api/enterprise/switch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enterpriseId: matched.id }),
          });
          const refreshed = await (await fetch("/api/enterprise/context")).json();
          setActiveEnterprise(refreshed.activeEnterprise);
          setActiveMembership(refreshed.activeMembership);
        } else {
          setActiveEnterprise(data.activeEnterprise);
          setActiveMembership(data.activeMembership);
        }
      } else {
        setActiveEnterprise(data.activeEnterprise);
        setActiveMembership(data.activeMembership);
      }
    } catch {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const isSuperAdmin = user?.role === "superadmin";
  const isManager = activeMembership?.role === "manager" || isSuperAdmin;
  const canEditWorkspace = isManager;

  const effectivePermissions = React.useMemo(() => {
    if (isSuperAdmin || isManager) return ["*"];
    return activeMembership?.permissions || [];
  }, [isSuperAdmin, isManager, activeMembership?.permissions]);

  const hasPermission = useCallback(
    (perm: string): boolean => {
      if (isSuperAdmin || isManager) return true;
      const perms = activeMembership?.permissions || [];
      if (perms.includes("*")) return true;
      if (perms.includes(perm)) return true;
      // Implied view fallback
      if (perm === "locations:view" && perms.includes("stock:view")) return true;
      if (perm === "products:view" && perms.includes("stock:view")) return true;
      if (perm === "stock:view" && (perms.includes("products:view") || perms.includes("locations:view"))) return true;
      return false;
    },
    [isSuperAdmin, isManager, activeMembership?.permissions]
  );

  const hasAnyPermission = useCallback(
    (permsToCheck: string[]): boolean => {
      if (isSuperAdmin || isManager) return true;
      return permsToCheck.some((p) => hasPermission(p));
    },
    [isSuperAdmin, isManager, hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permsToCheck: string[]): boolean => {
      if (isSuperAdmin || isManager) return true;
      return permsToCheck.every((p) => hasPermission(p));
    },
    [isSuperAdmin, isManager, hasPermission]
  );

  const openEditModal = useCallback(() => setIsEditModalOpen(true), []);
  const closeEditModal = useCallback(() => setIsEditModalOpen(false), []);

  const switchEnterprise = useCallback(
    async (enterpriseId: string) => {
      try {
        const res = await fetch("/api/enterprise/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enterpriseId }),
        });
        if (res.ok) {
          const target = enterprises.find((e) => e.id === enterpriseId);
          if (target) {
            router.push(`/${target.slug}`);
          } else {
            await fetchContext();
          }
        }
      } catch (e) {
        console.error("Failed to switch enterprise", e);
      }
    },
    [enterprises, fetchContext, router]
  );

  const contextValue = React.useMemo<WorkspaceContextValue>(
    () => ({
      user,
      activeEnterprise,
      activeMembership,
      enterprises,
      isLoading,
      isManager,
      isSuperAdmin,
      canEditWorkspace,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      effectivePermissions,
      isEditModalOpen,
      setIsEditModalOpen,
      openEditModal,
      closeEditModal,
      refreshContext: fetchContext,
      switchEnterprise,
      targetSlug: slug,
    }),
    [
      user,
      activeEnterprise,
      activeMembership,
      enterprises,
      isLoading,
      isManager,
      isSuperAdmin,
      canEditWorkspace,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      effectivePermissions,
      isEditModalOpen,
      openEditModal,
      closeEditModal,
      fetchContext,
      switchEnterprise,
      slug,
    ]
  );

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
}

