import os
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db_exists = os.path.exists(DB_PATH)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price REAL NOT NULL,
        cost_price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 10,
        supplier_id INTEGER,
        status TEXT DEFAULT 'In Stock',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS stock_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        type TEXT CHECK(type IN ('INCOMING', 'OUTGOING', 'ADJUSTMENT')),
        quantity INTEGER NOT NULL,
        reference TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        payment_method TEXT,
        total_amount REAL NOT NULL,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sales_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )
    ''')
    
    conn.commit()

    # Seed mock data if database is empty/new
    cursor.execute("SELECT COUNT(*) FROM suppliers")
    if cursor.fetchone()[0] == 0:
        # Seed Suppliers
        suppliers_data = [
            ("TechWorld Distributors", "Alice Smith", "alice@techworld.com", "+1-555-0199", "100 Innovation Way, San Jose, CA", "Active"),
            ("Global Logistics Inc", "Bob Johnson", "bob@globallogistics.com", "+1-555-0144", "450 Freight St, Seattle, WA", "Active"),
            ("Elite Components LLC", "Carol White", "carol@elitecomp.com", "+1-555-0177", "720 Silicon Alley, Austin, TX", "Active"),
            ("Nordic Packaging", "David Larsson", "david@nordicpack.com", "+1-555-0182", "55 Fjord Rd, Minneapolis, MN", "Inactive")
        ]
        cursor.executemany(
            "INSERT INTO suppliers (name, contact_name, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)",
            suppliers_data
        )
        conn.commit()

        # Seed Products
        # supplier ids will be 1, 2, 3, 4
        products_data = [
            ("PROD-MBP14", "MacBook Pro 14\"", "Apple M3 Pro, 18GB RAM, 512GB SSD", "Electronics", 169900.00, 130000.00, 25, 5, 1, "In Stock"),
            ("PROD-DXP15", "Dell XPS 15", "Intel Core i7, 16GB RAM, 1TB SSD", "Electronics", 145000.00, 110000.00, 3, 5, 1, "Low Stock"),
            ("PROD-MXM3S", "Logitech MX Master 3S", "Wireless Ergonomic Mouse", "Accessories", 9995.00, 6500.00, 45, 10, 2, "In Stock"),
            ("PROD-KC2V2", "Keychron K2 V2", "Wireless Mechanical Keyboard", "Accessories", 8499.00, 5000.00, 4, 10, 2, "Low Stock"),
            ("PROD-DU27", "Dell 27\" UltraSharp Monitor", "4K USB-C Hub Monitor", "Office Equipment", 34999.00, 25000.00, 12, 3, 3, "In Stock"),
            ("PROD-AUBCH", "Anker 7-in-1 USB-C Hub", "Multiport Adapter with HDMI", "Accessories", 4499.00, 2800.00, 120, 15, 2, "In Stock"),
            ("PROD-SHNDS", "Sit-Stand Smart Desk", "Electric Dual Motor Height Adjustable", "Office Equipment", 24999.00, 18000.00, 8, 3, 3, "In Stock"),
            ("PROD-AEC10", "Aero Ergonomic Chair", "High Back Mesh Office Chair", "Office Equipment", 14999.00, 9500.00, 0, 5, 3, "Out of Stock")
        ]
        cursor.executemany(
            "INSERT INTO products (sku, name, description, category, price, cost_price, stock_quantity, min_stock_level, supplier_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            products_data
        )
        conn.commit()

        # Seed Stock Transactions (Initial stock loads)
        # product ids: 1, 2, 3, 4, 5, 6, 7, 8
        transaction_data = [
            (1, "INCOMING", 25, "PO-10001", "Initial stock setup"),
            (2, "INCOMING", 10, "PO-10002", "Initial stock setup"),
            (3, "INCOMING", 50, "PO-10003", "Initial stock setup"),
            (4, "INCOMING", 15, "PO-10004", "Initial stock setup"),
            (5, "INCOMING", 15, "PO-10005", "Initial stock setup"),
            (6, "INCOMING", 130, "PO-10006", "Initial stock setup"),
            (7, "INCOMING", 10, "PO-10007", "Initial stock setup"),
            (8, "INCOMING", 5, "PO-10008", "Initial stock setup")
        ]
        cursor.executemany(
            "INSERT INTO stock_transactions (product_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)",
            transaction_data
        )
        conn.commit()

        # Seed Sales (over the last 7 days)
        today = datetime.now()
        sales_dates = [
            today - timedelta(days=6),
            today - timedelta(days=5),
            today - timedelta(days=4),
            today - timedelta(days=3),
            today - timedelta(days=2),
            today - timedelta(days=1),
            today
        ]

        # Sale 1: Day -6
        cursor.execute("INSERT INTO sales (customer_name, payment_method, total_amount, sale_date) VALUES (?, ?, ?, ?)",
                       ("Acme Corp", "Bank Transfer", 359790.00, sales_dates[0].strftime('%Y-%m-%d %H:%M:%S')))
        sale1_id = cursor.lastrowid
        cursor.executemany("INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)", [
            (sale1_id, 1, 2, 169900.00, 339800.00), # 2x MacBook Pro
            (sale1_id, 3, 2, 9995.00, 19990.00)     # 2x Logitech Mouse
        ])
        
        # Sale 2: Day -5
        cursor.execute("INSERT INTO sales (customer_name, payment_method, total_amount, sale_date) VALUES (?, ?, ?, ?)",
                       ("John Doe", "Credit Card", 26993.00, sales_dates[1].strftime('%Y-%m-%d %H:%M:%S')))
        sale2_id = cursor.lastrowid
        cursor.executemany("INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)", [
            (sale2_id, 3, 1, 9995.00, 9995.00),
            (sale2_id, 4, 2, 8499.00, 16998.00)
        ])

        # Sale 3: Day -4
        cursor.execute("INSERT INTO sales (customer_name, payment_method, total_amount, sale_date) VALUES (?, ?, ?, ?)",
                       ("Tech Startup Inc", "Credit Card", 179999.00, sales_dates[2].strftime('%Y-%m-%d %H:%M:%S')))
        sale3_id = cursor.lastrowid
        cursor.executemany("INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)", [
            (sale3_id, 2, 1, 145000.00, 145000.00), # 1x Dell XPS
            (sale3_id, 5, 1, 34999.00, 34999.00)    # 1x Dell 27
        ])

        # Sale 4: Day -3
        cursor.execute("INSERT INTO sales (customer_name, payment_method, total_amount, sale_date) VALUES (?, ?, ?, ?)",
                       ("Jane Smith", "Cash", 19990.00, sales_dates[3].strftime('%Y-%m-%d %H:%M:%S')))
        sale4_id = cursor.lastrowid
        cursor.execute("INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)",
                       (sale4_id, 3, 2, 9995.00, 19990.00))

        # Sale 5: Day -2
        cursor.execute("INSERT INTO sales (customer_name, payment_method, total_amount, sale_date) VALUES (?, ?, ?, ?)",
                       ("Design Studio", "Bank Transfer", 254395.00, sales_dates[4].strftime('%Y-%m-%d %H:%M:%S')))
        sale5_id = cursor.lastrowid
        cursor.executemany("INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)", [
            (sale5_id, 1, 1, 169900.00, 169900.00),
            (sale5_id, 7, 2, 24999.00, 49998.00),
            (sale5_id, 8, 2, 14999.00, 29998.00),
            (sale5_id, 6, 1, 4499.00, 4499.00)
        ])

        # Sale 6: Day -1
        cursor.execute("INSERT INTO sales (customer_name, payment_method, total_amount, sale_date) VALUES (?, ?, ?, ?)",
                       ("Retailer Depot", "Credit Card", 63483.00, sales_dates[5].strftime('%Y-%m-%d %H:%M:%S')))
        sale6_id = cursor.lastrowid
        cursor.executemany("INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)", [
            (sale6_id, 4, 3, 8499.00, 25497.00),
            (sale6_id, 6, 4, 4499.00, 17996.00),
            (sale6_id, 3, 2, 9995.00, 19990.00)
        ])

        # Sale 7: Today
        cursor.execute("INSERT INTO sales (customer_name, payment_method, total_amount, sale_date) VALUES (?, ?, ?, ?)",
                       ("Office Supplies Corp", "Bank Transfer", 367895.00, sales_dates[6].strftime('%Y-%m-%d %H:%M:%S')))
        sale7_id = cursor.lastrowid
        cursor.executemany("INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)", [
            (sale7_id, 1, 1, 169900.00, 169900.00),
            (sale7_id, 2, 1, 145000.00, 145000.00),
            (sale7_id, 5, 1, 34999.00, 34999.00),
            (sale7_id, 6, 4, 4499.00, 17996.00)
        ])

        # We must deduct quantities from initial products to get final seeded quantities.
        # Deducts:
        # Prod 1 (MacBook): Sale 1 (2), Sale 5 (1), Sale 7 (1) -> Total sold = 4. Original 25 -> Final stock = 21. Let's update stock quantity
        # Prod 2 (Dell XPS): Sale 3 (1), Sale 7 (1) -> Total sold = 2. Original 5 -> Final stock = 3.
        # Prod 3 (Logitech Mouse): Sale 1 (2), Sale 2 (1), Sale 4 (2), Sale 5 (0), Sale 6 (2) -> Total sold = 7. Original 52 -> Final stock = 45.
        # Prod 4 (Keychron Keyboard): Sale 2 (2), Sale 6 (3) -> Total sold = 5. Original 9 -> Final stock = 4.
        # Prod 5 (Dell Monitor): Sale 3 (1), Sale 7 (1) -> Total sold = 2. Original 14 -> Final stock = 12.
        # Prod 6 (Anker Hub): Sale 5 (1), Sale 6 (4), Sale 7 (4) -> Total sold = 9. Original 129 -> Final stock = 120.
        # Prod 7 (Smart Desk): Sale 5 (2) -> Total sold = 2. Original 10 -> Final stock = 8.
        # Prod 8 (Ergonomic Chair): Sale 5 (2) -> Total sold = 2. Original 5 -> Final stock = 3. Wait, in initial products we put 0 to make it "Out of Stock", let's make it 3.
        # Let's write update statement or just seed stock transactions corresponding to sales:
        cursor.execute("UPDATE products SET stock_quantity = 21 WHERE id = 1")
        cursor.execute("UPDATE products SET stock_quantity = 3 WHERE id = 2")
        cursor.execute("UPDATE products SET stock_quantity = 45 WHERE id = 3")
        cursor.execute("UPDATE products SET stock_quantity = 4 WHERE id = 4")
        cursor.execute("UPDATE products SET stock_quantity = 12 WHERE id = 5")
        cursor.execute("UPDATE products SET stock_quantity = 120 WHERE id = 6")
        cursor.execute("UPDATE products SET stock_quantity = 8 WHERE id = 7")
        cursor.execute("UPDATE products SET stock_quantity = 3 WHERE id = 8")
        
        # Add outgoing stock transaction entries for sales to keep log clean
        outgoing_transactions = [
            (1, "OUTGOING", 2, "Sale-1", "Customer Checkout (Acme Corp)"),
            (3, "OUTGOING", 2, "Sale-1", "Customer Checkout (Acme Corp)"),
            (3, "OUTGOING", 1, "Sale-2", "Customer Checkout (John Doe)"),
            (4, "OUTGOING", 2, "Sale-2", "Customer Checkout (John Doe)"),
            (2, "OUTGOING", 1, "Sale-3", "Customer Checkout (Tech Startup Inc)"),
            (5, "OUTGOING", 1, "Sale-3", "Customer Checkout (Tech Startup Inc)"),
            (3, "OUTGOING", 2, "Sale-4", "Customer Checkout (Jane Smith)"),
            (1, "OUTGOING", 1, "Sale-5", "Customer Checkout (Design Studio)"),
            (7, "OUTGOING", 2, "Sale-5", "Customer Checkout (Design Studio)"),
            (8, "OUTGOING", 2, "Sale-5", "Customer Checkout (Design Studio)"),
            (6, "OUTGOING", 1, "Sale-5", "Customer Checkout (Design Studio)"),
            (4, "OUTGOING", 3, "Sale-6", "Customer Checkout (Retailer Depot)"),
            (6, "OUTGOING", 4, "Sale-6", "Customer Checkout (Retailer Depot)"),
            (3, "OUTGOING", 2, "Sale-6", "Customer Checkout (Retailer Depot)"),
            (1, "OUTGOING", 1, "Sale-7", "Customer Checkout (Office Supplies Corp)"),
            (2, "OUTGOING", 1, "Sale-7", "Customer Checkout (Office Supplies Corp)"),
            (5, "OUTGOING", 1, "Sale-7", "Customer Checkout (Office Supplies Corp)"),
            (6, "OUTGOING", 4, "Sale-7", "Customer Checkout (Office Supplies Corp)")
        ]
        cursor.executemany(
            "INSERT INTO stock_transactions (product_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?)",
            outgoing_transactions
        )
        conn.commit()

    conn.close()

# Helper function to auto-determine product status based on stock level
def determine_status(stock_quantity, min_stock_level):
    if stock_quantity <= 0:
        return 'Out of Stock'
    elif stock_quantity <= min_stock_level:
        return 'Low Stock'
    else:
        return 'In Stock'

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. KPIs
    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]
    
    cursor.execute("SELECT SUM(stock_quantity) FROM products")
    total_stock = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT SUM(stock_quantity * price) FROM products")
    inventory_value = cursor.fetchone()[0] or 0.0
    
    cursor.execute("SELECT SUM(total_amount) FROM sales")
    total_revenue = cursor.fetchone()[0] or 0.0
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level")
    low_stock_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM suppliers WHERE status = 'Active'")
    active_suppliers = cursor.fetchone()[0]

    # 2. Low Stock Alerts
    cursor.execute('''
        SELECT p.id, p.sku, p.name, p.stock_quantity, p.min_stock_level, s.name as supplier_name 
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.stock_quantity <= p.min_stock_level
        ORDER BY p.stock_quantity ASC
    ''')
    low_stock_products = [dict(row) for row in cursor.fetchall()]

    # 3. Sales trends (last 7 days of sales)
    today = datetime.now()
    sales_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime('%Y-%m-%d')
        # get total sales on this day
        cursor.execute('''
            SELECT SUM(total_amount) as revenue, COUNT(*) as count 
            FROM sales 
            WHERE date(sale_date) = ?
        ''', (day_str,))
        row = cursor.fetchone()
        sales_trend.append({
            'date': day.strftime('%b %d'),
            'revenue': row['revenue'] or 0.0,
            'orders': row['count'] or 0
        })

    # 4. Product Sales by Category
    cursor.execute('''
        SELECT p.category, SUM(si.quantity) as items_sold, SUM(si.total_price) as revenue
        FROM sales_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY p.category
        ORDER BY revenue DESC
    ''')
    category_sales = [dict(row) for row in cursor.fetchall()]

    # 5. Top Selling Products
    cursor.execute('''
        SELECT p.name, p.sku, SUM(si.quantity) as quantity_sold, SUM(si.total_price) as total_sales
        FROM sales_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY p.id
        ORDER BY quantity_sold DESC
        LIMIT 5
    ''')
    top_selling = [dict(row) for row in cursor.fetchall()]

    # 6. Supplier distribution (number of products per supplier)
    cursor.execute('''
        SELECT s.name as supplier_name, COUNT(p.id) as product_count
        FROM suppliers s
        LEFT JOIN products p ON p.supplier_id = s.id
        GROUP BY s.id
        ORDER BY product_count DESC
    ''')
    supplier_distribution = [dict(row) for row in cursor.fetchall()]

    conn.close()
    
    return jsonify({
        'kpis': {
            'total_products': total_products,
            'total_stock': total_stock,
            'inventory_value': round(inventory_value, 2),
            'total_revenue': round(total_revenue, 2),
            'low_stock_count': low_stock_count,
            'active_suppliers': active_suppliers
        },
        'low_stock_alerts': low_stock_products,
        'sales_trend': sales_trend,
        'category_sales': category_sales,
        'top_selling': top_selling,
        'supplier_distribution': supplier_distribution
    })

# SUPPLIER API ROUTES
@app.route('/api/suppliers', methods=['GET', 'POST'])
def handle_suppliers():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor.execute("SELECT * FROM suppliers ORDER BY name ASC")
        suppliers = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(suppliers)
        
    elif request.method == 'POST':
        data = request.json
        if not data or not data.get('name'):
            conn.close()
            return jsonify({'error': 'Supplier name is required'}), 400
            
        cursor.execute('''
            INSERT INTO suppliers (name, contact_name, email, phone, address, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'),
            data.get('contact_name', ''),
            data.get('email', ''),
            data.get('phone', ''),
            data.get('address', ''),
            data.get('status', 'Active')
        ))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({'message': 'Supplier created successfully', 'id': new_id}), 210

