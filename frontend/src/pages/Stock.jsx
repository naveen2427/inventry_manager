import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, FileText, 
  Layers, MessageSquare 
} from 'lucide-react';

export default function Stock({ triggerToast }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/transactions');
      if (!res.ok) throw new Error('Failed to load transaction history');
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error(err);
      triggerToast('Error loading transaction audit log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Stock Transactions</h1>
          <p>Complete historical ledger of all inventory additions, deductions, and adjustments.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchTransactions}>
            <RefreshCw size={16} /> Refresh Log
          </button>
        </div>
      </div>

      <div className="data-card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading ledger data...</div>
          ) : transactions.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product info</th>
                  <th>SKU</th>
                  <th>Adjustment Type</th>
                  <th>Quantity</th>
                  <th>Reference Code</th>
                  <th>Auditor Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isIncoming = tx.type === 'INCOMING';
                  const badgeClass = isIncoming ? 'badge-success' : 'badge-danger';
                  
                  // Format Date
                  const txDate = new Date(tx.created_at);
                  const formattedDate = txDate.toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  }) + ' ' + txDate.toLocaleTimeString(undefined, {
                    hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          {formattedDate}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{tx.product_name || 'Deleted Product'}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {tx.product_sku || 'N/A'}
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          {isIncoming ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {isIncoming ? '+' : '-'}{tx.quantity}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                          {tx.reference || '—'}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MessageSquare size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {tx.notes || '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Layers size={24} /></div>
              <h3>No transaction logs</h3>
              <p>Inventory stock operations will appear here once products are created or adjusted.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
