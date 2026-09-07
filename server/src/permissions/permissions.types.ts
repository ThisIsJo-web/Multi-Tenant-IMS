export type PermissionCategory =
  | 'Enterprise'
  | 'Access Control'
  | 'Inventory / Stock'
  | 'Reports & Analytics'
  | 'System';

export interface PermissionDefinition {
  code: string;
  name: string;
  category: PermissionCategory;
  description: string;
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Enterprise
  {
    code: 'enterprise:create',
    name: 'Create Enterprise',
    category: 'Enterprise',
    description: 'Create and initialize a new enterprise tenant organization',
  },
  {
    code: 'enterprise:manage',
    name: 'Manage Enterprise',
    category: 'Enterprise',
    description: 'Update enterprise metadata, branding, settings, and rotate enterprise keys',
  },
  {
    code: 'enterprise:view',
    name: 'View Enterprise',
    category: 'Enterprise',
    description: 'View enterprise details, profile, and basic membership list',
  },

  // Access Control / User Management
  {
    code: 'permissions:grant',
    name: 'Grant & Manage Permissions',
    category: 'Access Control',
    description: 'Review join requests and assign, update, or revoke staff member permissions',
  },

  // Inventory / Stock Operations
  {
    code: 'stock:view',
    name: 'View Inventory & Stock',
    category: 'Inventory / Stock',
    description: 'View warehouse stock counts, product catalog, SKU levels, and locations',
  },
  {
    code: 'stock:receive',
    name: 'Receive Inbound Stock',
    category: 'Inventory / Stock',
    description: 'Log and confirm inbound shipments, vendor purchase orders, and intake deliveries',
  },
  {
    code: 'stock:transfer',
    name: 'Transfer Stock',
    category: 'Inventory / Stock',
    description: 'Relocate inventory between warehouses, departments, or storage bins',
  },
  {
    code: 'stock:adjust',
    name: 'Adjust Stock Counts',
    category: 'Inventory / Stock',
    description: 'Reconcile stock discrepancies, log inventory write-offs, and report damages',
  },
  {
    code: 'stock:audit',
    name: 'Conduct Stock Audits',
    category: 'Inventory / Stock',
    description: 'Perform physical inventory audits and review historical inventory audit trails',
  },

  // Reports & Analytics
  {
    code: 'reports:view',
    name: 'View Reports',
    category: 'Reports & Analytics',
    description: 'Access inventory turnover metrics, stock level summaries, and activity reports',
  },
  {
    code: 'reports:export',
    name: 'Export Reports',
    category: 'Reports & Analytics',
    description: 'Download CSV and PDF exports of inventory and audit logs',
  },

  // Platform Administration
  {
    code: 'system:admin',
    name: 'SuperAdmin Platform Administration',
    category: 'System',
    description: 'Platform-wide administrator control, tenant provisioning, and managerial approvals',
  },
];

export type PermissionCode =
  | 'enterprise:create'
  | 'enterprise:manage'
  | 'enterprise:view'
  | 'permissions:grant'
  | 'stock:view'
  | 'stock:receive'
  | 'stock:transfer'
  | 'stock:adjust'
  | 'stock:audit'
  | 'reports:view'
  | 'reports:export'
  | 'system:admin';

/**
 * Superadmin has ALL system permissions granted.
 */
export const SUPERADMIN_PERMISSIONS: PermissionCode[] = SYSTEM_PERMISSIONS.map(
  (p) => p.code as PermissionCode,
);

/**
 * Manager default permissions within their enterprise.
 * Includes enterprise management, permission granting, and full inventory operations.
 */
export const MANAGER_DEFAULT_PERMISSIONS: PermissionCode[] = [
  'enterprise:create',
  'enterprise:manage',
  'enterprise:view',
  'permissions:grant',
  'stock:view',
  'stock:receive',
  'stock:transfer',
  'stock:adjust',
  'stock:audit',
  'reports:view',
  'reports:export',
];

/**
 * Regular User default permissions.
 * Zero permissions granted until assigned by a Manager.
 */
export const USER_DEFAULT_PERMISSIONS: PermissionCode[] = [];
