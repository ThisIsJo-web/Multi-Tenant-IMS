export interface WalkthroughStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  badge?: string;
}

export const WORKSPACE_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "topbar-brand-key",
    targetSelector: '[data-tour="workspace-header"]',
    title: "Enterprise Identity & Access Key",
    description:
      "This is your active Enterprise Workspace shell. Here you can see your Enterprise name, URL slug, and unique Enterprise Key. Managers can copy or rotate the key anytime to control staff access.",
    position: "bottom",
    badge: "Core Security",
  },
  {
    id: "topbar-role-perms",
    targetSelector: '[data-tour="workspace-permissions"]',
    title: "Scoped Role & Capabilities",
    description:
      "Your access is governed by scoped roles and dynamic permissions (e.g., stock:view, stock:receive, stock:transfer, stock:adjust). All inventory actions are audited against this role.",
    position: "bottom",
    badge: "Access Control",
  },
  {
    id: "dashboard-kpi-summary",
    targetSelector: '[data-tour="dashboard-metrics"]',
    title: "Live Bird's-Eye KPIs",
    description:
      "Track your inventory health in real-time: Total SKUs registered, total physical units on hand, reorder threshold alerts, and transactions executed today.",
    position: "bottom",
    badge: "Intelligence",
  },
  {
    id: "dashboard-sidebar-nav",
    targetSelector: '[data-tour="sidebar-nav"]',
    title: "Master Inventory Navigation",
    description:
      "Easily navigate between Master Products & Catalog, Warehouse Locations & Bins, Inbound/Transfer/Dispatch Operations, and the immutable Stock Ledger audit trail.",
    position: "right",
    badge: "Navigation",
  },
  {
    id: "dashboard-pos-launcher",
    targetSelector: '[data-tour="pos-launcher"]',
    title: "Dedicated POS Cashier Terminal",
    description:
      "Every Enterprise has its own full-featured Point of Sale (POS) system! Click here to launch the dedicated cashier terminal for storefront retail sales, barcode scanning, and instant stock deduction.",
    position: "right",
    badge: "New Feature",
  },
];

export const POS_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "pos-header-status",
    targetSelector: '[data-tour="pos-header"]',
    title: "Cashier Terminal & Live IMS Connection",
    description:
      "Welcome to your Enterprise POS Terminal! Notice the active register ID, cashier profile, and real-time connection status syncing directly to your central IMS database.",
    position: "bottom",
    badge: "Terminal Status",
  },
  {
    id: "pos-search-barcode",
    targetSelector: '[data-tour="pos-search-barcode"]',
    title: "Instant SKU & Barcode Scanner",
    description:
      "Quickly look up products by typing their name or SKU, or use a hardware barcode scanner to instantly drop items straight into the active sales ticket.",
    position: "bottom",
    badge: "Fast Entry",
  },
  {
    id: "pos-product-catalog",
    targetSelector: '[data-tour="pos-catalog"]',
    title: "Product Catalog & Live ATP Stock",
    description:
      "Browse enterprise products with live Available-to-Promise (ATP) inventory badges. The POS automatically guards against overselling out-of-stock items.",
    position: "right",
    badge: "Catalog & Stock",
  },
  {
    id: "pos-cart-lines",
    targetSelector: '[data-tour="pos-cart"]',
    title: "Active Sales Ticket & Quantity Controls",
    description:
      "Manage customer line items with instant quantity steppers, applied discounts, and automated sales tax calculation in real-time.",
    position: "left",
    badge: "Cart & Tender",
  },
  {
    id: "pos-checkout-btn",
    targetSelector: '[data-tour="pos-checkout"]',
    title: "Tender Drawer & Payment Methods",
    description:
      "Process transactions seamlessly using Cash (with instant change calculation), Credit/Debit Card, or Mobile QR pay.",
    position: "left",
    badge: "Checkout",
  },
  {
    id: "pos-exit-back",
    targetSelector: '[data-tour="pos-exit"]',
    title: "Live IMS Sync & Back-Office Switch",
    description:
      "Every completed sale automatically deducts warehouse stock and logs an immutable DISPATCH entry into your IMS Stock Ledger. You can switch back to the IMS Back-Office anytime.",
    position: "bottom",
    badge: "IMS Sync",
  },
];
