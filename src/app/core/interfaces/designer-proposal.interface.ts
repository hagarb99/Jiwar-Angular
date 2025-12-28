export interface DesignerProposal {
    id?: number;
    designRequestID: number;

    proposalDescription: string;
    estimatedCost: number;
    estimatedDays: number;
    sampleDesignURL: string;

    status?: string;

    // Extra UI fields
    designerName?: string;
    designerEmail?: string;

    // UI Helpers (optional, for compatibility)
    title?: string;
    client?: string;
    price?: string;
}

export interface CreateDesignerProposal {
    designRequestID: number;
    proposalDescription: string;
    estimatedCost: number;
    estimatedDays: number;
    sampleDesignURL: string;
}

export interface ProposalForOwner extends DesignerProposal {
    // Alias if needed, or just use DesignerProposal
}
