import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../core/api/firebase";
import { Patient } from "../../domain/models/patient";
import { IPatientRepository } from "../../domain/repositories";

export class PatientRepositoryImpl implements IPatientRepository {
  private collectionName = "patients";

  async getAll(): Promise<Patient[]> {
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    const patients: Patient[] = [];

    querySnapshot.forEach((doc) => {
      // Forzamos el tipado de los datos recuperados
      patients.push(doc.data() as Patient);
    });

    return patients;
  }

  async create(patient: Patient): Promise<Patient> {
    // Usamos setDoc para especificar el ID que generamos en la app
    await setDoc(doc(db, this.collectionName, patient.id), patient);
    return patient;
  }

  async update(patient: Patient): Promise<Patient> {
    const patientRef = doc(db, this.collectionName, patient.id);
    // Convertimos a objeto plano por si acaso, aunque Firestore suele manejarlo
    const { id, ...dataToUpdate } = patient;

    // @ts-ignore: Firestore update parcial
    await updateDoc(patientRef, dataToUpdate);
    return patient;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }
}
