import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../core/api/firebase";
import { Appointment } from "../../domain/models/appointment";
import { IAppointmentRepository } from "../../domain/repositories";

export class AppointmentRepositoryImpl implements IAppointmentRepository {
  private collectionName = "appointments";

  async getAll(): Promise<Appointment[]> {
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    const appointments: Appointment[] = [];

    querySnapshot.forEach((doc) => {
      appointments.push(doc.data() as Appointment);
    });

    return appointments;
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
