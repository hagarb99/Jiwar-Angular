export interface SubscriptionPlan {
    id?: number;
    name: string;
    price: number;
    durationInMonths: number;
    planType?: string;
}

export interface CreateSubscriptionRequest {
    name: string;
    price: number;
    durationInMonths: number;
    planType: string;
}
