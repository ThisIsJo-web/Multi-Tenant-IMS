import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  BaseUnit,
  LocationType,
  ProductItem,
  ProductStatus,
  StockLedgerRecord,
  TrackingMode,
  WarehouseLocation,
} from './stock.types.js';

export interface StockItem {
  sku: string;
  name: string;
  quantity: number;
  location: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface StockAuditLog {
  id: string;
  enterpriseId: string;
  type: 'receive' | 'transfer' | 'adjust' | 'audit';
  sku: string;
  quantityChange: number;
  resultingQuantity: number;
  details: string;
  performedBy: string;
  timestamp: string;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. PRODUCTS & MASTER CATALOG
  // ==========================================

  async listProducts(enterpriseId: string): Promise<ProductItem[]> {
    const products = await this.prisma.product.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => ({
      sku: p.sku,
      name: p.name,
      baseUnit: p.baseUnit as BaseUnit,
      trackingMode: p.trackingMode as TrackingMode,
      reorderThreshold: p.reorderThreshold,
      onHand: p.onHand,
      reserved: p.reserved,
      availableStock: p.availableStock,
      status: p.status as ProductStatus,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  async getProductBySku(
    enterpriseId: string,
    sku: string,
  ): Promise<{
    product: ProductItem;
    locationBreakdown: Array<{ locationId: string; locationName: string; quantity: number }>;
    history: StockLedgerRecord[];
  }> {
    const p = await this.prisma.product.findUnique({
      where: {
        enterpriseId_sku: { enterpriseId, sku },
      },
    });

    if (!p) {
      throw new NotFoundException(`Product with SKU "${sku}" not found in this enterprise`);
    }

    const balances = await this.prisma.locationBalance.findMany({
      where: {
        enterpriseId,
        productId: p.id,
        quantity: { gt: 0 },
      },
      include: {
        location: true,
      },
    });

    const locationBreakdown = balances.map((b) => ({
      locationId: b.locationId,
      locationName: b.location.name,
      quantity: b.quantity,
    }));

    const ledgerRecords = await this.prisma.stockLedgerEntry.findMany({
      where: { enterpriseId, sku },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const history: StockLedgerRecord[] = ledgerRecords.map((l) => ({
      id: l.id,
      enterpriseId: l.enterpriseId,
      timestamp: l.createdAt.toISOString(),
      sku: l.sku,
      productName: l.productName,
      action: l.action as any,
      quantity: l.quantity,
      fromLocation: l.fromLocation,
      toLocation: l.toLocation,
      performedBy: l.performedBy,
      performedByRole: l.performedByRole,
      reference: l.reference || '',
      metadata: (l.metadata as any) || undefined,
    }));

    return {
      product: {
        sku: p.sku,
        name: p.name,
        baseUnit: p.baseUnit as BaseUnit,
        trackingMode: p.trackingMode as TrackingMode,
        reorderThreshold: p.reorderThreshold,
        onHand: p.onHand,
        reserved: p.reserved,
        availableStock: p.availableStock,
        status: p.status as ProductStatus,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      },
      locationBreakdown,
      history,
    };
  }

  async createProduct(
    enterpriseId: string,
    data: {
      sku: string;
      name: string;
      baseUnit?: BaseUnit;
      trackingMode?: TrackingMode;
      reorderThreshold?: number;
      initialLocationId?: string;
      initialQuantity?: number;
    },
    performedBy = 'System',
    performedByRole = 'staff',
  ): Promise<ProductItem> {
    const sku = data.sku.trim().toUpperCase();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { enterpriseId_sku: { enterpriseId, sku } },
      });

      if (existing) {
        throw new ConflictException(`Product with SKU "${sku}" already exists in this enterprise`);
      }

      const initQty = Math.max(0, Number(data.initialQuantity) || 0);
      const reorder = Math.max(0, Number(data.reorderThreshold) || 10);
      const available = initQty;

      let status: ProductStatus = 'In Stock';
      if (available <= 0) {
        status = 'Out of Stock';
      } else if (available <= reorder) {
        status = 'Low Stock';
      }

      const created = await tx.product.create({
        data: {
          enterpriseId,
          sku,
          name: data.name.trim(),
          baseUnit: data.baseUnit || 'Piece',
          trackingMode: data.trackingMode || 'Standard',
          reorderThreshold: reorder,
          onHand: initQty,
          reserved: 0,
          availableStock: available,
          status,
        },
      });

      if (initQty > 0 && data.initialLocationId) {
        const loc = await tx.warehouseLocation.findUnique({
          where: { id: data.initialLocationId },
        });

        if (loc && loc.enterpriseId === enterpriseId) {
          await tx.locationBalance.create({
            data: {
              enterpriseId,
              productId: created.id,
              locationId: loc.id,
              quantity: initQty,
            },
          });

          await tx.stockLedgerEntry.create({
            data: {
              enterpriseId,
              productId: created.id,
              sku,
              productName: created.name,
              action: 'RECEIPT',
              quantity: initQty,
              fromLocation: 'Initial Balance Setup',
              toLocation: loc.name,
              performedBy,
              performedByRole,
              reference: 'INIT-SETUP',
            },
          });
        }
      }

      return {
        sku: created.sku,
        name: created.name,
        baseUnit: created.baseUnit as BaseUnit,
        trackingMode: created.trackingMode as TrackingMode,
        reorderThreshold: created.reorderThreshold,
        onHand: created.onHand,
        reserved: created.reserved,
        availableStock: created.availableStock,
        status: created.status as ProductStatus,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    });
  }

  async updateProduct(
    enterpriseId: string,
    sku: string,
    data: {
      name?: string;
      baseUnit?: BaseUnit;
      trackingMode?: TrackingMode;
      reorderThreshold?: number;
      reserved?: number;
    },
  ): Promise<ProductItem> {
    const existing = await this.prisma.product.findUnique({
      where: { enterpriseId_sku: { enterpriseId, sku } },
    });

    if (!existing) {
      throw new NotFoundException(`Product SKU "${sku}" not found`);
    }

    const reserved = data.reserved !== undefined ? Math.max(0, Number(data.reserved)) : existing.reserved;
    const reorderThreshold =
      data.reorderThreshold !== undefined ? Math.max(0, Number(data.reorderThreshold)) : existing.reorderThreshold;
    const availableStock = Math.max(0, existing.onHand - reserved);

    let status: ProductStatus = 'In Stock';
    if (availableStock <= 0) {
      status = 'Out of Stock';
    } else if (availableStock <= reorderThreshold) {
      status = 'Low Stock';
    }

    const updated = await this.prisma.product.update({
      where: { id: existing.id },
      data: {
        name: data.name ? data.name.trim() : existing.name,
        baseUnit: data.baseUnit || existing.baseUnit,
        trackingMode: data.trackingMode || existing.trackingMode,
        reorderThreshold,
        reserved,
        availableStock,
        status,
      },
    });

    return {
      sku: updated.sku,
      name: updated.name,
      baseUnit: updated.baseUnit as BaseUnit,
      trackingMode: updated.trackingMode as TrackingMode,
      reorderThreshold: updated.reorderThreshold,
      onHand: updated.onHand,
      reserved: updated.reserved,
      availableStock: updated.availableStock,
      status: updated.status as ProductStatus,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteProduct(enterpriseId: string, sku: string): Promise<{ message: string }> {
    const product = await this.prisma.product.findUnique({
      where: { enterpriseId_sku: { enterpriseId, sku } },
    });

    if (!product) {
      throw new NotFoundException(`Product SKU "${sku}" not found`);
    }

    await this.prisma.product.delete({ where: { id: product.id } });
    return { message: `Product ${sku} deleted successfully` };
  }

  // ==========================================
  // 2. LOCATIONS & BINS
  // ==========================================

  async listLocations(enterpriseId: string): Promise<WarehouseLocation[]> {
    const locations = await this.prisma.warehouseLocation.findMany({
      where: { enterpriseId },
      include: {
        balances: {
          where: { quantity: { gt: 0 } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return locations.map((loc) => {
      let totalUnits = 0;
      let itemCount = loc.balances.length;
      for (const b of loc.balances) {
        totalUnits += b.quantity;
      }

      return {
        id: loc.id,
        name: loc.name,
        type: loc.type as LocationType,
        parentId: loc.parentId,
        code: loc.code,
        itemCount,
        totalUnits,
        createdAt: loc.createdAt.toISOString(),
      };
    });
  }

  async createLocation(
    enterpriseId: string,
    data: {
      name: string;
      type: LocationType;
      parentId?: string | null;
      code?: string;
    },
  ): Promise<WarehouseLocation> {
    const code = data.code?.trim().toUpperCase() || `LOC-${Date.now().toString().slice(-4)}`;

    const existing = await this.prisma.warehouseLocation.findUnique({
      where: { enterpriseId_code: { enterpriseId, code } },
    });

    if (existing) {
      throw new ConflictException(`Location code "${code}" already exists in this enterprise`);
    }

    const loc = await this.prisma.warehouseLocation.create({
      data: {
        enterpriseId,
        name: data.name.trim(),
        type: data.type,
        parentId: data.parentId || null,
        code,
      },
    });

    return {
      id: loc.id,
      name: loc.name,
      type: loc.type as LocationType,
      parentId: loc.parentId,
      code: loc.code,
      itemCount: 0,
      totalUnits: 0,
      createdAt: loc.createdAt.toISOString(),
    };
  }

  async deleteLocation(enterpriseId: string, locationId: string): Promise<{ message: string }> {
    const loc = await this.prisma.warehouseLocation.findUnique({
      where: { id: locationId },
      include: {
        balances: {
          where: { quantity: { gt: 0 } },
        },
      },
    });

    if (!loc || loc.enterpriseId !== enterpriseId) {
      throw new NotFoundException(`Location ID "${locationId}" not found in this enterprise`);
    }

    const totalStock = loc.balances.reduce((acc, b) => acc + b.quantity, 0);
    if (totalStock > 0) {
      throw new BadRequestException(
        `Cannot delete location with ${totalStock} active units remaining. Transfer stock out first.`,
      );
    }

    await this.prisma.warehouseLocation.delete({ where: { id: locationId } });
    return { message: 'Location deleted successfully' };
  }

  // ==========================================
  // 3. INVENTORY OPERATIONS (RECEIVE, TRANSFER, DISPATCH)
  // ==========================================

  async receiveStockBlueprint(
    enterpriseId: string,
    userId: string,
    userName: string,
    userRole: string,
    data: {
      sku: string;
      destinationLocationId: string;
      quantity: number;
      reference?: string;
    },
  ): Promise<{ product: ProductItem; ledger: StockLedgerRecord }> {
    const qty = Number(data.quantity);
    if (!data.sku || qty <= 0) {
      throw new BadRequestException('Valid SKU and positive quantity required');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { enterpriseId_sku: { enterpriseId, sku: data.sku } },
      });

      if (!product) {
        throw new NotFoundException(`Product SKU "${data.sku}" not found in enterprise catalog`);
      }

      const location = await tx.warehouseLocation.findUnique({
        where: { id: data.destinationLocationId },
      });

      if (!location || location.enterpriseId !== enterpriseId) {
        throw new NotFoundException(`Destination location "${data.destinationLocationId}" not found`);
      }

      // 1. Update Product OnHand & ATP
      const newOnHand = product.onHand + qty;
      const newAvailable = Math.max(0, newOnHand - product.reserved);
      let status: ProductStatus = 'In Stock';
      if (newAvailable <= 0) status = 'Out of Stock';
      else if (newAvailable <= product.reorderThreshold) status = 'Low Stock';

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          onHand: newOnHand,
          availableStock: newAvailable,
          status,
        },
      });

      // 2. Upsert Location Balance
      await tx.locationBalance.upsert({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: location.id,
          },
        },
        update: {
          quantity: { increment: qty },
        },
        create: {
          enterpriseId,
          productId: product.id,
          locationId: location.id,
          quantity: qty,
        },
      });

      // 3. Insert Immutable Stock Ledger Entry
      const ledger = await tx.stockLedgerEntry.create({
        data: {
          enterpriseId,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          action: 'RECEIPT',
          quantity: qty,
          fromLocation: data.reference ? `Supplier: ${data.reference}` : 'External Supplier',
          toLocation: location.name,
          performedBy: userName || userId,
          performedByRole: userRole || 'staff',
          reference: data.reference || `PO-${Date.now().toString().slice(-4)}`,
        },
      });

      return {
        product: {
          sku: updatedProduct.sku,
          name: updatedProduct.name,
          baseUnit: updatedProduct.baseUnit as BaseUnit,
          trackingMode: updatedProduct.trackingMode as TrackingMode,
          reorderThreshold: updatedProduct.reorderThreshold,
          onHand: updatedProduct.onHand,
          reserved: updatedProduct.reserved,
          availableStock: updatedProduct.availableStock,
          status: updatedProduct.status as ProductStatus,
          createdAt: updatedProduct.createdAt.toISOString(),
          updatedAt: updatedProduct.updatedAt.toISOString(),
        },
        ledger: {
          id: ledger.id,
          enterpriseId: ledger.enterpriseId,
          timestamp: ledger.createdAt.toISOString(),
          sku: ledger.sku,
          productName: ledger.productName,
          action: ledger.action as any,
          quantity: ledger.quantity,
          fromLocation: ledger.fromLocation,
          toLocation: ledger.toLocation,
          performedBy: ledger.performedBy,
          performedByRole: ledger.performedByRole,
          reference: ledger.reference || '',
        },
      };
    });
  }

  async transferStockBlueprint(
    enterpriseId: string,
    userId: string,
    userName: string,
    userRole: string,
    data: {
      sku: string;
      fromLocationId: string;
      toLocationId: string;
      quantity: number;
    },
  ): Promise<{ product: ProductItem; ledger: StockLedgerRecord }> {
    const qty = Number(data.quantity);
    if (!data.sku || qty <= 0) {
      throw new BadRequestException('Valid SKU and positive transfer quantity required');
    }

    if (data.fromLocationId === data.toLocationId) {
      throw new BadRequestException('Source and destination locations must be different');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { enterpriseId_sku: { enterpriseId, sku: data.sku } },
      });

      if (!product) {
        throw new NotFoundException(`Product SKU "${data.sku}" not found`);
      }

      const fromLoc = await tx.warehouseLocation.findUnique({ where: { id: data.fromLocationId } });
      const toLoc = await tx.warehouseLocation.findUnique({ where: { id: data.toLocationId } });

      if (!fromLoc || !toLoc || fromLoc.enterpriseId !== enterpriseId || toLoc.enterpriseId !== enterpriseId) {
        throw new NotFoundException('Both source and target locations must exist in this enterprise');
      }

      // Check source location balance
      const fromBalance = await tx.locationBalance.findUnique({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: fromLoc.id,
          },
        },
      });

