export interface DesignRequest {
    id: number;
    propertyID: number;
    userID: string;

    preferredStyle: string;
    budget?: number;
    notes?: string;

    isForSaleEnhancement: boolean;
    createdAt: string;
    status: string;
}
