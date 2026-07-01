import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Package, TrendingUp, AlertTriangle, AlertOctagon, IndianRupee, Users, Award 
} from 'lucide-react';
import MetricCard from '../components/MetricCard';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to Flask backend. Please make sure the server is running on http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll stats every 10 seconds for real-time adjustments representation
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading business metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--danger)' }}>
          <AlertOctagon />
          <strong>System Connection Error</strong>
        </div>
        <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>{error}</p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={fetchStats}>
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, low_stock_alerts, sales_trend, category_sales, top_selling, supplier_distribution } = stats;

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Analytics Dashboard</h1>
          <p>Real-time insights and operational overview of your inventory system.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setActiveTab('sales')}>
            <IndianRupee size={16} /> Record Sale
          </button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {low_stock_alerts.length > 0 && (
        <div className="alert-banner">
          <AlertTriangle size={24} style={{ color: '#b45309', flexShrink: 0, marginTop: '2px' }} />
          <div className="alert-content">
            <div className="alert-title">Critical Attention Needed: {low_stock_alerts.length} Items Low or Out of Stock</div>
            <div className="alert-desc">The following items are running below minimum safety levels. Place restocking orders immediately.</div>
            <div className="alert-list">
              {low_stock_alerts.map(prod => (
                <div className="alert-tag" key={prod.id}>
                  <strong>{prod.sku}</strong> ({prod.name}) — Stock: {prod.stock_quantity}/{prod.min_stock_level}
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'center', border: '1px solid #d97706', color: '#b45309' }} onClick={() => setActiveTab('products')}>
            Restock Items
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="metrics-grid">
        <MetricCard 
          title="Total Products" 
          value={kpis.total_products} 
          icon={Package} 
          color="var(--primary)" 
          bgLight="var(--primary-light)"
          subtext="Unique catalog items"
        />
        <MetricCard 
          title="Inventory Value" 
          value={`₹${kpis.inventory_value.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
          icon={TrendingUp} 
          color="var(--success)" 
          bgLight="var(--success-light)"
          subtext="Total asset cost valuation"
        />
        <MetricCard 
          title="Total Revenue" 
          value={`₹${kpis.total_revenue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
          icon={IndianRupee} 
          color="var(--info)" 
          bgLight="var(--info-light)"
          subtext="Accumulated sales receipts"
        />
        <MetricCard 
          title="Low Stock Warning" 
          value={kpis.low_stock_count} 
          icon={AlertTriangle} 
          color={kpis.low_stock_count > 0 ? "var(--danger)" : "var(--warning)"} 
          bgLight={kpis.low_stock_count > 0 ? "var(--danger-light)" : "var(--warning-light)"}
          subtext="Below safety stock margins"
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Sales Trend Line Chart */}
        <div className="chart-card charts-row-full">
          <div className="chart-header">
            <span className="chart-title">Revenue Trends (Last 7 Days)</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sales_trend} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 'Revenue']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Sales Revenue"
                  stroke="var(--primary)" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Sales Revenue by Category</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={category_sales} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 'Sales Revenue']} />
                <Bar dataKey="revenue" name="Total Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                  {category_sales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Supplier Distribution Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Supplier Product Distribution</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={supplier_distribution.filter(s => s.product_count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="product_count"
                  nameKey="supplier_name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {supplier_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Products`, 'Inventory Catalog']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="chart-card charts-row-full">
          <div className="chart-header">
            <span className="chart-title">Top Selling Products</span>
            <span className="badge badge-success"><Award size={12} /> High Performance</span>
          </div>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 0 }}>Product</th>
                  <th>SKU</th>
                  <th>Quantity Sold</th>
                  <th style={{ textAlign: 'right', paddingRight: 0 }}>Total Sales Volume</th>
                </tr>
              </thead>
              <tbody>
                {top_selling.length > 0 ? (
                  top_selling.map((prod, index) => (
                    <tr key={index}>
                      <td style={{ paddingLeft: 0, fontWeight: 600 }}>{prod.name}</td>
                      <td>{prod.sku}</td>
                      <td>{prod.quantity_sold} units</td>
                      <td style={{ textAlign: 'right', paddingRight: 0, fontWeight: 600, color: 'var(--success-hover)' }}>
                        ₹{prod.total_sales.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px 0' }}>No sales data available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
