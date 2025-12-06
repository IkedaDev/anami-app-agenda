import { httpClient } from "../../core/api/http";
import { IServiceRepository, Service } from "../../domain/repositories";

// Estructura de respuesta del Backend
interface BackendService {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  durationMin: number;
  isActive: boolean;
}

export class ServiceRepositoryImpl implements IServiceRepository {
  private endpoint = "/services";

  async getAllActive(): Promise<Service[]> {
    // GET /v1/services
    const response = await httpClient.get<{
      success: boolean;
      data: BackendService[];
    }>(this.endpoint);

    if (!response.success) {
      throw new Error("Failed to fetch services from API");
    }

    // Mapeo Backend -> App Model
    return response.data
      .filter((svc) => svc.isActive)
      .map((svc) => ({
        id: svc.id,
        name: svc.name,
        description: svc.description,
        price: svc.basePrice, // Mapeo de basePrice
        duration: svc.durationMin, // Mapeo de durationMin
        isActive: svc.isActive,
      }));
  }
}
