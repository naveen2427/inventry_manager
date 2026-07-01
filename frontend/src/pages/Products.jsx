import React, { useEffect, useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, SlidersHorizontal, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Package, IndianRupee, RefreshCw 
} from 'lucide-react';
import Modal from '../components/Modal';
import { API_BASE_URL } from '../config';

export default function Products({ triggerToast }) {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form states
  const [productForm, setProductForm] = useState({
    sku: '', name: '', description: '', category: 'Electronics', 
    price: '', cost_price: '', stock_quantity: 0, min_stock_level: 5, supplier_id: ''
  });
  const [adjustForm, setAdjustForm] = useState({
    type: 'INCOMING', quantity: '', reference: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch(`${API_BASE_URL}/api/products`);
      const prodData = await prodRes.json();
      setProducts(prodData);

      const suppRes = await fetch(`${API_BASE_URL}/api/suppliers`);
      const suppData = await suppRes.json();
      setSuppliers(suppData.filter(s => s.status === 'Active'));
    } catch (err) {
      console.error(err);
      triggerToast('Error fetching data from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setSelectedProduct(null);
    setProductForm({
      sku: '', name: '', description: '', category: 'Electronics', 
      price: '', cost_price: '', stock_quantity: 0, min_stock_level: 5, supplier_id: suppliers[0]?.id || ''
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category || 'General',
      price: product.price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level,
      supplier_id: product.supplier_id || ''
    });
    setIsProductModalOpen(true);
  };

  const handleOpenAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustForm({
      type: 'INCOMING', quantity: '', reference: '', notes: ''
    });
    setIsAdjustModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!selectedProduct;
    const url = isEdit 
      ? `${API_BASE_URL}/api/products/${selectedProduct.id}`
      : `${API_BASE_URL}/api/products`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      triggerToast(isEdit ? 'Product updated successfully' : 'Product created successfully', 'success');
      setIsProductModalOpen(false);
      fetchData();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.quantity || parseInt(adjustForm.quantity) <= 0) {
      triggerToast('Please enter a valid quantity greater than 0', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${selectedProduct.id}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: adjustForm.type,
          quantity: parseInt(adjustForm.quantity),
          reference: adjustForm.reference || 'MANUAL-ADJ',
          notes: adjustForm.notes
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Stock adjustment failed');
      }

      triggerToast('Stock adjusted successfully', 'success');
      setIsAdjustModalOpen(false);
      fetchData();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? Historical sales logs may prevent deletion.')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      triggerToast('Product deleted successfully', 'success');
      fetchData();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  // Extract all categories for filters
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Filtering Logic
  const filteredProducts = products.filter(prod => {
    const matchesSearch = 
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = !categoryFilter || prod.category === categoryFilter;
    const matchesSupplier = !supplierFilter || prod.supplier_id === parseInt(supplierFilter);
    
    let matchesStock = true;
    if (stockFilter === 'in_stock') {
      matchesStock = prod.stock_quantity > prod.min_stock_level;
    } else if (stockFilter === 'low_stock') {
      matchesStock = prod.stock_quantity > 0 && prod.stock_quantity <= prod.min_stock_level;
    } else if (stockFilter === 'out_of_stock') {
      matchesStock = prod.stock_quantity <= 0;
    }

    return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
  });

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Product Catalog</h1>
          <p>Create, update, delete, and check stock levels of products.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchData}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="data-card">
        {/* Search & Filter Bar */}
        <div className="table-filter-bar">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search SKU or name..." 
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <SlidersHorizontal size={16} style={{ color: 'var(--text-secondary)' }} />
            
            <select 
              className="form-control filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>

            <select 
              className="form-control filter-select"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select 
              className="form-control filter-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="">All Stock Levels</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock Warnings</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading catalog...</div>
          ) : filteredProducts.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Pricing</th>
                  <th>Stock Quantity</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(prod => {
                  let badgeClass = 'badge-success';
                  if (prod.stock_quantity <= 0) badgeClass = 'badge-danger';
                  else if (prod.stock_quantity <= prod.min_stock_level) badgeClass = 'badge-warning';

                  return (
                    <tr key={prod.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{prod.sku}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.name}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prod.description || 'No description provided'}
                        </div>
                      </td>
                      <td><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{prod.category}</span></td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>Sell: <strong>₹{prod.price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cost: ₹{prod.cost_price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700 }}>{prod.stock_quantity}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ min: {prod.min_stock_level}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {prod.supplier_name || 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          {prod.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="action-btn" 
                            title="Adjust Stock"
                            onClick={() => handleOpenAdjustModal(prod)}
                          >
                            <Package size={16} />
                          </button>
                          <button 
                            className="action-btn" 
                            title="Edit details"
                            onClick={() => handleOpenEditModal(prod)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="action-btn delete" 
                            title="Delete product"
                            onClick={() => handleDeleteProduct(prod.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Package size={24} /></div>
              <h3>No products found</h3>
              <p>Try adjusting your search criteria or register a new product.</p>
              <button className="btn btn-primary" onClick={handleOpenAddModal}>Add First Product</button>
            </div>
          )}
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? 'Modify Product Details' : 'Register New Product'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" form="product-form">Save Product</button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleProductSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">SKU (Unique Identifier)</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. PROD-1002"
                required
                value={productForm.sku}
                onChange={(e) => setProductForm({...productForm, sku: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Logitech MX Mouse"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
              />
            </div>
            
            <div className="form-group full-width">
              <label className="form-label">Description</label>
              <textarea 
                className="form-control" 
                placeholder="Details, dimensions, or technical specifications..."
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Electronics, Furniture"
                required
                value={productForm.category}
                onChange={(e) => setProductForm({...productForm, category: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Supplier Partner</label>
              <select 
                className="form-control"
                required
                value={productForm.supplier_id}
                onChange={(e) => setProductForm({...productForm, supplier_id: e.target.value})}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cost Price (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                className="form-control" 
                placeholder="0.00"
                required
                value={productForm.cost_price}
                onChange={(e) => setProductForm({...productForm, cost_price: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Selling Price (₹)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                className="form-control" 
                placeholder="0.00"
                required
                value={productForm.price}
                onChange={(e) => setProductForm({...productForm, price: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Starting Stock Quantity</label>
              <input 
                type="number" 
                min="0" 
                className="form-control" 
                disabled={!!selectedProduct} /* Don't overwrite stock directly through details, enforce transactions */
                value={productForm.stock_quantity}
                onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Min Warning Threshold</label>
              <input 
                type="number" 
                min="0" 
                className="form-control" 
                required
                value={productForm.min_stock_level}
                onChange={(e) => setProductForm({...productForm, min_stock_level: e.target.value})}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock: ${selectedProduct?.name}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" form="adjust-form">Process Adjustment</button>
          </>
        }
      >
        {selectedProduct && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem' }}>
              Current stock level: <strong>{selectedProduct.stock_quantity} units</strong>. Min alert limit: {selectedProduct.min_stock_level} units.
            </div>
          </div>
        )}
        <form id="adjust-form" onSubmit={handleAdjustSubmit}>
          <div className="form-group">
            <label className="form-label">Adjustment Flow Direction</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="adjust_type" 
                  value="INCOMING" 
                  checked={adjustForm.type === 'INCOMING'}
                  onChange={() => setAdjustForm({...adjustForm, type: 'INCOMING'})}
                />
                <span className="badge badge-success" style={{ padding: '4px 10px' }}>
                  <ArrowUpRight size={12} /> Stock In / Restock
                </span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="adjust_type" 
                  value="OUTGOING"
                  checked={adjustForm.type === 'OUTGOING'}
                  onChange={() => setAdjustForm({...adjustForm, type: 'OUTGOING'})}
                />
                <span className="badge badge-danger" style={{ padding: '4px 10px' }}>
                  <ArrowDownRight size={12} /> Stock Out / Deduct
                </span>
              </label>
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input 
                type="number" 
                min="1" 
                className="form-control" 
                required
                placeholder="Enter unit quantity"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({...adjustForm, quantity: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Reference ID / PO</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. PO-10492"
                value={adjustForm.reference}
                onChange={(e) => setAdjustForm({...adjustForm, reference: e.target.value.toUpperCase()})}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Audit Notes</label>
              <textarea 
                className="form-control" 
                placeholder="Reason for adjustment, inspector comments..."
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({...adjustForm, notes: e.target.value})}
              />
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
