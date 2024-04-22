import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export const CheckProfileComplete = async (userId) => {
  if (!auth.currentUser.emailVerified) {
    console.log("Unverified Email");
    return false;
  }

  try {
    // Create a reference to the specific document in 'agentProfile' collection
    const agentProfileDocRef = doc(db, "agents", userId);

    // Retrieve the document
    const docSnapshot = await getDoc(agentProfileDocRef);

    // Check if the user exists
    if (!docSnapshot.exists()) {
      console.log("Agent profile does not exist");
      return false;
    }

    // User exists, check for completeness of profile
    const data = docSnapshot.data();
    console.log("profile data name", data);
    const isProfileComplete =
      data.fullName &&
      data.phoneNumber &&
      data.zipcode &&
      data.state &&
      data.licenseNumber &&
      data.licenseExpiry;
    // data.phoneVerified &&

    console.log("isProfileComplete: ", isProfileComplete);
    return isProfileComplete ? true : false;
  } catch (error) {
    console.error("Error checking profile completeness:", error);
    return false;
  }
};
