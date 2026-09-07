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
  availableStock: number; // ATP = onHand - reserved
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
  quantity: number; // + or -
  fromLocation: string;
  toLocation: string;
  performedBy: string;
  performedByRole: string;
  reference: string;
  metadata?: Record<string, any>;
}

export interface LocationBalance {
  sku: string;
  locationId: string;
  quantity: number;
}
