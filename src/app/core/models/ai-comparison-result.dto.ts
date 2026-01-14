export interface CategoryScoreDetailDTO {
    score: number;
    description: string;
}

export interface CategoryScoresDTO {
    priceValue: CategoryScoreDetailDTO;
    location: CategoryScoreDetailDTO;
    spaceAndLayout: CategoryScoreDetailDTO;
    features: CategoryScoreDetailDTO;
    investmentPotential: CategoryScoreDetailDTO;
}

export interface AiPropertyScoreBreakdownDTO {
    propertyId: number;
    propertyName?: string;
    categoryScores: CategoryScoresDTO;
    totalScore: number;
    overallReason: string;
}

export interface AiComparisonResultDTO {
    bestPropertyId: number;
    summary: string;
    scores: AiPropertyScoreBreakdownDTO[];
}
