export interface SubscriptionPlan {
  id?: number;
  name: string;
  price: number;
  durationInMonths: number;
  tokens: number;
  planType?: 'Basic' | 'Golden' | 'Premium';
}

/*export interface CreateSubscriptionRequest {
  name: string;
  price: number;
  durationInMonths: number;
  planType: string;
}*/
