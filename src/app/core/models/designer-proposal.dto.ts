export interface DesignerProposalDto {
    id?: number;
    designRequestID: number;
    designerID?: string;
    proposalDescription: string;
    estimatedCost: number;
    estimatedDays: number;
    status?: string;

    // Extra fields flattened from mapping
    name?: string; // Designer name
    interiorDesignerEmail?: string;

    // UI Helpers (Optional)
    title?: string;
    client?: string;
}

export interface DesignRequestDto {
    id: number;
    userID: string;
    // Add other fields as discovered from backend integration
    title?: string; // To be filled if backend sends it or fetched separately
}

export interface ProposalForOwnerDto {
    id: number;
    estimatedCost: number;
    estimatedDays: number;
    proposalDescription: string;
    designerName: string;
    designerEmail: string;
}
