export interface SubsystemHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  details?: string;
}

export interface ApiHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  environment: string;
  version: string;
  timestamp: string;
  subsystems: SubsystemHealth[];
}
