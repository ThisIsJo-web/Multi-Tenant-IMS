export type TrackingMode = 'Standard' | 'Batch / Expiry' | 'Serialized';
export type BaseUnit = 'Piece' | 'Kg' | 'Liter' | 'Meter' | 'Box';
export type ProductStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface ProductItem {
  sku: string;
  name: string;
  baseUnit: BaseUnit;
  trackingMode: TrackingMode;
  reorderThreshold: number;
  onHand: number;
  reserved: number;
  availableStock: number; // Available to Promise (ATP = onHand - reserved)
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export type LocationType =
  | 'Warehouse'
  | 'Receiving Bay'
  | 'Aisle'
  | 'Shelf'
  | 'Bin'
  | 'Vehicle'
  | 'Mobile Location'
  | 'Scrap Area'
  | 'Quarantine Area';

export interface WarehouseLocation {
  id: string;
  name: string;
  type: LocationType;
  parentId: string | null;
  code: string;
  itemCount: number;
  totalUnits: number;
  createdAt: string;
}

export type LedgerAction =
  | 'RECEIPT'
  | 'TRANSFER'
  | 'DISPATCH'
  | 'ADJUSTMENT'
  | 'RESERVATION'
  | 'RELEASE'
  | 'DAMAGE'
  | 'QUARANTINE'
  | 'AUDIT';

export interface StockLedgerRecord {
  id: string;
  enterpriseId: string;
  timestamp: string;
  sku: string;
  productName: string;
  action: LedgerAction;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  performedBy: string;
  performedByRole: string;
  reference: string;
  metadata?: Record<string, any>;
}

export interface DashboardSummary {
  totalSkus: number;
  totalStock: number;
  lowStockAlertsCount: number;
  movesToday: number;
  itemsNeedingReorder: ProductItem[];
  recentActivity: StockLedgerRecord[];
}

export interface ActiveEnterprise {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  enterpriseKey?: string;
  metadata?: Record<string, any> | null;
}

export interface ActiveMembership {
  role: 'manager' | 'staff';
  permissions: string[];
}

export interface UserContext {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'manager' | 'user';
  canCreateEnterprise: boolean;
}
