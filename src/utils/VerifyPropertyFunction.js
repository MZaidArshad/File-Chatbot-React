import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";

async function verifyProperty(user, propertyData) {
  const userId = user.uid;
  if (propertyData) {
    console.log("userId in verify ", userId);
    const verificationResult = await checkLocationVerification(
      propertyData.Latitude,
      propertyData.Longitude,
      userId,
      propertyData
    );
    return verificationResult;
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  const distanceMeters = distance * 1000; // Distance in meters

  return distanceMeters;
}

async function updateAgentVerification(userId, propertyData) {
  console.log("userId : ", userId, propertyData);
  const listingKey = propertyData.ListingKey;
  const propertyRef = doc(db, "properties", listingKey);

  try {
    const propertySnapshot = await getDoc(propertyRef);

    if (propertySnapshot.exists()) {
      const data = propertySnapshot.data();
      // Check if the agents object exists and has the provided userId
      const agent = data?.agents[userId];

      console.log("agent ", agent);
      if (!agent.isVerified) {
        // Check if isVerified is not already true

        await updateDoc(propertyRef, {
          [`agents.${userId}.isVerified`]: true,
        });
        return "You have successfully verified against this property, there will be a blue tick with you name on the property page.";
      } else {
        return "You are already verified against this property";
      }
    }
  } catch (error) {
    console.log("Error in updating verification status:", error);
    return "Error: Failed to update verification status";
  }
}

export async function checkLocationVerification(
  targetLat,
  targetLon,
  userId,
  propertyData
) {
  try {
    // Get the current location of the user
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, (err) => {
        // Check if the error is due to permission being denied
        if (err.code === err.PERMISSION_DENIED) {
          console.log("You have denied the location access");
          reject(
            new Error(
              "You have denied the location access. Please allow us your location for the verification"
            )
          );
          return "Error: You have denied the location access. Please allow us your location for the verification";
        } else {
          reject(new Error("Error getting user location"));
          return "Error: Error in getting your location. Please make sure location is enabled in your browser";
        }
      });
    });

    // Extract latitude and longitude from the current position
    console.log(position);
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;
    // const userLat = propertyData.Latitude;
    // const userLon = propertyData.Longitude;

    // Calculate the distance between the user's location and the target location
    const distance = calculateDistance(userLat, userLon, targetLat, targetLon);

    // Check if the distance is within 200m
    if (distance <= 200) {
      // const strZpid = propData.zpid.toString();
      console.log("Distance is < 200");
      const result = await updateAgentVerification(userId, propertyData);
      console.log(result);
      return result;
    } else {
      return "Error: You're not currently present at the 200 meters of the property location; you must be present at the 200 meters of the property location at the time of verification";
    }
  } catch (error) {
    console.error("Error getting user location:", error);
    return "Error getting user location.";
  }
}

// Example usage:

// 31.433895516878465, 73.06548461198085
// const targetLatitude = 31.433836142356874; // Replace with your target latitude
// const targetLongitude = 73.06544079582204; // Replace with your target longitude

export default verifyProperty;
