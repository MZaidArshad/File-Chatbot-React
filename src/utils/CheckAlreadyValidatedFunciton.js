import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

const CheckAlreadyValidatedFunciton = async (listingKey, userUid) => {
  console.log("listingKey, userUid ", listingKey, userUid);
  const agentRef = doc(db, "agents", userUid);

  try {
    const agentSnapshot = await getDoc(agentRef);
    if (agentSnapshot.exists()) {
      const agentData = agentSnapshot.data();
      const annotatedProperties = agentData.annotatedProperties;

      // Check if the annotatedProperties field exists and is an array
      if (annotatedProperties) {
        // If annotatedProperties is not empty, check if the listingKey exists
        console.log(" annotatedProperties ", annotatedProperties);
        const found = annotatedProperties.some(
          (property) => property.listingKey === listingKey
        );
        return found;
      } else {
        // If annotatedProperties is not an array or is empty, return false
        return false;
      }
    } else {
      // If the agent document does not exist, return false
      return false;
    }
  } catch (error) {
    console.log("Error in checking annotatedProperties:", error);
    return false;
  }
};

export default CheckAlreadyValidatedFunciton;
