export type PermissionCategory =
  | 'enterprise'
  | 'access_control'
  | 'stock'
  | 'reports'
  | 'system';

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
    id: 'enterprise',
    name: 'Enterprise Management',
    description: 'Create and configure enterprises and workspace keys',
  },
  {
    id: 'access_control',
    name: 'Access Control & Staff',
    description: 'Grant permissions and manage team member memberships',
  },
  {
    id: 'stock',
    name: 'Inventory & Stock Operations',
    description: 'View, receive, transfer, adjust, and audit inventory items',
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'View and export inventory analytics and transaction records',
  },
  {
    id: 'system',
    name: 'System Administration',
    description: 'Full system-wide administrative controls',
  },
];

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
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
  {
    code: 'stock:view',
    name: 'View Stock',
    description: 'Allows inspecting inventory levels and SKU listings',
    category: 'stock',
  },
  {
    code: 'stock:receive',
    name: 'Receive Stock',
    description: 'Allows recording incoming inbound stock and shipments',
    category: 'stock',
  },
  {
    code: 'stock:transfer',
    name: 'Transfer Stock',
    description: 'Allows moving inventory between bins or locations',
    category: 'stock',
  },
  {
    code: 'stock:adjust',
    name: 'Adjust Stock',
    description: 'Allows manual quantity corrections and discrepancy adjustments',
    category: 'stock',
  },
  {
    code: 'stock:audit',
    name: 'Audit Stock',
    description: 'Allows running full physical inventory audits and count reconciliations',
    category: 'stock',
  },
  {
    code: 'reports:view',
    name: 'View Reports',
    description: 'Allows viewing stock movement and valuation reports',
    category: 'reports',
  },
  {
    code: 'reports:export',
    name: 'Export Reports',
    description: 'Allows exporting CSV/PDF audit and transaction logs',
    category: 'reports',
  },
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
