import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const CheckAlreadyVerified = async (listingKey, userId) => {
  const propertyRef = doc(db, "properties", listingKey);

  try {
    const propertySnapshot = await getDoc(propertyRef);

    if (propertySnapshot.exists()) {
      const data = propertySnapshot.data();
      // Check if the agents object exists and has the provided userId
      const agent = data?.agents[userId];

      if (agent.isVerified) {
        // Check if isVerified is not already true
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log("Error in Checking Verification Status:", error);
  }
};

export default CheckAlreadyVerified;
