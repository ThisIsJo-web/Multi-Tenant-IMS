# Enterprise Inventory Management System — UI Blueprint

You built the engine and the doors: **Auth, Enterprises, and Enterprise Keys**. The next step is defining what a user actually sees and interacts with after entering an Enterprise workspace.

An Inventory Management System inside an Enterprise can be organized into **5 core screens**.

This document defines the page layout, screen-by-screen UI breakdown, data relationships, Next.js App Router structure, and recommended frontend build order.

---

# 1. Global Workspace Layout

Once a user logs into an Enterprise, they enter a persistent workspace shell.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] Apex Supplies | Key: [ENT-4B2F-9A10] (Copy) | User: John (Staff)   │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ 📊 Dashboard      │                                                         │
│ 📦 Products       │                                                         │
│ 📍 Locations      │                    MAIN CONTENT AREA                    │
│ 🔄 Operations     │                                                         │
│ 📜 Stock Ledger   │                                                         │
│ 👥 Team & Roles   │                                                         │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

## Persistent UI Elements

### Top Bar

The top bar contains:

- Enterprise logo or branding
- Active Enterprise name
- Enterprise Key
- One-click copy button for the Enterprise Key
- Workspace switcher
- Current user information
- User role, such as Manager or Staff
- User avatar or profile menu

Example:

```text
Apex Supplies
Key: ENT-4B2F-9A10 [Copy]

John Doe
Staff
```

The Enterprise Key should be easy for Managers to copy and share with authorized users.

### Sidebar Navigation

The sidebar contains the primary Inventory Management System navigation:

```text
📊 Dashboard
📦 Products
📍 Locations
🔄 Operations
📜 Stock Ledger
👥 Team & Roles
```

The main content area changes based on the selected route.

---

# 2. Dashboard — The Bird's-Eye View

The Dashboard is the Enterprise landing page.

It should answer three questions quickly:

1. Do we have enough stock?
2. What is running out?
3. What inventory activity just happened?

## Dashboard Layout

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ 📊 Dashboard                                                             │
├─────────────────┬─────────────────┬───────────────────┬───────────────────┤
│ Total SKUs      │ Total Stock     │ Low Stock Alerts  │ Moves Today       │
│ 1,240           │ 48,210 units    │ 6 items ⚠️        │ 34 transactions   │
├─────────────────┴─────────────────┴───────────────────┴───────────────────┤
│ ⚠️ Items Needing Reorder                                                  │
│                                                                           │
│ • 12mm Steel Rebar                                                        │
│   On Hand: 12 pcs | Min Required: 50 pcs | [Reorder]                     │
│                                                                           │
│ • 25kg Cement Bags                                                        │
│   On Hand: 4 bags | Min Required: 20 bags | [Reorder]                    │
├───────────────────────────────────────────────────────────────────────────┤
│ 🕒 Recent Activity Feed                                                   │
│                                                                           │
│ • [10:14 AM] John transferred 20x "Red Paint" from Dock → Shelf B       │
│ • [09:45 AM] System reserved 2x "Drill Set" for Order #PO-8821          │
│ • [09:00 AM] Sarah received 100x "2x4 Timber" from Supplier             │
└───────────────────────────────────────────────────────────────────────────┘
```

## Dashboard Components

### Summary Cards

Display:

- Total SKUs
- Total Stock
- Low Stock Alerts
- Inventory Moves Today

Example:

```text
Total SKUs: 1,240
Total Stock: 48,210 units
Low Stock Alerts: 6
Moves Today: 34
```

### Low Stock / Reorder Section

Display products where:

```text
availableStock <= reorderThreshold
```

Each row can include:

- Product name
- Current stock
- Minimum required stock
- Reorder action

### Recent Activity Feed

Show the latest inventory events.

Examples:

```text
John transferred 20x Red Paint from Dock to Shelf B

System reserved 2x Drill Set for Order #PO-8821

