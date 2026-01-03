export interface DesignRequest {
    id: number;
    propertyID: number;
    userID: string;
    designerID?: string; // Optional - for specific designer requests

    preferredStyle: string;
    budget?: number;
    notes?: string;
    referenceImages?: string[]; // Array of image URLs

    isForSaleEnhancement: boolean;
    createdAt: string;
    status: string;
}

export interface CreateDesignRequest {
    propertyID: number;
    preferredStyle: string;
    budget?: number;
    notes?: string;
    referenceImages?: string[];
    isForSaleEnhancement: boolean;
    designerID?: string; // Optional - for specific designer requests
}
