import { httpClient } from "../../core/api/http";
import { Appointment } from "../../domain/models/appointment";
import { IAppointmentRepository } from "../../domain/repositories";
import { formatDateToChile, formatTime } from "../../core/utils/date";

export class AppointmentRepositoryImpl implements IAppointmentRepository {
  async getAvailability(
    date: string,
    durationMinutes: number,
    excludeId?: string
  ): Promise<string[]> {
    try {
      let url = `/appointments/availability?date=${date}&durationMinutes=${durationMinutes}`;
      if (excludeId) {
        url += `&excludeId=${excludeId}`;
      }

      const response = await httpClient.get<{
        success: boolean;
        data: { date: string; availableSlots: string[] };
      }>(url);

      return response.data.availableSlots;
    } catch (error) {
      console.error("Error fetching availability:", error);
      return [];
    }
  }

  async getPaginated(
    limitCount: number,
    pageCursor: any = 1
  ): Promise<{ appointments: Appointment[]; lastDoc: any }> {
    const page = typeof pageCursor === "number" ? pageCursor : 1;
    const response = await httpClient.get<any>(
      `/appointments?page=${page}&limit=${limitCount}`
    );

    const backendApps = response.data;

    const appointments: Appointment[] = backendApps.map((appt: any) => {
      const isHotel = appt.locationType === "HOTEL";
      const serviceIds = appt.items?.map((i: any) => i.serviceId) || [];

      return {
        id: appt.id,
        date: formatDateToChile(appt.startsAt),
        patientName: appt.client.fullName,
        patientId: appt.clientId,
        serviceMode: isHotel ? "hotel" : "particular",
        duration: appt.durationMinutes,

        hasNailCut: appt.hasNailCut,
        // facialType ya no lo mapeamos porque ya no existe en el frontend

        selectedServiceIds: serviceIds,
        selectedTime: formatTime(appt.startsAt),

        total: appt.totalPrice,
        anamiShare: appt.anamiShare,
        hotelShare: appt.hotelShare,

        createdAt: new Date(appt.createdAt || appt.startsAt).getTime(),
        scheduledStart: new Date(appt.startsAt).getTime(),
        scheduledEnd: new Date(appt.endsAt).getTime(),
      };
    });

    const meta = response.meta;
    const nextPage = meta.hasNextPage ? meta.page + 1 : null;

    return { appointments, lastDoc: nextPage };
  }

  async create(appointment: Appointment): Promise<Appointment> {
    const payload = {
      clientId: appointment.patientId,
      serviceIds: appointment.selectedServiceIds,
      startsAt: new Date(appointment.scheduledStart).toISOString(),
      locationType:
        appointment.serviceMode === "hotel" ? "HOTEL" : "PARTICULAR",

      durationMinutes: appointment.duration,
      hasNailCut: appointment.hasNailCut,
      // facialType eliminado
    };

    const res = await httpClient.post<any>("/appointments", payload);
    return { ...appointment, id: res.data.id };
  }

  async update(appointment: Appointment): Promise<Appointment> {
    const payload = {
      serviceIds: appointment.selectedServiceIds,
      startsAt: new Date(appointment.scheduledStart).toISOString(),
      locationType:
        appointment.serviceMode === "hotel" ? "HOTEL" : "PARTICULAR",

      durationMinutes: appointment.duration,
      hasNailCut: appointment.hasNailCut,
      // facialType eliminado
    };

    await httpClient.patch(`/appointments/${appointment.id}`, payload);
    return appointment;
  }

  async delete(id: string): Promise<void> {
    await httpClient.delete(`/appointments/${id}`);
  }

  async getAll(): Promise<Appointment[]> {
    return [];
  }
}