Sarah received 100x 2x4 Timber from an external supplier
```

This data should come from the stock ledger or inventory movement records.

---

# 3. Products & Catalog — The Master List

The Products page is where users create and manage the products stored inside the Enterprise.

## Products Table

| SKU | Name | Base Unit | On Hand | Reserved | Available (ATP) | Status | Actions |
|---|---|---|---:|---:|---:|---|---|
| `SKU-1001` | 2x4 Timber Plank | Piece | 120 | 20 | **100** | In Stock | View / Edit |
| `SKU-1002` | Portland Cement (50kg) | Bag | 5 | 0 | **5** | Low Stock | View / Edit |
| `SKU-1003` | Industrial Cordless Drill | Piece | 14 | 4 | **10** | In Stock | View / Edit |

## Stock Calculation

Available-to-Promise, or ATP:

```text
Available Stock = On Hand - Reserved
```

Example:

```text
On Hand: 120
Reserved: 20

Available: 100
```

## Add Product

Clicking **Add Product** opens a drawer or modal.

### Product Fields

#### SKU / Barcode

Example:

```text
DRL-20V-BL
```

#### Product Name

Example:

```text
20V Brushless Cordless Drill
```

#### Base Unit

Dropdown options:

```text
Piece
Kg
Liter
Meter
Box
```

#### Tracking Mode

Radio selector:

```text
○ Standard
○ Batch / Expiry
○ Serialized
```

Tracking modes:

- **Standard** — Regular quantity tracking.
- **Batch / Expiry** — For food, chemicals, medicine, and expiring goods.
- **Serialized** — For tools, electronics, or products with unique serial numbers.

#### Reorder Threshold

A numeric value representing the minimum acceptable stock.

Example:

```text
Reorder Threshold: 10
```

When stock reaches or falls below the threshold, the product appears in low-stock alerts.

---

# 4. Locations & Bins — The Warehouse Map

Before inventory can move, the Enterprise needs locations.

The Locations page defines where physical stock exists.

## Example Location Tree

```text
🏢 Main Warehouse
  ├── 📍 Receiving Bay (Dock A)
  │     └── 140 items resting here
  │
  ├── 📍 Aisle 1
  │     ├── Bin 1-A
  │     │     └── Cement: 50 bags
  │     │
  │     └── Bin 1-B
  │           └── Sand: 20 bags
  │
  └── 📍 Aisle 2 — Tools
        └── Shelf A
              └── Drills: 14 pcs


🚚 Delivery Truck #1
  └── In Transit: 4 items


🛑 System / Logical Locations
  ├── 🗑️ Scrap / Damage Area
  └── 🔍 Quarantine
```

## Location Types

Examples:

- Warehouse
- Receiving Bay
- Aisle
- Shelf
- Bin
- Vehicle
- Mobile Location
- Scrap Area
- Quarantine Area

## Add Location

Users can click:

```text
+ Add Location
```

The form can include:

```text
Location Name
Location Type
Parent Location
Location Code
```

Examples:

```text
Main Warehouse
└── Aisle 2
    └── Shelf A
```

The hierarchy allows users to organize storage spaces while keeping inventory traceable.

---

# 5. Operations — Where Inventory Work Happens

The Operations page is the primary workspace for daily inventory movement.

## Operations Hub

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ 📦 Operations Hub                                                         │
│                                                                           │
│ [ + Inbound (Receive) ]                                                   │
│                                                                           │
│ [ ⇄ Transfer Stock ]                                                      │
│                                                                           │
│ [ - Outbound (Dispatch) ]                                                 │
└───────────────────────────────────────────────────────────────────────────┘
```

The three primary inventory actions are:

1. Receive stock
2. Transfer stock
3. Dispatch stock

---

## 5.1 Inbound — Receive Stock

Used when goods arrive from a supplier or another external source.

### Form Fields

```text
Supplier Reference / PO #
Select Item
Destination Location
Quantity Received
```

Example:

```text
PO #: PO-9092

Product:
20V Brushless Cordless Drill

Destination:
Receiving Bay

Quantity:
50
```

When submitted:

```text
1. Create a stock ledger entry.
2. Increase stock at Receiving Bay.
3. Update total product inventory.
4. Record the user who performed the action.
```