      const currentFromQty = fromBalance?.quantity || 0;
      if (currentFromQty < qty) {
        throw new BadRequestException(
          `Insufficient stock at "${fromLoc.name}". Available: ${currentFromQty} units.`,
        );
      }

      // Deduct from source
      await tx.locationBalance.update({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: fromLoc.id,
          },
        },
        data: {
          quantity: { decrement: qty },
        },
      });

      // Add to destination
      await tx.locationBalance.upsert({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: toLoc.id,
          },
        },
        update: {
          quantity: { increment: qty },
        },
        create: {
          enterpriseId,
          productId: product.id,
          locationId: toLoc.id,
          quantity: qty,
        },
      });

      // Insert Ledger Record (Total product physical quantity does not change)
      const ledger = await tx.stockLedgerEntry.create({
        data: {
          enterpriseId,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          action: 'TRANSFER',
          quantity: qty,
          fromLocation: fromLoc.name,
          toLocation: toLoc.name,
          performedBy: userName || userId,
          performedByRole: userRole || 'staff',
          reference: `Move #${Math.floor(100 + Math.random() * 900)}`,
        },
      });

      return {
        product: {
          sku: product.sku,
          name: product.name,
          baseUnit: product.baseUnit as BaseUnit,
          trackingMode: product.trackingMode as TrackingMode,
          reorderThreshold: product.reorderThreshold,
          onHand: product.onHand,
          reserved: product.reserved,
          availableStock: product.availableStock,
          status: product.status as ProductStatus,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        },
        ledger: {
          id: ledger.id,
          enterpriseId: ledger.enterpriseId,
          timestamp: ledger.createdAt.toISOString(),
          sku: ledger.sku,
          productName: ledger.productName,
          action: ledger.action as any,
          quantity: ledger.quantity,
          fromLocation: ledger.fromLocation,
          toLocation: ledger.toLocation,
          performedBy: ledger.performedBy,
          performedByRole: ledger.performedByRole,
          reference: ledger.reference || '',
        },
      };
    });
  }

  async dispatchStockBlueprint(
    enterpriseId: string,
    userId: string,
    userName: string,
    userRole: string,
    data: {
      sku: string;
      fromLocationId: string;
      quantity: number;
      reference?: string;
    },
  ): Promise<{ product: ProductItem; ledger: StockLedgerRecord }> {
    const qty = Number(data.quantity);
    if (!data.sku || qty <= 0) {
      throw new BadRequestException('Valid SKU and positive dispatch quantity required');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { enterpriseId_sku: { enterpriseId, sku: data.sku } },
      });

      if (!product) {
        throw new NotFoundException(`Product SKU "${data.sku}" not found`);
      }

      const fromLoc = await tx.warehouseLocation.findUnique({ where: { id: data.fromLocationId } });
      if (!fromLoc || fromLoc.enterpriseId !== enterpriseId) {
        throw new NotFoundException(`Source location "${data.fromLocationId}" not found`);
      }

      const fromBalance = await tx.locationBalance.findUnique({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: fromLoc.id,
          },
        },
      });

      const currentFromQty = fromBalance?.quantity || 0;
      if (currentFromQty < qty) {
        throw new BadRequestException(
          `Insufficient stock at "${fromLoc.name}". Available: ${currentFromQty} units.`,
        );
      }

      // Deduct from location
      await tx.locationBalance.update({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: fromLoc.id,
          },
        },
        data: {
          quantity: { decrement: qty },
        },
      });

      // Deduct from product physical total
      const newOnHand = Math.max(0, product.onHand - qty);
      const newAvailable = Math.max(0, newOnHand - product.reserved);
      let status: ProductStatus = 'In Stock';
      if (newAvailable <= 0) status = 'Out of Stock';
      else if (newAvailable <= product.reorderThreshold) status = 'Low Stock';

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          onHand: newOnHand,
          availableStock: newAvailable,
          status,
        },
      });

      // Insert Ledger Entry
      const ledger = await tx.stockLedgerEntry.create({
        data: {
          enterpriseId,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          action: 'DISPATCH',
          quantity: -qty,
          fromLocation: fromLoc.name,
          toLocation: data.reference ? `Customer: ${data.reference}` : 'External Destination',
          performedBy: userName || userId,
          performedByRole: userRole || 'staff',
          reference: data.reference || `INV-${Date.now().toString().slice(-4)}`,
        },
      });

      return {
        product: {
          sku: updatedProduct.sku,
          name: updatedProduct.name,
          baseUnit: updatedProduct.baseUnit as BaseUnit,
          trackingMode: updatedProduct.trackingMode as TrackingMode,
          reorderThreshold: updatedProduct.reorderThreshold,
          onHand: updatedProduct.onHand,
          reserved: updatedProduct.reserved,
          availableStock: updatedProduct.availableStock,
          status: updatedProduct.status as ProductStatus,
          createdAt: updatedProduct.createdAt.toISOString(),
          updatedAt: updatedProduct.updatedAt.toISOString(),
        },
        ledger: {
          id: ledger.id,
          enterpriseId: ledger.enterpriseId,
          timestamp: ledger.createdAt.toISOString(),
          sku: ledger.sku,
          productName: ledger.productName,
          action: ledger.action as any,
          quantity: ledger.quantity,
          fromLocation: ledger.fromLocation,
          toLocation: ledger.toLocation,
          performedBy: ledger.performedBy,
          performedByRole: ledger.performedByRole,
          reference: ledger.reference || '',
        },
      };
    });
  }

  // ==========================================
  // 4. STOCK LEDGER AUDIT STATEMENT
  // ==========================================

  async getLedger(
    enterpriseId: string,
    filters?: {
      sku?: string;
      action?: string;
      location?: string;
      search?: string;
    },
  ): Promise<StockLedgerRecord[]> {
    const where: any = { enterpriseId };

    if (filters?.sku) {
      where.sku = filters.sku;
    }
    if (filters?.action && filters.action !== 'ALL') {
      where.action = filters.action;
    }
    if (filters?.location) {
      where.OR = [
        { fromLocation: { contains: filters.location, mode: 'insensitive' } },
        { toLocation: { contains: filters.location, mode: 'insensitive' } },
      ];
    }
    if (filters?.search) {
      const q = filters.search;
      where.OR = [
        { sku: { contains: q, mode: 'insensitive' } },
        { productName: { contains: q, mode: 'insensitive' } },
        { reference: { contains: q, mode: 'insensitive' } },
        { performedBy: { contains: q, mode: 'insensitive' } },
      ];
    }

    const records = await this.prisma.stockLedgerEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return records.map((l) => ({
      id: l.id,
      enterpriseId: l.enterpriseId,
      timestamp: l.createdAt.toISOString(),
      sku: l.sku,
      productName: l.productName,
      action: l.action as any,
      quantity: l.quantity,
      fromLocation: l.fromLocation,
      toLocation: l.toLocation,
      performedBy: l.performedBy,
      performedByRole: l.performedByRole,
      reference: l.reference || '',
      metadata: (l.metadata as any) || undefined,
    }));
  }

  // ==========================================
  // 5. DASHBOARD BIRD'S-EYE VIEW SUMMARY
  // ==========================================

  async getDashboardSummary(enterpriseId: string) {
    const products = await this.listProducts(enterpriseId);

    let totalStock = 0;
    const lowStockItems: ProductItem[] = [];

    for (const p of products) {
      totalStock += p.onHand;
      if (p.availableStock <= p.reorderThreshold) {
        lowStockItems.push(p);
      }
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const movesToday = await this.prisma.stockLedgerEntry.count({
      where: {
        enterpriseId,
        createdAt: { gte: startOfToday },
      },
    });

    const recentActivity = await this.getLedger(enterpriseId);

    return {
      totalSkus: products.length,
      totalStock,
      lowStockAlertsCount: lowStockItems.length,
      movesToday,
      itemsNeedingReorder: lowStockItems,
      recentActivity: recentActivity.slice(0, 10),
    };
  }

  // ==========================================
  // 6. BACKWARD COMPATIBILITY HELPERS
  // ==========================================

  async listStock(enterpriseId: string): Promise<StockItem[]> {
    const products = await this.listProducts(enterpriseId);
    return products.map((p) => ({
      sku: p.sku,
      name: p.name,
      quantity: p.onHand,
      location: 'Primary Storage',
      lastUpdated: p.updatedAt,
      updatedBy: 'System',
    }));
  }

  async receiveStock(
    enterpriseId: string,
    userId: string,
    data: { sku: string; name?: string; quantity: number; location?: string },
  ) {
    const locations = await this.listLocations(enterpriseId);
    let destLoc = locations[0]?.id;
    if (!destLoc) {
      const createdLoc = await this.createLocation(enterpriseId, {
        name: data.location || 'Receiving Dock',
        type: 'Receiving Bay',
        code: 'BAY-REC',
      });
      destLoc = createdLoc.id;
    }

    let product = await this.prisma.product.findUnique({
      where: { enterpriseId_sku: { enterpriseId, sku: data.sku } },
    });

    if (!product) {
      await this.createProduct(enterpriseId, {
        sku: data.sku,
        name: data.name || `Item ${data.sku}`,
        initialQuantity: 0,
      });
    }

    const { product: updated, ledger } = await this.receiveStockBlueprint(
      enterpriseId,
      userId,
      'User',
      'staff',
      {
        sku: data.sku,
        destinationLocationId: destLoc,
        quantity: data.quantity,
      },
    );

    return {
      item: {
        sku: updated.sku,
        name: updated.name,
        quantity: updated.onHand,
        location: destLoc,
        lastUpdated: updated.updatedAt,
        updatedBy: userId,
      },
      log: {
        id: ledger.id,
        enterpriseId,
        type: 'receive' as const,
        sku: data.sku,
        quantityChange: data.quantity,
        resultingQuantity: updated.onHand,
        details: `Received +${data.quantity} units`,
        performedBy: userId,
        timestamp: ledger.timestamp,
      },
    };
  }

  async transferStock(
    enterpriseId: string,
    userId: string,
    data: { sku: string; fromLocation: string; toLocation: string; quantity: number },
  ) {
    const locations = await this.listLocations(enterpriseId);
    const from = locations.find((l) => l.name === data.fromLocation)?.id || locations[0]?.id;
    const to = locations.find((l) => l.name === data.toLocation)?.id || locations[1]?.id;

    if (!from || !to) {
      throw new BadRequestException('Source and target locations must exist');
    }

    const { product, ledger } = await this.transferStockBlueprint(enterpriseId, userId, 'User', 'staff', {
      sku: data.sku,
      fromLocationId: from,
      toLocationId: to,
      quantity: data.quantity,
    });

    return {
      item: {
        sku: product.sku,
        name: product.name,
        quantity: product.onHand,
        location: data.toLocation,
        lastUpdated: product.updatedAt,
        updatedBy: userId,
      },
      log: {
        id: ledger.id,
        enterpriseId,
        type: 'transfer' as const,
        sku: data.sku,
        quantityChange: 0,
        resultingQuantity: product.onHand,
        details: `Transferred ${data.quantity} units`,
        performedBy: userId,
        timestamp: ledger.timestamp,
      },
    };
  }

  async adjustStock(
    enterpriseId: string,
    userId: string,
    data: { sku: string; adjustment: number; reason: string },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { enterpriseId_sku: { enterpriseId, sku: data.sku } },
    });

    if (!product) throw new NotFoundException(`SKU ${data.sku} not found`);

    const newOnHand = Math.max(0, product.onHand + data.adjustment);
    const newAvailable = Math.max(0, newOnHand - product.reserved);
    let status: ProductStatus = 'In Stock';
    if (newAvailable <= 0) status = 'Out of Stock';
    else if (newAvailable <= product.reorderThreshold) status = 'Low Stock';

    const updated = await this.prisma.product.update({
      where: { id: product.id },
      data: {
        onHand: newOnHand,
        availableStock: newAvailable,
        status,
      },
    });

    const ledger = await this.prisma.stockLedgerEntry.create({
      data: {
        enterpriseId,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        action: 'ADJUSTMENT',
        quantity: data.adjustment,
        fromLocation: 'Inventory Count Adjust',
        toLocation: 'Adjustment Ledger',
        performedBy: userId,
        performedByRole: 'manager',
        reference: data.reason || 'Manual Adjustment',
      },
    });

    return {
      item: {
        sku: updated.sku,
        name: updated.name,
        quantity: updated.onHand,
        location: 'Primary Storage',
        lastUpdated: updated.updatedAt.toISOString(),
        updatedBy: userId,
      },
      log: {
        id: ledger.id,
        enterpriseId,
        type: 'adjust' as const,
        sku: data.sku,
        quantityChange: data.adjustment,
        resultingQuantity: updated.onHand,
        details: data.reason,
        performedBy: userId,
        timestamp: ledger.createdAt.toISOString(),
      },
    };
  }

  async auditStock(
    enterpriseId: string,
    userId: string,
    data: { sku: string; countedQuantity: number; notes: string },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { enterpriseId_sku: { enterpriseId, sku: data.sku } },
    });

    if (!product) throw new NotFoundException(`SKU ${data.sku} not found`);

    const discrepancy = data.countedQuantity - product.onHand;
    const newAvailable = Math.max(0, data.countedQuantity - product.reserved);

    const updated = await this.prisma.product.update({
      where: { id: product.id },
      data: {
        onHand: data.countedQuantity,
        availableStock: newAvailable,
        status: newAvailable <= product.reorderThreshold ? 'Low Stock' : 'In Stock',
      },
    });

    const ledger = await this.prisma.stockLedgerEntry.create({
      data: {
        enterpriseId,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        action: 'AUDIT',
        quantity: discrepancy,
        fromLocation: 'Cycle Count',
        toLocation: 'Audit Reconciliation',
        performedBy: userId,
        performedByRole: 'manager',
        reference: data.notes || 'Cycle Count Audit',
      },
    });

    return {
      item: {
        sku: updated.sku,
        name: updated.name,
        quantity: updated.onHand,
        location: 'Primary Storage',
        lastUpdated: updated.updatedAt.toISOString(),
        updatedBy: userId,
      },
      discrepancy,
      log: {
        id: ledger.id,
        enterpriseId,
        type: 'audit' as const,
        sku: data.sku,
        quantityChange: discrepancy,
        resultingQuantity: updated.onHand,
        details: data.notes,
        performedBy: userId,
        timestamp: ledger.createdAt.toISOString(),
      },
    };
  }

  async getAuditLogs(enterpriseId: string): Promise<StockAuditLog[]> {
    const entries = await this.prisma.stockLedgerEntry.findMany({
      where: { enterpriseId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return entries.map((e) => ({
      id: e.id,
      enterpriseId: e.enterpriseId,
      type: e.action.toLowerCase() as any,
      sku: e.sku,
      quantityChange: e.quantity,
      resultingQuantity: 0,
      details: `${e.action}: ${e.fromLocation} -> ${e.toLocation}`,
      performedBy: e.performedBy,
      timestamp: e.createdAt.toISOString(),
    }));
  }
}
