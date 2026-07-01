import React, { useState } from 'react';
import { 
  LayoutDashboard, Package, ClipboardList, Users, 
  IndianRupee, BarChart3, ShieldCheck 
} from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Suppliers from './pages/Suppliers';
import Sales from './pages/Sales';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  // Toast trigger callback
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'products':
        return <Products triggerToast={showToast} />;
      case 'stock':
        return <Stock triggerToast={showToast} />;
      case 'suppliers':
        return <Suppliers triggerToast={showToast} />;
      case 'sales':
        return <Sales triggerToast={showToast} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">SW</div>
          <div className="logo-text">StockWise</div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} />
            Products Catalog
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <ClipboardList size={18} />
            Stock Ledger
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => setActiveTab('suppliers')}
          >
            <Users size={18} />
            Supplier Directory
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            <IndianRupee size={18} />
            POS & Sales
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
            <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
            <span>Admin Operator</span>
          </div>
          <div>Enterprise Portal v1.0</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Dynamic Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