Ledger example:

```text
RECEIPT
Supplier → Receiving Bay
Quantity: +50
Reference: PO-9092
```

---

## 5.2 Transfer Stock

Used when inventory moves between Enterprise locations.

### Form Fields

```text
Select Item
From Location
To Location
Quantity to Move
```

Example:

```text
Product:
20V Brushless Cordless Drill

From:
Receiving Bay

To:
Aisle 2 → Shelf A

Quantity:
20
```

When submitted:

```text
1. Deduct 20 units from Receiving Bay.
2. Add 20 units to Shelf A.
3. Create an immutable ledger entry.
4. Record the user and timestamp.
```

Conceptually:

```text
Receiving Bay: -20

Shelf A: +20
```

The total Enterprise stock does not change.

Only the location changes.

---

## 5.3 Outbound — Dispatch Stock

Used when products leave the Enterprise.

Examples:

- Customer orders
- Sales
- Deliveries
- Fulfillment

### Form Fields

```text
Order Reference
Product
From Location
Quantity
```

Example:

```text
Order Reference:
INV-3011

From:
Aisle 2 → Shelf A

Quantity:
2
```

When confirmed:

```text
1. Deduct stock from the source location.
2. Reduce total physical stock.
3. Create an immutable ledger record.
4. Record the user and reference number.
```

Example:

```text
Shelf A: -2

Customer / External Destination: +2 logical movement
```

---

# 6. Stock Ledger — The Inventory Bank Statement

The Stock Ledger is the permanent audit trail of inventory activity.

If someone asks:

> Why do we only have 10 drills when we bought 50?

The system should answer through historical records rather than manual investigation.

## Ledger Table

| Timestamp | Item / SKU | Action | From | To | Qty | Performed By | Reference |
|---|---|---|---|---|---:|---|---|
| Sept 7, 10:14 | Drill (`SKU-1003`) | **TRANSFER** | Receiving Bay | Shelf A | `+20` | John (Staff) | Move #441 |
| Sept 7, 09:30 | Drill (`SKU-1003`) | **DISPATCH** | Shelf A | Customer | `-2` | Sarah (Staff) | Order #882 |
| Sept 7, 08:00 | Drill (`SKU-1003`) | **RECEIPT** | Supplier | Receiving Bay | `+50` | Manager | PO-9092 |

## Important Ledger Rules

The stock ledger should be:

- Immutable
- Append-only
- Not editable
- Not deletable
- Timestamped
- Associated with the user who performed the action
- Connected to a product
- Connected to source and destination locations
- Connected to an external reference when applicable

A good conceptual data model is:

```text
StockLedgerEntry
│
├── id
├── enterpriseId
├── productId
├── action
├── quantity
├── fromLocationId
├── toLocationId
├── performedByUserId
├── reference
├── createdAt
└── metadata
```

Possible actions:

```text
RECEIPT
TRANSFER
DISPATCH
ADJUSTMENT
RESERVATION
RELEASE
DAMAGE
QUARANTINE
```

---

# 7. How the Data Connects

The Enterprise acts as the top-level workspace.

```text
Enterprise
│
├── Users / Members
│
├── Products
│   ├── SKU
│   ├── Base Unit
│   ├── Tracking Mode
│   └── Reorder Threshold
│
├── Locations
│   ├── Warehouse
│   ├── Aisle
│   ├── Shelf
│   ├── Bin
│   └── Logical Locations
│
├── Inventory Balances
│   ├── Product
│   ├── Location
│   ├── On Hand
│   └── Reserved
│
└── Stock Ledger
    ├── Receipt
    ├── Transfer
    ├── Dispatch
    └── Other Inventory Events
```

The important relationship is:

```text
Enterprise
    ↓
Product + Location
    ↓
Inventory Balance
    ↓
Stock Operations
    ↓
Stock Ledger
```

A product does not simply have one stock number.

Its inventory can be distributed across multiple locations.

Example:

```text
20V Drill

Receiving Bay: 30
Shelf A: 14
Delivery Truck: 4

Total On Hand: 48
```

---

