export type PermissionCategory =
  | 'enterprise'
  | 'access_control'
  | 'stock'
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

  // Stock & Inventory Operations
  {
    code: 'stock:view',
    name: 'View Inventory & Stock',
    category: 'stock',
    description: 'Inspect stock levels, SKU catalogs, bin locations, and inventory summaries',
  },
  {
    code: 'stock:receive',
    name: 'Receive Stock',
    category: 'stock',
    description: 'Record inbound goods receipts and increase stock quantities across warehouses',
  },
  {
    code: 'stock:transfer',
    name: 'Transfer Stock',
    category: 'stock',
    description: 'Move stock quantities between warehouses, zones, or internal bin locations',
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
    description: 'Conduct cycle counts, perform full physical inventory audits, and approve reconciliations',
  },

  // Reports & Analytics
  {
    code: 'reports:view',
    name: 'View Reports',
    category: 'reports',
    description: 'Access inventory analytics, stock valuation, and stock movement transaction reports',
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
  | 'stock:view'
  | 'stock:receive'
  | 'stock:transfer'
  | 'stock:adjust'
  | 'stock:audit'
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
 * Includes enterprise management, permission granting, and inventory operations.
 */
export const MANAGER_DEFAULT_PERMISSIONS: PermissionCode[] = [
  'enterprise:create',
  'enterprise:manage',
  'permissions:grant',
  'users:manage',
  'stock:view',
  'stock:receive',
  'stock:transfer',
  'stock:adjust',
  'stock:audit',
  'reports:view',
];

/**
 * Regular User default permissions.
 * Strictly zero permissions granted until assigned by an Enterprise Manager.
 */
export const USER_DEFAULT_PERMISSIONS: PermissionCode[] = [];
