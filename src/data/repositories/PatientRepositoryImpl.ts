import { httpClient } from "../../core/api/http";
import { Patient } from "../../domain/models/patient";
import { IPatientRepository } from "../../domain/repositories";

// Interfaz para tipar lo que devuelve tu Backend (que usa fullName en vez de name)
interface BackendClient {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
  rut?: string;
  createdAt: string; // El backend devuelve fechas como ISO String
}

export class PatientRepositoryImpl implements IPatientRepository {
  async getAll(): Promise<Patient[]> {
    // GET /v1/clients
    const response = await httpClient.get<{
      success: boolean;
      data: BackendClient[];
    }>("/clients");

    // Mapeamos de "Backend Format" a "App Format"
    return response.data.map((client) => ({
      id: client.id,
      name: client.fullName, // Tu app usa 'name', el backend 'fullName'
      email: client.email,
      phone: client.phone,
      address: client.address,
      rut: client.rut,
      // Convertimos el ISO String del backend a Timestamp (número) para tu app
      createdAt: new Date(client.createdAt).getTime(),
    }));
  }

  async create(patient: Patient): Promise<Patient> {
    const payload = {
      fullName: patient.name,
      email: patient.email || undefined,
      phone: patient.phone || undefined,
      address: patient.address || undefined,
      rut: patient.rut || undefined,
    };

    // POST /v1/clients
    const response = await httpClient.post<{
      success: boolean;
      data: BackendClient;
    }>("/clients", payload);
    const created = response.data;

    return {
      ...patient,
      id: created.id, // Usamos el ID real generado por Postgres
      createdAt: new Date(created.createdAt).getTime(),
    };
  }

  async update(patient: Patient): Promise<Patient> {
    const payload = {
      fullName: patient.name,
      email: patient.email || undefined,
      phone: patient.phone || undefined,
      address: patient.address || undefined,
      rut: patient.rut || undefined,
    };

    // PATCH /v1/clients/:id
    await httpClient.patch(`/clients/${patient.id}`, payload);
    return patient;
  }

  async delete(id: string): Promise<void> {
    // Si implementas el endpoint DELETE en el backend, descomenta esto:
    // await httpClient.delete(`/clients/${id}`);
    console.warn("Delete client no implementado en backend aún");
  }
}
