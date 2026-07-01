import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, Trash2, IndianRupee, 
  CreditCard, Calendar, User, Eye, EyeOff, ClipboardList, RefreshCw 
} from 'lucide-react';

export default function Sales({ triggerToast }) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Sales history expand state
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  const fetchSalesAndProducts = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch('http://localhost:5000/api/products');
      const prodData = await prodRes.json();
      setProducts(prodData);

      const salesRes = await fetch('http://localhost:5000/api/sales');
      const salesData = await salesRes.json();
      setSales(salesData);
    } catch (err) {
      console.error(err);
      triggerToast('Error loading sales data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAndProducts();
  }, []);

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      triggerToast(`Product '${product.name}' is currently out of stock`, 'error');
      return;
    }

    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        triggerToast(`Insufficient stock! Only ${product.stock_quantity} units available.`, 'warning');
        return;
      }
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        unit_price: product.price,
        max_stock: product.stock_quantity,
        quantity: 1
      }]);
    }
    triggerToast(`Added ${product.name} to cart`, 'success');
  };

  const updateQuantity = (productId, change) => {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.max_stock) {
      triggerToast(`Cannot exceed current stock level (${item.max_stock} units)`, 'warning');
      return;
    }

    setCart(cart.map(i => 
      i.product_id === productId ? { ...i, quantity: newQty } : i
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
    triggerToast('Item removed from cart', 'info');
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      triggerToast('Your shopping cart is empty!', 'error');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          payment_method: paymentMethod,
          items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout process failed');
      }

      triggerToast(`Checkout completed! Total: ₹${data.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 'success');
      setCart([]);
      setCustomerName('Walk-in Customer');
      setPaymentMethod('Cash');
      fetchSalesAndProducts();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const toggleExpandSale = (saleId) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
    } else {
      setExpandedSaleId(saleId);
    }
  };

  // Filter products for catalog quick list
  const filteredProducts = products.filter(p => 
    p.status !== 'Out of Stock' && (
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    )
  );

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Sales & POS Registry</h1>
          <p>Record checkout transactions, issue digital logs, and browse sales invoices.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchSalesAndProducts}>
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>
      </div>

      {/* POS Checkout Area */}
      <div className="pos-layout">
        {/* Left Panel: Catalog Selection & Cart Items */}
        <div className="pos-cart-panel">
          <div className="chart-header" style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
            <span className="chart-title">Point-of-Sale Checkout Panel</span>
          </div>

          {/* Product quick add list */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Catalog to Add Item</label>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Type SKU or item name..." 
                className="form-control"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            
            {productSearch && (
              <div style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-sm)', 
                maxHeight: '180px', 
                overflowY: 'auto', 
                marginTop: '6px', 
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-md)',
                zIndex: 10
              }}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(prod => (
                    <div 
                      key={prod.id} 
                      onClick={() => {
                        addToCart(prod);
                        setProductSearch('');
                      }}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '10px 14px', 
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '0.85rem'
                      }}
                      className="search-row-hover"
                    >
                      <div>
                        <strong>{prod.sku}</strong> — {prod.name}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Stock: {prod.stock_quantity}</span>
                        <span className="badge badge-info">₹{prod.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No matching items in stock.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="checkout-divider"></div>

          {/* Cart items list */}
          <div className="cart-items-list">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div className="cart-item-row" key={item.product_id}>
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    <p>{item.sku} • ₹{item.unit_price.toLocaleString('en-IN', {minimumFractionDigits: 2})} each</p>
                  </div>
                  
                  <div className="cart-item-quantity">
                    <button className="qty-btn" onClick={() => updateQuantity(item.product_id, -1)}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontWeight: 600, width: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                      {item.quantity}
                    </span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.product_id, 1)}>
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="cart-item-price">
                    ₹{(item.unit_price * item.quantity).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </div>

                  <button 
                    className="action-btn delete" 
                    title="Remove item" 
                    onClick={() => removeFromCart(item.product_id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <ShoppingBag size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h4>Shopping cart is empty</h4>
                <p style={{ fontSize: '0.825rem' }}>Select products from search above to build sale invoice.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Transaction Billing Details */}
        <div className="cart-checkout-panel">
          <div className="chart-header">
            <span className="chart-title">Billing Details</span>
          </div>

          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Customer Name</label>
              <div className="search-input-wrapper">
                <User size={16} className="search-icon" />
                <input 
                  type="text" 
                  className="form-control"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Method</label>
              <div className="search-input-wrapper">
                <CreditCard size={16} className="search-icon" />
                <select 
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash">Cash Transaction</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Direct Bank Wire</option>
                  <option value="Store Credit">Store Credit Account</option>
                </select>
              </div>
            </div>

            <div className="checkout-divider" style={{ margin: '8px 0' }}></div>

            <div className="checkout-summary-row">
              <span style={{ color: 'var(--text-secondary)' }}>Items Count</span>
              <span style={{ fontWeight: 600 }}>{cart.reduce((acc, i) => acc + i.quantity, 0)} units</span>
            </div>

            <div className="checkout-summary-row total">
              <span>Total Price</span>
              <span>₹{calculateSubtotal().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>

            <button 
              className="btn btn-primary" 
              type="submit"
              disabled={cart.length === 0}
              style={{ width: '100%', padding: '12px', marginTop: '12px' }}
            >
              <IndianRupee size={18} /> Process Checkout Invoice
            </button>
          </form>
        </div>
      </div>

      {/* Invoice Ledger History List */}
      <div className="data-card" style={{ marginTop: '24px' }}>
        <div className="table-filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={18} style={{ color: 'var(--text-secondary)' }} />
            <h3 className="chart-title" style={{ margin: 0 }}>Sales Invoices Ledger</h3>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading ledger...</div>
          ) : sales.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date & Time</th>
                  <th>Customer Profile</th>
                  <th>Payment Type</th>
                  <th>Invoice Value</th>
                  <th style={{ textAlign: 'right' }}>Line Items</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const isExpanded = expandedSaleId === sale.id;
                  const saleDate = new Date(sale.sale_date);
                  const formattedDate = saleDate.toLocaleDateString('en-IN', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  }) + ' ' + saleDate.toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <React.Fragment key={sale.id}>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>#INV-0{sale.id}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                            {formattedDate}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{sale.customer_name}</td>
                        <td>
                          <span className="badge badge-info" style={{ display: 'inline-flex', gap: '4px' }}>
                            <CreditCard size={10} />
                            {sale.payment_method}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--success-hover)' }}>
                          ₹{sale.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ display: 'inline-flex', gap: '6px' }}
                            onClick={() => toggleExpandSale(sale.id)}
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff size={12} /> Hide items
                              </>
                            ) : (
                              <>
                                <Eye size={12} /> View items ({sale.items?.length || 0})
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr>
                          <td colSpan="6" style={{ backgroundColor: 'var(--bg-primary)', padding: '16px 32px' }}>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white', overflow: 'hidden' }}>
                              <table style={{ margin: 0 }}>
                                <thead style={{ backgroundColor: '#f8fafc' }}>
                                  <tr>
                                    <th style={{ padding: '8px 16px', fontSize: '0.725rem' }}>Product item</th>
                                    <th style={{ padding: '8px 16px', fontSize: '0.725rem' }}>SKU</th>
                                    <th style={{ padding: '8px 16px', fontSize: '0.725rem' }}>Qty</th>
                                    <th style={{ padding: '8px 16px', fontSize: '0.725rem', textAlign: 'right' }}>Unit cost</th>
                                    <th style={{ padding: '8px 16px', fontSize: '0.725rem', textAlign: 'right' }}>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sale.items?.map((item, idx) => (
                                    <tr key={idx}>
                                      <td style={{ padding: '10px 16px', fontSize: '0.85rem' }}>{item.product_name || 'Deleted Product'}</td>
                                      <td style={{ padding: '10px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.product_sku || 'N/A'}</td>
                                      <td style={{ padding: '10px 16px', fontSize: '0.85rem', fontWeight: 600 }}>{item.quantity} units</td>
                                      <td style={{ padding: '10px 16px', fontSize: '0.85rem', textAlign: 'right' }}>₹{item.unit_price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                      <td style={{ padding: '10px 16px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600 }}>₹{item.total_price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><ClipboardList size={24} /></div>
              <h3>No invoices generated</h3>
              <p>Process customer orders inside the POS checkout panel above to register sales invoices.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
