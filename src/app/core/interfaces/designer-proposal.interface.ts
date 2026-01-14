export enum DesignerProposalStatus {
    Pending = 0,
    Accepted = 1,
    Rejected = 2,
    Delivered = 3
}

export interface DesignerProposal {
    id?: number;
    designerId?: string;
    designRequestID: number;

    proposalDescription: string;
    estimatedCost: number;
    estimatedDays: number;
    sampleDesignURL: string;

    status?: string | number;

    // Extra UI fields
    designerName?: string;
    designerEmail?: string;

    // UI Helpers (optional, for compatibility)
    title?: string;
    client?: string;
    price?: string;
}

export interface CreateDesignerProposal {
    requestID: number;
    proposalDescription: string;
    estimatedCost: number;
    estimatedDays: number;
    sampleDesignURL: string;

    // Backend compatibility fields
    status?: string | number;
    designerName?: string;
    designerEmail?: string;
    offerDetails?: string;
}

export interface ProposalForOwner extends DesignerProposal {
    // Alias if needed, or just use DesignerProposal
}
