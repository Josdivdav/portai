import { app } from "../lib/firebase";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export async function registerUser(
  email: string,
  password: string,
): Promise<void> {
  const auth = getAuth(app);
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    console.log("User registered successfully");
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

export async function continueWithGoogle() {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const accessToken = await user.getIdToken();
    const res = await sendDataToServer({
      fullName: user.displayName || "",
      email: user.email || "",
      accessToken,
    });
    console.log("Data sent to server:", res);
    return { user, accessToken };
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

async function sendDataToServer(data: { fullName: string; email: string; accessToken?: string }) {
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to register user");
    }

    const responseData = await response.json();
    console.log("Server response:", responseData);
  } catch (error) {
    console.error("Error sending data to server:", error);
    throw error;
  }
}