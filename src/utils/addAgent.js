import {
  collection,
  doc,
  getDocs,
  setDoc,
  where,
  query,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const setAgent = async (user) => {
  try {
    // Check if the user's email exists in the 'agents' collection
    const agentsRef = collection(db, "agents");
    const q = query(agentsRef, where("email", "==", user.email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // If the user's email does not exist, create a new document in the 'agents' collection
      let name = user.displayName ? user.displayName : "User";
      await setDoc(doc(agentsRef, user.uid), {
        state: "",
        email: user.email,
        uid: user.uid,
        createdAt: user.metadata.creationTime,
        fullName: name,
        phoneNumber: "",
        phoneVerified: false,
        zipcode: "",
        licenseNumber: "",
        licenseExpiry: "",
      });

      console.log("Agent document created successfully");
    } else {
      console.log("Agent document already exists");
    }
  } catch (error) {
    console.error("Error setting agent:", error);
  }
};
