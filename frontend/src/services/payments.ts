import { apiRequest } from '@/services/api';

export interface SubscriptionPackage {
  id: number;
  name: string;
  description: string | null;
  price_minor: number;
  currency: string;
  duration_days: number;
}

export interface PaymentRecord {
  id: number;
  status: string;
  provider_reference: string | null;
  amount_minor: number;
  currency: string;
  created_at: string;
  verified_at: string | null;
  package: { id: number; name: string } | null;
}

export interface PaymentVerification {
  status: string;
  reference: string;
  subscription_status: string;
  message: string;
}

export const paymentService = {
  async listPackages(): Promise<SubscriptionPackage[]> {
    const response = await apiRequest<{ items: SubscriptionPackage[]; total: number }>('/subscriptions/plans', {}, null);
    return response.items;
  },

  async initializePayment(packageId: number): Promise<{ checkout_url: string; reference: string }> {
    return apiRequest('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ package_id: packageId }),
    });
  },

  async getPaymentHistory(): Promise<PaymentRecord[]> {
    const response = await apiRequest<{ items: PaymentRecord[]; total: number }>('/payments/history');
    return response.items;
  },

  async verifyPayment(reference: string): Promise<PaymentVerification> {
    return apiRequest('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ reference }),
    });
  },
};
