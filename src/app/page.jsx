"use client";

import { useState } from "react";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FaComments, FaGoogle } from "react-icons/fa";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleAuth = async (mode) => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // If signup, you can store extra user info here if needed
      if (mode === "signup") {
        // Example: create user doc in Firestore if it doesn't exist
        // await setDoc(doc(getFirestore(), "users", user.uid), {
        //   email: user.email,
        //   name: user.displayName,
        //   createdAt: new Date(),
        // });
      }

      window.location.href = "/view";
    } catch (err) {
      console.error(err);
      setError("Google Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <header className="mb-10 flex items-center gap-3 text-indigo-700">
        <FaComments className="w-10 h-10" />
        <h1 className="text-4xl font-extrabold">Chatterly</h1>
      </header>

      <Card className="w-full max-w-md shadow rounded border border-gray-200">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-center mb-6">
            Welcome to Chatterly
          </h2>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            onClick={() => handleGoogleAuth("signin")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            <FaGoogle size={20} />{" "}
            {loading ? "Connecting..." : "Sign In with Google"}
          </Button>

          <div className="flex items-center justify-center text-gray-500 text-sm">
            <span>or</span>
          </div>

          <Button
            variant="outline"
            onClick={() => handleGoogleAuth("signup")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            <FaGoogle size={20} />{" "}
            {loading ? "Connecting..." : "Sign Up with Google"}
          </Button>

          {error && <p className="mt-4 text-center text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
