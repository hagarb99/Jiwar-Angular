export interface AdminAnalyticsDTO {
    usersMetrics: UsersMetricsDTO;
    propertyMetrics: PropertyMetricsDTO;
    valuationMetrics: ValuationMetricsDTO;
    paymentMetrics: PaymentMetricsDTO;
    engagementMetrics: EngagementMetricsDTO;
}

export interface UsersMetricsDTO {
    totalUsers: number;
    newSignUpsToday: number;
    newSignUpsWeek: number;
    newSignUpsMonth: number;
    activeUsers: number;
    userRolesDistribution: { [key: string]: number };
}

export interface PropertyMetricsDTO {
    totalProperties: number;
    activeListings: number;
    pendingListings: number;
    forSaleListings: number;
    forRentListings: number;
    soldOrRentedUnits: number;
    topCategories: TopCategoryDTO[];
    topDistricts: TopDistrictDTO[];
}

export interface TopCategoryDTO {
    propertyType: string;
    count: number;
}

export interface TopDistrictDTO {
    districtName: string;
    count: number;
}

export interface ValuationMetricsDTO {
    totalValuations: number;
    valuationsPerPeriod: { [key: string]: number };
}

export interface PaymentMetricsDTO {
    totalRevenue: number;
    revenuePerPeriod: { [key: string]: number };
    paymentMethodDistribution: { [key: string]: number };
    revenueByPeriod: { [key: string]: number };
    revenueByType: { [key: string]: number };
    totalTransactions: number;
}

export interface EngagementMetricsDTO {
    pageVisits: number;
    propertyViews: number;
    searchTrends: { [key: string]: number };
}
