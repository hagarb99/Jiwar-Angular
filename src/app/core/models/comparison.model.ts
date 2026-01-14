import { PropertyComparisonUserType } from './property-comparison-user-type.enum';

export interface PropertyComparisonDTO {
    propertyID: number;
    title: string;
    city: string;
    address: string;
    price: number;
    area_sqm?: number;
    numBedrooms?: number;
    numBathrooms?: number;
    propertyType: string;
    status: string;
    thumbnailUrl: string;
    ThumbnailUrl?: string;
    features: string[];
}

export interface PropertyComparisonRequestDTO {
    propertyIds: number[];
    userType: PropertyComparisonUserType;
}
