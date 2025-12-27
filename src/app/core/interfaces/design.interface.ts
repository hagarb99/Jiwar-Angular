
export interface Design {
    id: number;
    designerID: string;
    ownerID: string;

    propertyID: number;
    proposalID?: number;

    imageURLs: string[];
    ai_Generated: boolean;
    selectedStyle: string;
    description: string;

    creationDate: string;
}


export interface CreateDesign {
    propertyID: number;
    proposalID: number;

    imageURLs: string[];
    ai_Generated: boolean;
    selectedStyle: string;
    description: string;
}