@app.route('/api/suppliers/<int:supplier_id>', methods=['PUT', 'DELETE'])
def handle_single_supplier(supplier_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM suppliers WHERE id = ?", (supplier_id,))
    supplier = cursor.fetchone()
    if not supplier:
        conn.close()
        return jsonify({'error': 'Supplier not found'}), 404
        
    if request.method == 'PUT':
        data = request.json
        if not data or not data.get('name'):
            conn.close()
            return jsonify({'error': 'Supplier name is required'}), 400
            
        cursor.execute('''
            UPDATE suppliers 
            SET name = ?, contact_name = ?, email = ?, phone = ?, address = ?, status = ?
            WHERE id = ?
        ''', (
            data.get('name'),
            data.get('contact_name', ''),
            data.get('email', ''),
            data.get('phone', ''),
            data.get('address', ''),
            data.get('status', 'Active'),
            supplier_id
        ))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Supplier updated successfully'})
        
    elif request.method == 'DELETE':
        # Check if supplier has linked products
        cursor.execute("SELECT COUNT(*) FROM products WHERE supplier_id = ?", (supplier_id,))
        linked_count = cursor.fetchone()[0]
        if linked_count > 0:
            # Instead of deleting, just deactivate the supplier or refuse delete
            conn.close()
            return jsonify({'error': 'Cannot delete supplier because products are linked to it. Deactivate instead.'}), 400
            
        cursor.execute("DELETE FROM suppliers WHERE id = ?", (supplier_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Supplier deleted successfully'})

# PRODUCTS API ROUTES
@app.route('/api/products', methods=['GET', 'POST'])
def handle_products():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor.execute('''
            SELECT p.*, s.name as supplier_name 
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            ORDER BY p.name ASC
        ''')
        products = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(products)
        
    elif request.method == 'POST':
        data = request.json
        required_fields = ['sku', 'name', 'price', 'cost_price']
        if not data or not all(field in data for field in required_fields):
            conn.close()
            return jsonify({'error': 'SKU, name, selling price, and cost price are required'}), 400
            
        # Check if SKU is unique
        cursor.execute("SELECT id FROM products WHERE sku = ?", (data['sku'],))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': f"Product SKU '{data['sku']}' already exists"}), 400
            
        stock_qty = int(data.get('stock_quantity', 0))
        min_lvl = int(data.get('min_stock_level', 10))
        status = determine_status(stock_qty, min_lvl)
        
        try:
            cursor.execute('''
                INSERT INTO products (sku, name, description, category, price, cost_price, stock_quantity, min_stock_level, supplier_id, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['sku'],
                data['name'],
                data.get('description', ''),
                data.get('category', 'General'),
                float(data['price']),
                float(data['cost_price']),
                stock_qty,
                min_lvl,
                data.get('supplier_id'),
                status
            ))
            product_id = cursor.lastrowid
            
            # Log stock initialization transaction
            if stock_qty > 0:
                cursor.execute('''
                    INSERT INTO stock_transactions (product_id, type, quantity, reference, notes)
                    VALUES (?, 'INCOMING', ?, 'INIT', 'Initial product entry')
                ''', (product_id, stock_qty))
                
            conn.commit()
            conn.close()
            return jsonify({'message': 'Product created successfully', 'id': product_id}), 201
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT', 'DELETE'])
def handle_single_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    product = cursor.fetchone()
    if not product:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404
        
    if request.method == 'PUT':
        data = request.json
        required_fields = ['sku', 'name', 'price', 'cost_price']
        if not data or not all(field in data for field in required_fields):
            conn.close()
            return jsonify({'error': 'SKU, name, selling price, and cost price are required'}), 400
            
        # Check SKU unique constraint if SKU changed
        if data['sku'] != product['sku']:
            cursor.execute("SELECT id FROM products WHERE sku = ? AND id != ?", (data['sku'], product_id))
            if cursor.fetchone():
                conn.close()
                return jsonify({'error': f"Product SKU '{data['sku']}' is already used by another product"}), 400
                
        stock_qty = int(data.get('stock_quantity', product['stock_quantity']))
        min_lvl = int(data.get('min_stock_level', product['min_stock_level']))
        status = determine_status(stock_qty, min_lvl)
        
        try:
            cursor.execute('''
                UPDATE products 
                SET sku = ?, name = ?, description = ?, category = ?, price = ?, cost_price = ?, stock_quantity = ?, min_stock_level = ?, supplier_id = ?, status = ?
                WHERE id = ?
            ''', (
                data['sku'],
                data['name'],
                data.get('description', ''),
                data.get('category', 'General'),
                float(data['price']),
                float(data['cost_price']),
                stock_qty,
                min_lvl,
                data.get('supplier_id'),
                status,
                product_id
            ))
            
            # If stock quantity was adjusted manually through direct field editing, log it
            if stock_qty != product['stock_quantity']:
                diff = stock_qty - product['stock_quantity']
                trans_type = 'INCOMING' if diff > 0 else 'OUTGOING'
                cursor.execute('''
                    INSERT INTO stock_transactions (product_id, type, quantity, reference, notes)
                    VALUES (?, ?, ?, 'EDIT', 'Manual product details modification')
                ''', (product_id, trans_type, abs(diff)))
                
            conn.commit()
            conn.close()
            return jsonify({'message': 'Product updated successfully'})
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500
            
    elif request.method == 'DELETE':
        # Check if product is in sales_items or stock_transactions
        cursor.execute("SELECT COUNT(*) FROM sales_items WHERE product_id = ?", (product_id,))
        sales_count = cursor.fetchone()[0]
        
        if sales_count > 0:
            # We can't hard delete to preserve historical integrity. Deactivate or flag instead.
            conn.close()
            return jsonify({'error': 'Cannot delete product with historical sales records. Set stock to 0 or archive instead.'}), 400
            
        cursor.execute("DELETE FROM stock_transactions WHERE product_id = ?", (product_id,))
        cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Product deleted successfully'})

# STOCK TRANSACTION QUICK ADJUSTMENT
@app.route('/api/products/<int:product_id>/adjust-stock', methods=['POST'])
def adjust_stock(product_id):
    data = request.json
    if not data or 'quantity' not in data or 'type' not in data:
        return jsonify({'error': 'Quantity and adjustment type (INCOMING/OUTGOING/ADJUSTMENT) are required'}), 400
        
    qty = int(data['quantity'])
    adj_type = data['type']
    reference = data.get('reference', 'ADJ')
    notes = data.get('notes', 'Manual Adjustment')
    
    if qty <= 0:
        return jsonify({'error': 'Quantity must be greater than zero'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    product = cursor.fetchone()
    if not product:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404
        
    current_stock = product['stock_quantity']
    
    if adj_type == 'INCOMING':
        new_stock = current_stock + qty
    elif adj_type == 'OUTGOING':
        if current_stock < qty:
            conn.close()
            return jsonify({'error': f"Insufficient stock. Current stock is {current_stock}, cannot deduct {qty}"}), 400
        new_stock = current_stock - qty
    elif adj_type == 'ADJUSTMENT':
        # Overwrite stock directly
        new_stock = qty
        qty_diff = new_stock - current_stock
        # Log as appropriate direction
        adj_type = 'INCOMING' if qty_diff >= 0 else 'OUTGOING'
        qty = abs(qty_diff)
    else:
        conn.close()
        return jsonify({'error': 'Invalid adjustment type'}), 400
        
    status = determine_status(new_stock, product['min_stock_level'])
    
    try:
        # Update product stock
        cursor.execute('''
            UPDATE products 
            SET stock_quantity = ?, status = ? 
            WHERE id = ?
        ''', (new_stock, status, product_id))
        
        # Insert audit transaction
        cursor.execute('''
            INSERT INTO stock_transactions (product_id, type, quantity, reference, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (product_id, adj_type, qty, reference, notes))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Stock adjusted successfully', 'new_stock': new_stock})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

# SALES API ROUTES (Point of Sale Transaction Processing)
@app.route('/api/sales', methods=['GET', 'POST'])
def handle_sales():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.method == 'GET':
        # Get all sales with sales item summary
        cursor.execute("SELECT * FROM sales ORDER BY id DESC")
        sales = [dict(row) for row in cursor.fetchall()]
        
        # Fetch items for each sale
        for sale in sales:
            cursor.execute('''
                SELECT si.*, p.name as product_name, p.sku as product_sku
                FROM sales_items si
                JOIN products p ON si.product_id = p.id
                WHERE si.sale_id = ?
            ''', (sale['id'],))
            sale['items'] = [dict(row) for row in cursor.fetchall()]
            
        conn.close()
        return jsonify(sales)
        
    elif request.method == 'POST':
        data = request.json
        if not data or not data.get('items') or len(data['items']) == 0:
            conn.close()
            return jsonify({'error': 'Sale items are required to process a sale'}), 400
            
        customer_name = data.get('customer_name', 'Walk-in Customer')
        payment_method = data.get('payment_method', 'Cash')
        items = data['items'] # List of {product_id, quantity, unit_price}
        
        try:
            # We use transactional control for atomicity and consistency
            cursor.execute("BEGIN TRANSACTION")
            
            total_amount = 0.0
            processed_items = []
            
            # Verify and update stock for each item
            for item in items:
                prod_id = item['product_id']
                req_qty = int(item['quantity'])
                
                cursor.execute("SELECT * FROM products WHERE id = ?", (prod_id,))
                product = cursor.fetchone()
                if not product:
                    raise Exception(f"Product ID {prod_id} not found")
                    
                current_stock = product['stock_quantity']
                if current_stock < req_qty:
                    raise Exception(f"Insufficient stock for product '{product['name']}'. Requested: {req_qty}, In stock: {current_stock}")
                    
                unit_price = float(item.get('unit_price', product['price']))
                total_item_price = unit_price * req_qty
                total_amount += total_item_price
                
                new_stock = current_stock - req_qty
                status = determine_status(new_stock, product['min_stock_level'])
                
                # Update stock
                cursor.execute("UPDATE products SET stock_quantity = ?, status = ? WHERE id = ?", (new_stock, status, prod_id))
                
                # Track transaction
                cursor.execute('''
                    INSERT INTO stock_transactions (product_id, type, quantity, reference, notes)
                    VALUES (?, 'OUTGOING', ?, 'SALE', ?)
                ''', (prod_id, req_qty, f"Sold to {customer_name}"))
                
                processed_items.append({
                    'product_id': prod_id,
                    'quantity': req_qty,
                    'unit_price': unit_price,
                    'total_price': total_item_price
                })
                
            # Create sale header
            cursor.execute('''
                INSERT INTO sales (customer_name, payment_method, total_amount)
                VALUES (?, ?, ?)
            ''', (customer_name, payment_method, total_amount))
            sale_id = cursor.lastrowid
            
            # Create sale detail items
            for pi in processed_items:
                cursor.execute('''
                    INSERT INTO sales_items (sale_id, product_id, quantity, unit_price, total_price)
                    VALUES (?, ?, ?, ?, ?)
                ''', (sale_id, pi['product_id'], pi['quantity'], pi['unit_price'], pi['total_price']))
                
            cursor.execute("COMMIT")
            conn.close()
            return jsonify({'message': 'Sale completed successfully', 'sale_id': sale_id, 'total_amount': total_amount}), 201
            
        except Exception as e:
            cursor.execute("ROLLBACK")
            conn.close()
            return jsonify({'error': str(e)}), 400

# TRANSACTION LOG API
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT t.*, p.name as product_name, p.sku as product_sku
        FROM stock_transactions t
        LEFT JOIN products p ON t.product_id = p.id
        ORDER BY t.id DESC
    ''')
    transactions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(transactions)

if __name__ == '__main__':
    init_db()
    # Run the server on port 5000
    app.run(debug=True, port=5000)
