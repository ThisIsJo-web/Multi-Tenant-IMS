import React from "react";
import { Boxes, Store, Briefcase, ShieldCheck, Package, Receipt, Users, Server } from "lucide-react";

export type AppId = "workspace" | "pos" | "manager" | "superadmin";

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  subtitle: string;
  isMaximized: boolean;
  isMinimized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

export interface AppMetaItem {
  label: string;
  module: string;
  icon: React.ReactNode;
  accentIcon: React.ReactNode;
  description: string;
  subItems: string[];
  defaultW: number;
  defaultH: number;
  tag?: string;
}

export const APP_META: Record<AppId, AppMetaItem> = {
  workspace: {
    label: "Inventory Management",
    module: "IMS · Core",
    icon: React.createElement(Boxes, { className: "w-5 h-5" }),
    accentIcon: React.createElement(Package, { className: "w-5 h-5" }),
    description:
      "Real-time multi-location stock control, product catalog, warehouse hierarchy, and immutable audit ledger.",
    subItems: ["Products", "Locations", "Operations", "Ledger"],
    defaultW: 1200,
    defaultH: 740,
  },
  pos: {
    label: "Point of Sale",
    module: "IMS · POS",
    icon: React.createElement(Store, { className: "w-5 h-5" }),
    accentIcon: React.createElement(Receipt, { className: "w-5 h-5" }),
    description:
      "Frontline cashier terminal with barcode scan, cart management, payment processing and real-time stock deduction.",
    subItems: ["Cashier Terminal", "Sales Ledger", "Location Dispatch"],
    defaultW: 1120,
    defaultH: 720,
    tag: "LIVE",
  },
  manager: {
    label: "Manager Portal",
    module: "IMS · Admin",
    icon: React.createElement(Briefcase, { className: "w-5 h-5" }),
    accentIcon: React.createElement(Users, { className: "w-5 h-5" }),
    description:
      "Staff lifecycle management, granular permission assignment, enterprise key rotation, and POS configuration.",
    subItems: ["Staff", "Permissions", "Enterprise Settings"],
    defaultW: 1040,
    defaultH: 720,
  },
  superadmin: {
    label: "Platform Console",
    module: "IMS · SuperAdmin",
    icon: React.createElement(ShieldCheck, { className: "w-5 h-5" }),
    accentIcon: React.createElement(Server, { className: "w-5 h-5" }),
    description:
      "Platform-wide user management, manager application reviews, enterprise provisioning and system oversight.",
    subItems: ["Applications", "Users", "All Enterprises"],
    defaultW: 1040,
    defaultH: 720,
    tag: "RESTRICTED",
  },
};
