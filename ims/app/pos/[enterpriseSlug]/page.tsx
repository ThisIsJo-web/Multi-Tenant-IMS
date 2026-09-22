"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  ArrowLeft,
  RefreshCw,
  Store,
  CreditCard,
  Banknote,
  Package,
  MapPin,
  History,
  X,
  Lock,
  Settings,
  ShieldAlert,
} from "lucide-react";
import {
  GuidedWalkthrough,
  GuidedTourTrigger,
} from "@/components/walkthrough/guided-walkthrough";
import { POS_WALKTHROUGH_STEPS } from "@/components/walkthrough/walkthrough-steps";

interface PosProduct {
  sku: string;
  name: string;
  baseUnit: string;
  availableStock: number;
  onHand: number;
  price: number;
}

interface CartItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
  baseUnit: string;
}

interface WarehouseLocation {
  id: string;
  name: string;
  type: string;
  code?: string;
  capacity?: number;
}

export default function EnterprisePosPage() {
  const params = useParams();
  const router = useRouter();
  const enterpriseSlug = params.enterpriseSlug as string;

  // Context State
  const [activeEnterprise, setActiveEnterprise] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [membershipRole, setMembershipRole] = useState<string>("staff");
  const [permissions, setPermissions] = useState<string[]>([]);

  // Operational State
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");

  // Status & Modal States
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Relational IMS Ledger Modal
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Currency Formatter
  const currencyCode = activeEnterprise?.metadata?.currency || "USD";
  const formatPrice = (amount: number) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  };

  // Load Context
  useEffect(() => {
    const loadContext = async () => {
      try {
        const res = await fetch("/api/enterprise/context");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);

        const matched =
          data.enterprises?.find((e: any) => e.slug === enterpriseSlug) ||
          data.activeEnterprise;

        if (matched) {
          setActiveEnterprise(matched);
          setMembershipRole(data.activeMembership?.role || (data.user?.role === "superadmin" ? "superadmin" : "staff"));
          setPermissions(data.activeMembership?.permissions || []);
        } else {
          router.push("/workspace");
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    loadContext();
  }, [enterpriseSlug, router]);

  // Fetch live products & warehouse locations
  const fetchProducts = async () => {
    if (!activeEnterprise) return;
    try {
      const res = await fetch("/api/stock/products", {
        headers: { "x-enterprise-id": activeEnterprise.id },
      });
      if (res.ok) {
        const data: any[] = await res.json();
        const enriched: PosProduct[] = data.map((p, idx) => {
          const price = Number(
            ((p.sku.charCodeAt(p.sku.length - 1) * 3 + idx * 7) % 50 + 9.99).toFixed(2)
          );
          return {
            sku: p.sku,
            name: p.name,
            baseUnit: p.baseUnit || "Piece",
            availableStock: p.availableStock ?? p.onHand ?? 0,
            onHand: p.onHand ?? 0,
            price,
          };
        });
        setProducts(enriched);
      }
    } catch {
      // Ignore
    }
  };

  const fetchLocations = async () => {
    if (!activeEnterprise) return;
    try {
      const res = await fetch("/api/stock/locations", {
        headers: { "x-enterprise-id": activeEnterprise.id },
      });
      if (res.ok) {
        const data: WarehouseLocation[] = await res.json();
        setLocations(data);
        // Pre-select configured default location or first location
        const defaultLocId = activeEnterprise?.metadata?.defaultPosLocationId;
        if (defaultLocId && data.some((l) => l.id === defaultLocId)) {
          setSelectedLocationId(defaultLocId);
        } else if (data.length > 0) {
          setSelectedLocationId(data[0].id);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (activeEnterprise) {
      fetchProducts();
      fetchLocations();
    }
  }, [activeEnterprise]);

  // Fetch Relational Ledger (POS sales dispatches)
  const fetchLedger = async () => {
    if (!activeEnterprise) return;
    setIsLoadingLedger(true);
    try {
      const res = await fetch("/api/stock/ledger?action=DISPATCH", {
        headers: { "x-enterprise-id": activeEnterprise.id },
      });
      if (res.ok) {
        const data = await res.json();
        setLedgerEntries(data.slice(0, 30));
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingLedger(false);
    }
  };

  const handleOpenLedger = () => {
    setIsLedgerOpen(true);
    fetchLedger();
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Cart operations
  const addToCart = (product: PosProduct) => {
    if (product.availableStock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.sku === product.sku);
      if (existing) {
        if (existing.quantity >= product.availableStock) return prev;
        return prev.map((item) =>
          item.sku === product.sku
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          sku: product.sku,
          name: product.name,
          quantity: 1,
          unitPrice: product.price,
          maxStock: product.availableStock,
          baseUnit: product.baseUnit,
        },
      ];
    });
  };

  const updateQuantity = (sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.sku === sku) {
            const next = item.quantity + delta;
            if (next <= 0) return null;
            if (next > item.maxStock) return item;
            return { ...item, quantity: next };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (sku: string) => {
    setCart((prev) => prev.filter((i) => i.sku !== sku));
  };

  const clearCart = () => {
    setCart([]);
    setErrorMessage(null);
  };

  // Barcode / Fast search enter
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = products.find(
      (p) =>
        p.sku.toLowerCase() === searchQuery.trim().toLowerCase() ||
        p.name.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setSearchQuery("");
    }
  };

  // Totals
  const totalAmount = useMemo(() => {
    return Number(
      cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
    );
  }, [cart]);

  // Mindless 1-Click Relational Checkout
  const handleCheckout = async () => {
    if (cart.length === 0 || !activeEnterprise) return;

    setIsCheckingOut(true);
    setErrorMessage(null);

    try {
      const payload = {
        items: cart.map((item) => ({
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        paymentMethod,
        amountPaid: totalAmount,
        taxRate: 0,
        locationId: selectedLocationId || undefined,
      };

      const res = await fetch("/api/stock/pos/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-enterprise-id": activeEnterprise.id,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to process sale");

      const selectedLoc = locations.find((l) => l.id === selectedLocationId);
      setCompletedReceipt({
        ...data,
        locationName: selectedLoc?.name || "Primary Warehouse",
        currency: currencyCode,
      });
      setCart([]);
      fetchProducts();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading || !activeEnterprise) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-xs text-slate-500">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading POS terminal...
      </div>
    );
  }

  // POS Disabled Guard (Manager Decision)
  const isPosEnabled = activeEnterprise?.metadata?.posEnabled !== false;
  const isManagerOrAdmin = membershipRole === "manager" || user?.role === "superadmin";
  const canAccessPos = isManagerOrAdmin || permissions.includes("pos:access") || permissions.includes("*");

  if (!isPosEnabled) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-slate-900 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 stroke-1.5" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              Feature Disabled
            </span>
            <h1 className="text-base font-bold text-slate-950 pt-2">
              POS Terminal Disabled
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              The manager of <strong className="text-slate-900">{activeEnterprise.name}</strong> has chosen to disable Point of Sale (POS) operations for this workspace.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={`/${enterpriseSlug}`}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to IMS Workspace</span>
            </Link>

            {isManagerOrAdmin && (
              <Link
                href={`/${enterpriseSlug}/settings`}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configure POS in Settings</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessPos) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-slate-900 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 stroke-1.5" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Access Restricted
            </span>
            <h1 className="text-base font-bold text-slate-950 pt-2">
              POS Terminal Permission Required
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your staff account does not have permission to access the Point of Sale counter (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-slate-800">pos:access</code>). Please contact your workspace manager to grant you POS terminal permissions.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={`/${enterpriseSlug}`}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to IMS Workspace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* 1. MINIMAL HEADER */}
      <header
        data-tour="pos-header"
        className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-3">
          <Link
            data-tour="pos-exit"
            href={`/${enterpriseSlug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to IMS</span>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-slate-800" />
            <span className="text-xs font-bold text-slate-950">
              {activeEnterprise.name}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              / POS Counter
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Relational IMS Ledger Trigger */}
          <button
            onClick={handleOpenLedger}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition cursor-pointer"
            title="View live stock dispatch records created by POS sales"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Recent Sales Ledger</span>
          </button>

          <GuidedTourTrigger
            onTrigger={() => setIsTourOpen(true)}
            label="Tour"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs px-2.5 py-1"
          />

          <span className="text-xs text-slate-500 hidden sm:inline">
            Cashier: <strong className="text-slate-800 font-medium">{user?.name || "Staff"}</strong>
          </span>
        </div>
      </header>

      {/* 2. MAIN 2-COLUMN LAYOUT */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PRODUCTS CATALOG & SEARCH (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Bar */}
          <form
            data-tour="pos-search-barcode"
            onSubmit={handleSearchSubmit}
            className="relative"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name or SKU, press Enter to quick-add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-2xs"
            />
          </form>

          {/* Products Catalog */}
          <div
            data-tour="pos-catalog"
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Enterprise IMS Catalog</span>
              <span className="font-mono text-[11px]">{filteredProducts.length} items</span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Package className="w-6 h-6 stroke-1 opacity-50" />
                <span>No products found matching your search.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.availableStock <= 0;
                  const isLowStock = !isOutOfStock && p.availableStock <= 5;
                  const inCart = cart.find((i) => i.sku === p.sku);

                  return (
                    <div
                      key={p.sku}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isOutOfStock
                          ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                          : inCart
                          ? "bg-slate-50/80 border-slate-900 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {p.sku}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                              isOutOfStock
                                ? "bg-slate-100 text-slate-500 border-slate-200"
                                : isLowStock
                                ? "bg-slate-100 text-slate-900 border-slate-300 font-semibold"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {isOutOfStock
                              ? "Out of Stock"
                              : `${p.availableStock} ${p.baseUnit}s`}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {p.name}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-950 font-mono">
                          {formatPrice(p.price)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition">
                          {inCart ? `${inCart.quantity} in cart` : "+ Add"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE SALE TICKET & CHECKOUT (5 COLS) */}
        <div
          data-tour="pos-cart"
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
        >
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wide">
                Current Sale
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} item(s)
              </span>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-slate-400 hover:text-slate-800 transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Relational IMS Warehouse Location Selector */}
          {locations.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dispatch Location</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">IMS Warehouse</span>
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.code ? `(${loc.code})` : ""} — {loc.type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-700 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-2 min-h-[140px] max-h-[260px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Ticket is empty. Tap any product on the left to add.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.sku}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-semibold text-slate-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {formatPrice(item.unitPrice)} ea ({item.baseUnit})
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.sku, -1)}
                      className="h-6 w-6 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold w-5 text-center text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.sku, 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="h-6 w-6 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-slate-950 w-16 text-right">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.sku)}
                      className="text-slate-400 hover:text-slate-800 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Payment Method
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentMethod === "cash"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentMethod === "card"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
            </div>
          </div>

          {/* Total & Mindless Complete Sale Button */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Total Amount:</span>
              <span className="text-xl font-bold font-mono text-slate-950">
                {formatPrice(totalAmount)}
              </span>
            </div>

            <button
              data-tour="pos-checkout"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isCheckingOut}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-40"
            >
              {isCheckingOut ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>
                {isCheckingOut ? "Processing Sale..." : `Complete Sale (${formatPrice(totalAmount)})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MINIMAL RECEIPT MODAL */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5 text-slate-900" />
              </div>
              <h3 className="font-bold text-sm text-slate-950">Sale Completed</h3>
              <p className="text-xs text-slate-500 font-mono">
                Receipt #{completedReceipt.receiptNumber}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Fulfillment: {completedReceipt.locationName}
              </p>
            </div>

            <div className="text-xs space-y-1.5 font-mono max-h-40 overflow-y-auto">
              {completedReceipt.items.map((it: any) => (
                <div key={it.sku} className="flex justify-between text-slate-700">
                  <span className="truncate pr-2">
                    {it.quantity}x {it.name}
                  </span>
                  <span className="font-semibold shrink-0">{formatPrice(it.total)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs font-mono space-y-1">
              <div className="flex justify-between font-bold text-slate-950 pt-1">
                <span>Total Paid:</span>
                <span>{formatPrice(completedReceipt.total)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Payment:</span>
                <span className="uppercase">{completedReceipt.paymentMethod}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setCompletedReceipt(null)}
                className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                Next Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. RELATIONAL IMS RECENT SALES LEDGER MODAL */}
      {isLedgerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-700" />
                <div>
                  <h3 className="font-bold text-sm text-slate-950">
                    Live IMS Stock Ledger (Recent Dispatches)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Directly synced with inventory ledger entries
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLedgerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingLedger ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading ledger records from IMS...</span>
              </div>
            ) : ledgerEntries.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No recent dispatch or POS sales transactions recorded yet.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs">
                {ledgerEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {entry.product?.name || entry.metadata?.productName || "Product"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          {entry.product?.sku || entry.metadata?.sku || "SKU"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>Ref: {entry.reference || entry.metadata?.receiptNumber || "POS"}</span>
                        <span>•</span>
                        <span>From: {entry.fromLocation || "Warehouse"}</span>
                        <span>•</span>
                        <span>By: {entry.user?.name || entry.metadata?.cashierName || "Staff"}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-900 block">
                        {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsLedgerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Walkthrough */}
      <GuidedWalkthrough
        tourKey="pos_terminal"
        steps={POS_WALKTHROUGH_STEPS}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
