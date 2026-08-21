import apiClient from '@/utils/apiClient';

export interface AdminMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalRevenue: number;
  averageTransactionAmount: number;
  successRate: number;
}

export interface PaymentMetrics extends AdminMetrics {
  pendingWithdrawals: number;
  totalWithdrawalAmount: number;
  suspiciousActivities: number;
}

// Admin Dashboard APIs - methods for convenience
export const adminApiMethods = {
  async getMetrics(): Promise<AdminMetrics> {
    const response = await apiClient.get('/admin/metrics');
    return response.data;
  },

  async getPaymentMetrics(): Promise<PaymentMetrics> {
    const response = await apiClient.get('/admin/payments/metrics');
    return response.data;
  },

  async getTransactionHistory(params?: { limit?: number; offset?: number }) {
    const response = await apiClient.get('/admin/transactions', { params });
    return response.data;
  },

  async getWithdrawalRequests(status?: string) {
    const response = await apiClient.get('/admin/withdrawals', {
      params: { status },
    });
    return response.data;
  },

  async approveWithdrawal(withdrawalId: string) {
    const response = await apiClient.post(`/admin/withdrawals/${withdrawalId}/approve`);
    return response.data;
  },

  async rejectWithdrawal(withdrawalId: string, reason?: string) {
    const response = await apiClient.post(`/admin/withdrawals/${withdrawalId}/reject`, {
      reason,
    });
    return response.data;
  },
};

// Export apiClient as default for use in AdminDashboardPage
export default apiClient;
