# StockWise: Enterprise Business Inventory Analytics

StockWise is a premium, high-fidelity business inventory management application designed to handle cataloging, live stock tracking, supplier registries, point-of-sale invoicing, and real-time business reporting.

## 🚀 Features

1. **Dashboard & Visual Analytics**:
   - High-level KPI summary cards tracking active suppliers, low stock margins, total asset valuation, and accumulated revenue.
   - Interactive Recharts graphs showing 7-day revenue lines, category sales bar charts, and supplier distribution pies.
   - Low stock warning banners and quick restock shortcut buttons.
2. **Product Catalog**:
   - Product registry mapping SKUs, descriptions, prices, categories, and safety margins.
   - Comprehensive CRUD panel to add, edit, or archive products.
   - Category, supplier, and stock level filtering.
3. **Stock Ledger & Audit Trail**:
   - Historical ledger log tracking all transaction events (Incoming shipments, manual adjustments, outgoing sales checkouts).
   - Live manual stock adjustment controls with audit notes.
4. **Supplier Registry**:
   - Partnership logs tracking verified supplier contacts, emails, phone numbers, and addresses.
   - CRUD management with validation checking (preventing deletion of active inventory suppliers).
5. **POS Checkout Invoicing**:
   - Interactive Point-of-Sale panel with dynamic catalog search and live quantity cart selectors.
   - Complete checkout validation ensuring stock safety (prevents selling products beyond available stock quantities).
   - SQL Transaction-backed transaction checkout pipeline ensuring database atomic operations.
   - Historic Invoice ledger with expandable line item drawer views.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Recharts, Lucide React, Vanilla CSS variables.
- **Backend**: Python 3, Flask, Flask-CORS.
- **Database**: SQLite (SQL engine executing atomic transactions).

---

## 🗄️ Database Schema (SQL Relational Models)

StockWise is powered by a relational SQLite model structure:
1. `suppliers`: Registry of all partner profiles.
2. `products`: Reference to SKUs, prices, stock levels, and `supplier_id` (foreign key).
3. `stock_transactions`: Audit log recording incoming/outgoing transaction changes.
4. `sales`: General sales ledger header recording customers, totals, and times.
5. `sales_items`: Sale detail line-items matching products, quantities, and check-out costs.

---

## ⚙️ Setup & Setup Instructions

### 1. Requirements
Ensure you have **Python 3** and **Node.js** installed on your system.

### 2. Immediate Startup
You can launch both the backend and frontend simultaneously using the launcher batch file in Windows:
```bash
run_app.bat
```
*This will automatically launch the Flask API server, bootstrap the React app, and open `http://localhost:5173` in your default browser.*

### 3. Manual Startup
If you wish to run the backend and frontend separately:

#### **Backend (Python Flask)**:
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*Runs on `http://localhost:5000`*

#### **Frontend (React & Vite)**:
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`*
