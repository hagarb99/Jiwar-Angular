export interface WorkspaceData {
    designRequest: {
        id: number;
        title?: string;
        status: string;
        preferredStyle: string;
        budget?: number;
        notes?: string;
        propertyID: number;
        userID: string;
    };
    acceptedProposal: {
        id: number;
        designerId: string;
        designerName: string;
        estimatedCost: number;
        estimatedDays: number;
        status: number; // 0=Pending, 1=Accepted, 3=Delivered
        deliveredAt?: string;
        proposalDescription: string;
    };
    hasDelivered: boolean;
    hasReviewed: boolean;
    chatHistory?: {
        senderId: string;
        senderName?: string;
        senderPhoto?: string;
        message?: string;
        messageText?: string;
        messageType?: number;
        sentDate: string;
    }[];
}

export interface DeliverProjectRequest {
    deliveryNotes?: string;
}

export interface SubmitReviewRequest {
    proposalId: number;
    designerId: string;
    propertyOwnerId: string;
    rating: number; // 1-5
    comment: string;
    designRequestId: number;
}

export interface DesignerReview {
    id: number;
    propertyOwnerName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface DesignerReviewsResponse {
    designerId: string;
    averageRating: number;
    totalReviews: number;
    reviews: DesignerReview[];
}
