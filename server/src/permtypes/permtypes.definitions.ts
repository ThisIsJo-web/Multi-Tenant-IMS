export type PermissionCategory =
  | 'enterprise'
  | 'access_control'
  | 'locations'
  | 'products'
  | 'stock'
  | 'pos'
  | 'reports'
  | 'system';

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  category: PermissionCategory;
  description: string;
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Enterprise Management
  {
    code: 'enterprise:create',
    name: 'Create Enterprise',
    category: 'enterprise',
    description: 'Allows registering and provisioning a new enterprise workspace',
  },
  {
    code: 'enterprise:manage',
    name: 'Manage Enterprise',
    category: 'enterprise',
    description: 'Allows editing enterprise settings, details, and rotating access keys',
  },

  // Access Control & Memberships
  {
    code: 'permissions:grant',
    name: 'Grant & Manage Permissions',
    category: 'access_control',
    description: 'Review join requests and assign, update, or revoke staff member permissions',
  },
  {
    code: 'users:manage',
    name: 'Manage Users & Staff',
    category: 'access_control',
    description: 'Directly add, update roles, or remove members within the enterprise',
  },

  // Locations & Warehouse Map
  {
    code: 'locations:view',
    name: 'View Locations & Bins',
    category: 'locations',
    description: 'Inspect warehouse structure, zones, aisles, racks, shelves, and storage bins',
  },
  {
    code: 'locations:create',
    name: 'Add Locations & Bins',
    category: 'locations',
    description: 'Create new warehouse locations, aisles, racks, shelves, and storage bins',
  },
  {
    code: 'locations:delete',
    name: 'Delete Locations',
    category: 'locations',
    description: 'Remove warehouse locations and storage bins from the map',
  },

  // Products & Catalog
  {
    code: 'products:view',
    name: 'View Products',
    category: 'products',
    description: 'Inspect SKU catalog, inventory balances, and product information',
  },
  {
    code: 'products:create',
    name: 'Add Products',
    category: 'products',
    description: 'Register and create new products, SKUs, and initial items in the catalog',
  },
  {
    code: 'products:edit',
    name: 'Edit Products',
    category: 'products',
    description: 'Modify product specifications, base units, and reorder thresholds',
  },
  {
    code: 'products:delete',
    name: 'Delete Products',
    category: 'products',
    description: 'Remove or archive items from the product catalog',
  },

  // Stock & Inventory Operations
  {
    code: 'stock:view',
    name: 'View Inventory & Stock',
    category: 'stock',
    description: 'Inspect overall stock levels, SKU catalogs, bin locations, and inventory summaries',
  },
  {
    code: 'stock:receive',
    name: 'Receive Stock',
    category: 'stock',
    description: 'Record inbound goods receipts and increase stock quantities across warehouses',
  },
  {
    code: 'stock:transfer',
    name: 'Transfer & Dispatch Stock',
    category: 'stock',
    description: 'Move stock quantities between warehouses/bins and dispatch outbound items',
  },
  {
    code: 'stock:adjust',
    name: 'Adjust Stock',
    category: 'stock',
    description: 'Perform manual quantity adjustments for shrinkage, damage, or recount corrections',
  },
  {
    code: 'stock:audit',
    name: 'Audit Stock',
    category: 'stock',
    description: 'Conduct cycle counts, perform physical inventory audits, and approve reconciliations',
  },

  // Point of Sale (POS)
  {
    code: 'pos:access',
    name: 'Point of Sale (POS) Terminal',
    category: 'pos',
    description: 'Access cashier terminal, scan barcodes, and process customer checkout transactions',
  },

  // Reports & Analytics
  {
    code: 'reports:view',
    name: 'View Reports & Ledger',
    category: 'reports',
    description: 'Access inventory analytics, stock valuation, and stock movement transaction logs',
  },
  {
    code: 'reports:export',
    name: 'Export Reports',
    category: 'reports',
    description: 'Export transaction histories, stock valuations, and audit logs to CSV or PDF',
  },

  // System Administration
  {
    code: 'system:manage',
    name: 'System Administration',
    category: 'system',
    description: 'SuperAdmin-level global platform administration and user role governance',
  },
];

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

/**
 * Superadmin has ALL system permissions granted (god-mode).
 */
export const SUPERADMIN_PERMISSIONS: PermissionCode[] = SYSTEM_PERMISSIONS.map(
  (p) => p.code as PermissionCode,
);

/**
 * Manager default permissions within their enterprise.
 * Includes enterprise management, permission granting, and all inventory/catalog/location operations.
 */
export const MANAGER_DEFAULT_PERMISSIONS: PermissionCode[] = [
  'enterprise:create',
  'enterprise:manage',
  'permissions:grant',
  'users:manage',
  'locations:view',
  'locations:create',
  'locations:delete',
  'products:view',
  'products:create',
  'products:edit',
  'products:delete',
  'stock:view',
  'stock:receive',
  'stock:transfer',
  'stock:adjust',
  'stock:audit',
  'pos:access',
  'reports:view',
  'reports:export',
];

/**
 * Regular User default permissions.
 * Strictly zero permissions granted until assigned by an Enterprise Manager.
 */
export const USER_DEFAULT_PERMISSIONS: PermissionCode[] = [];