# 8. Next.js App Router Structure

The UI maps cleanly to the following route structure:

```text
src/app/
└── (dashboard)/
    └── [enterpriseSlug]/
        │
        ├── layout.tsx
        │
        ├── page.tsx
        │
        ├── products/
        │   ├── page.tsx
        │   └── [productId]/
        │       └── page.tsx
        │
        ├── locations/
        │   └── page.tsx
        │
        ├── operations/
        │   └── page.tsx
        │
        ├── ledger/
        │   └── page.tsx
        │
        └── settings/
            └── team/
                └── page.tsx
```

## Route Responsibilities

### `layout.tsx`

Contains the persistent Enterprise workspace shell:

```text
Sidebar
Top Bar
Enterprise Name
Enterprise Key
Copy Button
User Menu
```

### `page.tsx`

The Enterprise Dashboard.

```text
/[enterpriseSlug]
```

### `products/page.tsx`

Product catalog.

```text
/[enterpriseSlug]/products
```

### `products/[productId]/page.tsx`

Single product details and inventory history.

```text
/[enterpriseSlug]/products/[productId]
```

### `locations/page.tsx`

Warehouse, shelf, bin, and location management.

```text
/[enterpriseSlug]/locations
```

### `operations/page.tsx`

Inventory movement workspace.

```text
/[enterpriseSlug]/operations
```

### `ledger/page.tsx`

Immutable inventory audit log.

```text
/[enterpriseSlug]/ledger
```

### `settings/team/page.tsx`

Enterprise member and role management.

```text
/[enterpriseSlug]/settings/team
```

---

# 9. Recommended Frontend Build Order

Build the frontend in this order.

## Step 1 — Build the Enterprise Layout

Create:

```text
[enterpriseSlug]/layout.tsx
```

Include:

- Sidebar
- Top Bar
- Enterprise Name
- Enterprise Key
- Copy Enterprise Key button
- User menu

This creates the persistent workspace shell for every Inventory Management System page.

---

## Step 2 — Build the Products Page

Create:

```text
/[enterpriseSlug]/products
```

Implement:

- Products table
- Search
- Status badges
- Add Product button
- Add Product modal or drawer
- View Product action
- Edit Product action

This gives users actual inventory items to work with.

---

## Step 3 — Build the Operations Page

Create:

```text
/[enterpriseSlug]/operations
```

Start with two operations:

```text
Receive Stock
Transfer Stock
```

Implement the forms first.

The data flow should be:

```text
User submits operation
        ↓
Validate product and location
        ↓
Update inventory balance
        ↓
Create immutable stock ledger entry
        ↓
Refresh UI
```

After that, add:

```text
Dispatch Stock
Reservations
Adjustments
Damage Handling
```

---

## Step 4 — Build the Stock Ledger

Create:

```text
/[enterpriseSlug]/ledger
```

Implement:

- Timestamp
- Product
- Action type
- Source location
- Destination location
- Quantity
- Performed by
- Reference

Recommended filters:

```text
Date Range
Product
Action Type
Location
User
Reference
```

The ledger should update whenever an inventory operation is successfully completed.

---

# 10. Core MVP Flow

The simplest complete Inventory Management System flow should be:

```text
1. Manager creates an Enterprise
        ↓
2. Manager creates Products
        ↓
3. Manager creates Locations
        ↓
4. Staff receives stock
        ↓
5. Stock is stored at a location
        ↓
6. Staff transfers stock between locations
        ↓
7. Staff dispatches stock
        ↓
8. Every movement appears in the Stock Ledger
        ↓
9. Dashboard summarizes the current state
```

---

# Final MVP Priority

If you want to avoid building too much at once, focus on this sequence:

```text
Enterprise Layout
        ↓
Products
        ↓
Locations
        ↓
Receive Stock
        ↓
Transfer Stock
        ↓
Stock Ledger
        ↓
Dashboard
        ↓
Dispatch and Advanced Features
```

The key principle is simple:

> **Products define what you have. Locations define where it is. Operations define what happened. The ledger remembers everything. The dashboard summarizes the result.**