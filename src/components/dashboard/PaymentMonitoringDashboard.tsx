import React, { useState, useMemo, useEffect } from 'react';
import { theme, getTheme } from '@/constants/theme';
import styles from './PaymentMonitoringDashboard.module.css';

interface PaymentMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalRevenue: number;
  averageTransactionAmount: number;
  successRate: number;
  pendingWithdrawals: number;
  totalWithdrawalAmount: number;
  suspiciousActivities: number;
}

interface TransactionSummary {
  date: string;
  transactions: number;
  revenue: number;
  successRate: number;
}

interface WithdrawalRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
}

interface Props {
  isDarkMode?: boolean;
  metrics?: PaymentMetrics;
  recentTransactions?: TransactionSummary[];
  pendingWithdrawals?: WithdrawalRequest[];
  isLoading?: boolean;
  onApproveWithdrawal?: (id: string) => Promise<void>;
  onRejectWithdrawal?: (id: string) => Promise<void>;
}

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  icon: string;
  trend?: { value: number; positive: boolean };
  isDarkMode: boolean;
}> = ({ label, value, icon, trend, isDarkMode }) => {
  const palette = getTheme(isDarkMode);
  return (
    <div
      className={styles.metricCard}
      style={{
        backgroundColor: palette.surface,
        borderColor: palette.border,
        color: palette.text,
      }}
    >
      <div className={styles.metricHeader}>
        <span className={styles.metricIcon}>{icon}</span>
        <span className={styles.metricLabel}>{label}</span>
      </div>
      <div className={styles.metricValue}>{value}</div>
      {trend && (
        <div
          className={styles.metricTrend}
          style={{
            color: trend.positive ? palette.success : palette.error,
          }}
        >
          {trend.positive ? '📈' : '📉'} {trend.value}%
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{
  status: string;
  isDarkMode: boolean;
}> = ({ status, isDarkMode }) => {
  const palette = getTheme(isDarkMode);
  let bgColor = palette.surface;
  let textColor = palette.text;

  switch (status) {
    case 'completed':
      bgColor = palette.successLight;
      textColor = palette.success;
      break;
    case 'pending':
      bgColor = palette.warningLight;
      textColor = palette.warning;
      break;
    case 'processing':
      bgColor = palette.infoLight;
      textColor = palette.info;
      break;
    case 'failed':
      bgColor = palette.errorLight;
      textColor = palette.error;
      break;
  }

  return (
    <span
      className={styles.statusBadge}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export const PaymentMonitoringDashboard: React.FC<Props> = ({
  isDarkMode = false,
  metrics = {
    totalTransactions: 1234,
    successfulTransactions: 1210,
    failedTransactions: 24,
    totalRevenue: 125430.50,
    averageTransactionAmount: 101.83,
    successRate: 98.05,
    pendingWithdrawals: 12,
    totalWithdrawalAmount: 45320.00,
    suspiciousActivities: 3,
  },
  recentTransactions = [
    { date: '2026-08-21', transactions: 156, revenue: 15823.40, successRate: 98.7 },
    { date: '2026-08-20', transactions: 143, revenue: 14521.30, successRate: 97.9 },
    { date: '2026-08-19', transactions: 165, revenue: 16234.80, successRate: 98.2 },
  ],
  pendingWithdrawals = [
    {
      id: '1',
      vendorId: 'v1',
      vendorName: 'TechStore Ghana',
      amount: 5000,
      method: 'MTN Mobile Money',
      status: 'pending',
      requestedAt: '2026-08-21T10:30:00',
    },
    {
      id: '2',
      vendorId: 'v2',
      vendorName: 'Fashion Hub',
      amount: 8500,
      method: 'Bank Transfer',
      status: 'processing',
      requestedAt: '2026-08-21T09:15:00',
    },
  ],
  isLoading = false,
  onApproveWithdrawal,
  onRejectWithdrawal,
}) => {
  const palette = getTheme(isDarkMode);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleApprove = async (id: string) => {
    if (!onApproveWithdrawal) return;
    try {
      setProcessingIds((prev) => new Set(prev).add(id));
      await onApproveWithdrawal(id);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: string) => {
    if (!onRejectWithdrawal) return;
    try {
      setProcessingIds((prev) => new Set(prev).add(id));
      await onRejectWithdrawal(id);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div
      className={styles.container}
      style={{
        backgroundColor: palette.background,
        color: palette.text,
      }}
    >
      <div className={styles.header}>
        <h1 className={styles.title}>Payment Monitoring Dashboard</h1>
        <div className={styles.headerMeta}>
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <MetricCard
          label="Total Transactions"
          value={metrics.totalTransactions.toLocaleString()}
          icon="💳"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          label="Success Rate"
          value={`${metrics.successRate.toFixed(2)}%`}
          icon="✅"
          trend={{ value: 0.5, positive: true }}
          isDarkMode={isDarkMode}
        />
        <MetricCard
          label="Total Revenue"
          value={`GHS ${metrics.totalRevenue.toLocaleString()}`}
          icon="💰"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          label="Avg Transaction"
          value={`GHS ${metrics.averageTransactionAmount.toFixed(2)}`}
          icon="📊"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          label="Pending Withdrawals"
          value={metrics.pendingWithdrawals}
          icon="⏳"
          isDarkMode={isDarkMode}
        />
        <MetricCard
          label="Suspicious Activities"
          value={metrics.suspiciousActivities}
          icon="🚨"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Recent Transactions */}
      <div
        className={styles.section}
        style={{
          backgroundColor: palette.surface,
          borderColor: palette.border,
        }}
      >
        <h2 className={styles.sectionTitle}>Recent Transactions Summary</h2>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.tableCell}>Date</div>
            <div className={styles.tableCell}>Transactions</div>
            <div className={styles.tableCell}>Revenue</div>
            <div className={styles.tableCell}>Success Rate</div>
          </div>
          {recentTransactions.map((tx, idx) => (
            <div key={idx} className={styles.tableRow}>
              <div className={styles.tableCell}>{new Date(tx.date).toLocaleDateString()}</div>
              <div className={styles.tableCell}>{tx.transactions}</div>
              <div className={styles.tableCell}>GHS {tx.revenue.toLocaleString()}</div>
              <div className={styles.tableCell}>{tx.successRate.toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Withdrawals */}
      <div
        className={styles.section}
        style={{
          backgroundColor: palette.surface,
          borderColor: palette.border,
        }}
      >
        <h2 className={styles.sectionTitle}>Pending Withdrawal Requests ({pendingWithdrawals.length})</h2>
        <div className={styles.withdrawalsContainer}>
          {pendingWithdrawals.length === 0 ? (
            <div
              className={styles.emptyState}
              style={{ color: palette.textMuted }}
            >
              No pending withdrawals
            </div>
          ) : (
            pendingWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className={styles.withdrawalCard}
                style={{
                  backgroundColor: palette.background,
                  borderColor: palette.border,
                }}
              >
                <div className={styles.withdrawalHeader}>
                  <div>
                    <h3 className={styles.vendorName}>{withdrawal.vendorName}</h3>
                    <p className={styles.vendorId} style={{ color: palette.textMuted }}>
                      {withdrawal.vendorId}
                    </p>
                  </div>
                  <div
                    className={styles.withdrawalAmount}
                    style={{ color: palette.primary }}
                  >
                    GHS {withdrawal.amount.toLocaleString()}
                  </div>
                </div>

                <div className={styles.withdrawalDetails}>
                  <div className={styles.detailRow}>
                    <span style={{ color: palette.textMuted }}>Method:</span>
                    <span>{withdrawal.method}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span style={{ color: palette.textMuted }}>Status:</span>
                    <StatusBadge status={withdrawal.status} isDarkMode={isDarkMode} />
                  </div>
                  <div className={styles.detailRow}>
                    <span style={{ color: palette.textMuted }}>Requested:</span>
                    <span>{new Date(withdrawal.requestedAt).toLocaleString()}</span>
                  </div>
                </div>

                {withdrawal.status === 'pending' && (
                  <div className={styles.withdrawalActions}>
                    <button
                      className={styles.approveButton}
                      onClick={() => handleApprove(withdrawal.id)}
                      disabled={processingIds.has(withdrawal.id)}
                      style={{
                        backgroundColor: palette.success,
                        color: '#fff',
                      }}
                    >
                      {processingIds.has(withdrawal.id) ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      className={styles.rejectButton}
                      onClick={() => handleReject(withdrawal.id)}
                      disabled={processingIds.has(withdrawal.id)}
                      style={{
                        backgroundColor: palette.error,
                        color: '#fff',
                      }}
                    >
                      {processingIds.has(withdrawal.id) ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Security Status */}
      <div
        className={styles.section}
        style={{
          backgroundColor: palette.surface,
          borderColor: palette.border,
        }}
      >
        <h2 className={styles.sectionTitle}>Security Status</h2>
        <div className={styles.securityGrid}>
          <div
            className={styles.securityItem}
            style={{
              backgroundColor: palette.successLight,
              color: palette.success,
            }}
          >
            <span className={styles.securityIcon}>✅</span>
            <span>Encryption: Active</span>
          </div>
          <div
            className={styles.securityItem}
            style={{
              backgroundColor: palette.successLight,
              color: palette.success,
            }}
          >
            <span className={styles.securityIcon}>✅</span>
            <span>Rate Limiting: Enabled</span>
          </div>
          <div
            className={styles.securityItem}
            style={{
              backgroundColor: palette.successLight,
              color: palette.success,
            }}
          >
            <span className={styles.securityIcon}>✅</span>
            <span>2FA: Active</span>
          </div>
          <div
            className={styles.securityItem}
            style={{
              backgroundColor: palette.warningLight,
              color: palette.warning,
            }}
          >
            <span className={styles.securityIcon}>⚠️</span>
            <span>Suspicious Activities: {metrics.suspiciousActivities}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMonitoringDashboard;
