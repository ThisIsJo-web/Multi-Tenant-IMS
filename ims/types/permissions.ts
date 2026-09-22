export type PermissionCategory =
  | 'enterprise'
  | 'access_control'
  | 'locations'
  | 'products'
  | 'stock'
  | 'pos'
  | 'reports'
  | 'system';

export type PermissionCode =
  | 'enterprise:create'
  | 'enterprise:manage'
  | 'permissions:grant'
  | 'users:manage'
  | 'locations:view'
  | 'locations:create'
  | 'locations:delete'
  | 'products:view'
  | 'products:create'
  | 'products:edit'
  | 'products:delete'
  | 'stock:view'
  | 'stock:receive'
  | 'stock:transfer'
  | 'stock:adjust'
  | 'stock:audit'
  | 'pos:access'
  | 'reports:view'
  | 'reports:export'
  | 'system:manage';

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  description: string;
  category: PermissionCategory;
}

export const PERMISSION_CATEGORIES: {
  id: PermissionCategory;
  name: string;
  description: string;
}[] = [
  {
    id: 'locations',
    name: 'Warehouse & Locations',
    description: 'Structure, zones, aisles, racks, shelves, and storage bins',
  },
  {
    id: 'products',
    name: 'Products & Catalog',
    description: 'Product definitions, SKUs, thresholds, and catalog data',
  },
  {
    id: 'stock',
    name: 'Stock Movements & Counts',
    description: 'Inbound receipts, internal transfers, adjustments, and cycle audits',
  },
  {
    id: 'pos',
    name: 'Storefront Point of Sale',
    description: 'Cashier checkout terminal, barcode scanning, and instant sales dispatch',
  },
  {
    id: 'reports',
    name: 'Ledger & Analytics',
    description: 'Immutable movement ledger, transaction history, and CSV exports',
  },
  {
    id: 'access_control',
    name: 'Access Control & Staff',
    description: 'Grant permissions and manage team member memberships',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Management',
    description: 'Create and configure enterprises and workspace keys',
  },
  {
    id: 'system',
    name: 'System Administration',
    description: 'Full system-wide administrative controls',
  },
];

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Enterprise
  {
    code: 'enterprise:create',
    name: 'Create Enterprise',
    description: 'Allows registering a new enterprise workspace',
    category: 'enterprise',
  },
  {
    code: 'enterprise:manage',
    name: 'Manage Enterprise',
    description: 'Allows editing enterprise settings and rotating access keys',
    category: 'enterprise',
  },

  // Access Control
  {
    code: 'permissions:grant',
    name: 'Grant Permissions',
    description: 'Allows managers to assign or revoke permissions for members',
    category: 'access_control',
  },
  {
    code: 'users:manage',
    name: 'Manage Users',
    description: 'Allows managing users and membership invitations',
    category: 'access_control',
  },

  // Locations
  {
    code: 'locations:view',
    name: 'View Locations & Bins',
    description: 'Inspect warehouse layout, zones, aisles, shelves, and storage bins',
    category: 'locations',
  },
  {
    code: 'locations:create',
    name: 'Add Locations & Bins',
    description: 'Create new warehouse locations, aisles, racks, and storage bins',
    category: 'locations',
  },
  {
    code: 'locations:delete',
    name: 'Delete Locations',
    description: 'Remove warehouse locations and storage bins from the map',
    category: 'locations',
  },

  // Products
  {
    code: 'products:view',
    name: 'View Products',
    description: 'Inspect product listings, SKU details, and available stock',
    category: 'products',
  },
  {
    code: 'products:create',
    name: 'Add Products',
    description: 'Create new product entries and SKUs in the catalog',
    category: 'products',
  },
  {
    code: 'products:edit',
    name: 'Edit Products',
    description: 'Modify product specifications, base units, and reorder thresholds',
    category: 'products',
  },
  {
    code: 'products:delete',
    name: 'Delete Products',
    description: 'Delete or archive product catalog items',
    category: 'products',
  },

  // Stock Operations
  {
    code: 'stock:view',
    name: 'View Stock & Inventory',
    description: 'Inspect overall stock levels and inventory balances',
    category: 'stock',
  },
  {
    code: 'stock:receive',
    name: 'Receive Stock',
    description: 'Record incoming inbound stock and shipments',
    category: 'stock',
  },
  {
    code: 'stock:transfer',
    name: 'Transfer & Dispatch Stock',
    description: 'Move inventory between bins and dispatch outbound orders',
    category: 'stock',
  },
  {
    code: 'stock:adjust',
    name: 'Adjust Stock',
    description: 'Manual quantity corrections, damage, and shrinkage adjustments',
    category: 'stock',
  },
  {
    code: 'stock:audit',
    name: 'Audit Stock',
    description: 'Conduct cycle counts and physical inventory reconciliations',
    category: 'stock',
  },

  // POS
  {
    code: 'pos:access',
    name: 'Point of Sale (POS) Terminal',
    description: 'Access cashier terminal, scan items, and process sales checkouts',
    category: 'pos',
  },

  // Reports
  {
    code: 'reports:view',
    name: 'View Reports & Ledger',
    description: 'View stock movement ledger and inventory reports',
    category: 'reports',
  },
  {
    code: 'reports:export',
    name: 'Export Reports',
    description: 'Export CSV audit and transaction logs',
    category: 'reports',
  },

  // System
  {
    code: 'system:manage',
    name: 'System Admin',
    description: 'Superadmin-level system settings and platform governance',
    category: 'system',
  },
];

export const PERMISSION_MAP = new Map<PermissionCode, PermissionDefinition>(
  SYSTEM_PERMISSIONS.map((p) => [p.code, p]),
);

export const MANAGER_ASSIGNABLE_PERMISSIONS = SYSTEM_PERMISSIONS.filter(
  (p) => p.code !== 'system:manage',
);
