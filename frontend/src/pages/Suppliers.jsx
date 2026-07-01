import React, { useEffect, useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Users, Mail, Phone, MapPin, 
  User, CheckCircle, XCircle, RefreshCw 
} from 'lucide-react';
import Modal from '../components/Modal';
import { API_BASE_URL } from '../config';

export default function Suppliers({ triggerToast }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Form state
  const [supplierForm, setSupplierForm] = useState({
    name: '', contact_name: '', email: '', phone: '', address: '', status: 'Active'
  });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers`);
      if (!res.ok) throw new Error('Failed to load suppliers');
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
      triggerToast('Error loading suppliers list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAddModal = () => {
    setSelectedSupplier(null);
    setSupplierForm({
      name: '', contact_name: '', email: '', phone: '', address: '', status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      status: supplier.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!selectedSupplier;
    const url = isEdit 
      ? `${API_BASE_URL}/api/suppliers/${selectedSupplier.id}`
      : `${API_BASE_URL}/api/suppliers`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      triggerToast(isEdit ? 'Supplier updated successfully' : 'Supplier created successfully', 'success');
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier? It will fail if products are currently linked to this supplier.')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete supplier');
      }

      triggerToast('Supplier deleted successfully', 'success');
      fetchSuppliers();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contact_name && s.contact_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Supplier Directory</h1>
          <p>Manage external partners, contact channels, and supplier verification status.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchSuppliers}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      <div className="data-card">
        {/* Search Bar */}
        <div className="table-filter-bar">
          <div className="search-input-wrapper" style={{ maxWidth: '420px' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by company or contact name..." 
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Suppliers List */}
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading suppliers...</div>
          ) : filteredSuppliers.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Supplier / Company</th>
                  <th>Primary Contact</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Corporate Address</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(supp => {
                  const isActive = supp.status === 'Active';
                  return (
                    <tr key={supp.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{supp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered ID: #SUP-{supp.id}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                          <User size={14} style={{ color: 'var(--text-muted)' }} />
                          {supp.contact_name || '—'}
                        </div>
                      </td>
                      <td>
                        {supp.email ? (
                          <a href={`mailto:${supp.email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
                            <Mail size={14} />
                            {supp.email}
                          </a>
                        ) : '—'}
                      </td>
                      <td>
                        {supp.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                            {supp.phone}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        {supp.address ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={supp.address}>
                            <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            {supp.address}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                          <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}></span>
                          {supp.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button 
                            className="action-btn" 
                            title="Edit details"
                            onClick={() => handleOpenEditModal(supp)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="action-btn delete" 
                            title="Delete supplier"
                            onClick={() => handleDelete(supp.id)}
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
              <div className="empty-state-icon"><Users size={24} /></div>
              <h3>No suppliers registered</h3>
              <p>Supplier profiles are required to catalogue products and assign inventory ownership.</p>
              <button className="btn btn-primary" onClick={handleOpenAddModal}>Register First Supplier</button>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSupplier ? 'Modify Supplier details' : 'Register New Supplier'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" type="submit" form="supplier-form">Save Partner</button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Supplier / Company Name</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. TechWorld Distributors Ltd"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Primary Contact Person</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Alice Smith"
                value={supplierForm.contact_name}
                onChange={(e) => setSupplierForm({...supplierForm, contact_name: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Partnership Status</label>
              <select 
                className="form-control"
                value={supplierForm.status}
                onChange={(e) => setSupplierForm({...supplierForm, status: e.target.value})}
              >
                <option value="Active">Active / Approved</option>
                <option value="Inactive">Inactive / Suspended</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="alice@techworld.com"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="+1 (555) 019-2831"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Corporate Headquarters Address</label>
            <textarea 
              className="form-control" 
              placeholder="Full mailing address..."
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
