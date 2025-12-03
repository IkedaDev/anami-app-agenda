import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "../../core/api/firebase";
import { Appointment } from "../../domain/models/appointment";
import { IAppointmentRepository } from "../../domain/repositories";

export class AppointmentRepositoryImpl implements IAppointmentRepository {
  private collectionName = "appointments";

  async getPaginated(
    limitCount: number,
    lastVisible: any = null
  ): Promise<{ appointments: Appointment[]; lastDoc: any }> {
    try {
      let q = query(
        collection(db, this.collectionName),
        orderBy("createdAt", "desc"), // Ordenamos por fecha de creación descendente
        limit(limitCount)
      );

      // Si hay un cursor, empezamos después de él
      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const querySnapshot = await getDocs(q);
      const appointments: Appointment[] = [];

      querySnapshot.forEach((doc) => {
        appointments.push(doc.data() as Appointment);
      });

      // Retornamos los datos y el último documento (cursor para la próxima llamada)
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      return { appointments, lastDoc };
    } catch (error) {
      console.error("Error getting paginated documents: ", error);
      throw error;
    }
  }

  // Mantenemos los otros métodos igual (create, update, delete)
  async getAll(): Promise<Appointment[]> {
    // Método legacy o para casos donde necesites todo
    const result = await this.getPaginated(1000);
    return result.appointments;
  }

  async create(appointment: Appointment): Promise<Appointment> {
    await setDoc(doc(db, this.collectionName, appointment.id), appointment);
    return appointment;
  }

  async update(appointment: Appointment): Promise<Appointment> {
    const appointmentRef = doc(db, this.collectionName, appointment.id);
    const { id, ...dataToUpdate } = appointment;

    // @ts-ignore
    await updateDoc(appointmentRef, dataToUpdate);
    return appointment;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }
}
