
export enum SimulationStatusEnum {
  Draft = 1,
  Submitted = 2,
  Analyzed = 3,
  ConvertedToProject = 4,
  Archived = 5
}

export enum SimulationMediaTypeEnum {
  Image = 0,
  Video360 = 1,
  FloorPlan = 2
}

export enum RecommendationCategoryEnum {
  Technical = 0,
  Functional = 1,
  Design = 2
}

export enum RecommendationSeverityEnum {
  Low = 0,
  Medium = 1,
  High = 2
}

export interface StartSimulationDto {
  propertyId: number;
}

export interface UpdateSimulationDetailsDto {
  size: number;
  rooms: number;
  bathrooms: number;
  condition: string;
  yearBuilt?: number;
}

export interface UploadSimulationMediaDto {
  mediaType: SimulationMediaTypeEnum;
  fileUrl: string;
}

export interface SimulationGoalsDto {
  goals: string[];
  budgetMin?: number;
  budgetMax?: number;
  notes?: string;
}

export interface SimulationRecommendationDto {
  category: RecommendationCategoryEnum; // or string if mapped from backend enum string
  title: string;
  description: string;
  severity: RecommendationSeverityEnum;
  isAIGenerated: boolean;
}

export interface SimulationResultDto {
  simulationId: number;
  budgetMin?: number;
  budgetMax?: number;
  goals: string[];
  medias: UploadSimulationMediaDto[];
  recommendations: SimulationRecommendationDto[];
}
