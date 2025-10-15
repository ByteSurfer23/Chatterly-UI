"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // <-- router
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { auth } from "../../lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const db = getFirestore();
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_ID;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_GAPI;

export default function ViewUserData() {
  const router = useRouter();
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingTaskId, setSendingTaskId] = useState(null);
  const [user, setUser] = useState(null);
  const [gapiReady, setGapiReady] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);

  // Load GAPI and GIS scripts
  useEffect(() => {
    const loadScripts = async () => {
      const gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/api.js";
      gapiScript.async = true;
      gapiScript.defer = true;

      const gisScript = document.createElement("script");
      gisScript.src = "https://accounts.google.com/gsi/client";
      gisScript.async = true;
      gisScript.defer = true;

      document.body.appendChild(gapiScript);
      document.body.appendChild(gisScript);

      gapiScript.onload = async () => {
        window.gapi.load("client", async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              discoveryDocs: [
                "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
              ],
            });

            const savedToken = localStorage.getItem("google_access_token");
            const tokenExpiry = localStorage.getItem("google_token_expiry");

            if (savedToken && Date.now() < tokenExpiry) {
              window.gapi.client.setToken({ access_token: savedToken });
            }

            const client = window.google.accounts.oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: "https://www.googleapis.com/auth/calendar.events",
              callback: (tokenResponse) => {
                if (tokenResponse?.access_token) {
                  window.gapi.client.setToken({
                    access_token: tokenResponse.access_token,
                  });
                  localStorage.setItem(
                    "google_access_token",
                    tokenResponse.access_token
                  );
                  localStorage.setItem(
                    "google_token_expiry",
                    Date.now() + tokenResponse.expires_in * 1000
                  );
                }
              },
            });

            setTokenClient(client);
            setGapiReady(true);
          } catch (err) {
            console.error("Failed to init Google API:", err);
          }
        });
      };

      return () => {
        document.body.removeChild(gapiScript);
        document.body.removeChild(gisScript);
      };
    };

    loadScripts();
  }, []);

  // Firebase auth and fetch user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);

      if (firebaseUser) {
        setLoading(true);
        setError("");
        try {
          const recordsCollectionRef = collection(
            db,
            "users",
            firebaseUser.uid,
            "records"
          );
          const recordsSnapshot = await getDocs(recordsCollectionRef);

          if (recordsSnapshot.empty) {
            router.push("/dashboard"); // redirect if no data
          } else {
            const allRecords = recordsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setUserData(allRecords);
          }
        } catch (err) {
          setError(err.message || "Failed to fetch data");
          setUserData([]);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/"); // redirect to home if not signed in
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function createGoogleCalendarEvent(task) {
    const event = {
      summary: task.subject,
      description: task.details || "Added via app",
      start: {
        dateTime: new Date(task.date).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(
          new Date(task.date).getTime() + 60 * 60 * 1000
        ).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 10 }],
      },
    };

    return window.gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
  }

  async function sendTaskToGoogleCalendar(task, uniqueId) {
    setSendingTaskId(uniqueId);
    try {
      if (!gapiReady || !window.gapi?.client?.calendar || !tokenClient) {
        throw new Error("Google Calendar API not initialized");
      }

      const savedToken = localStorage.getItem("google_access_token");
      const tokenExpiry = localStorage.getItem("google_token_expiry");
      const tokenValid = savedToken && Date.now() < tokenExpiry;

      if (tokenValid) {
        window.gapi.client.setToken({ access_token: savedToken });
        await createGoogleCalendarEvent(task);
        alert(`Task "${task.subject}" added to Google Calendar!`);
      } else {
        tokenClient.callback = async (tokenResponse) => {
          if (tokenResponse?.error) {
            throw new Error("Token error: " + tokenResponse.error);
          }

          window.gapi.client.setToken({
            access_token: tokenResponse.access_token,
          });

          localStorage.setItem("google_access_token", tokenResponse.access_token);
          localStorage.setItem(
            "google_token_expiry",
            Date.now() + tokenResponse.expires_in * 1000
          );

          await createGoogleCalendarEvent(task);
          alert(`Task "${task.subject}" added to Google Calendar!`);
        };

        tokenClient.requestAccessToken({ prompt: "" });
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add to calendar: " + (error.message || error));
    } finally {
      setSendingTaskId(null);
    }
  }

  if (authLoading)
    return <p className="p-6 text-center">Checking authentication...</p>;
  if (!user)
    return <p className="p-6 text-center text-red-600">User not signed in</p>;
  if (loading) return <p className="p-6 text-center">Loading your data...</p>;
  if (error)
    return <p className="p-6 text-center text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center gap-6">
      {/* 🔹 Generate Transcript Button */}
      <Button
        onClick={() => router.push("/dashboard")}
        className="mb-4 w-full max-w-xs"
      >
        Generate Transcript
      </Button>

      <Card className="max-w-4xl w-full shadow-md border border-gray-200 rounded-lg">
        <CardHeader>
          <h2 className="text-3xl font-semibold text-center mb-6">
            Your Data Overview
          </h2>
        </CardHeader>
        <CardContent className="space-y-8">
          {userData.map((record) => (
            <section
              key={record.id}
              className="p-6 bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <h3 className="text-2xl font-semibold mb-4">
                {record.type || "Record"}
              </h3>

              {record.transcript && (
                <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded mb-4 border border-gray-300">
                  {record.transcript}
                </pre>
              )}
              {record.summary && (
                <p className="mb-4 text-gray-700">{record.summary}</p>
              )}

              {record.deadlines && record.deadlines.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-3 text-lg">
                    Deadlines / Tasks
                  </h4>
                  <ul className="space-y-3">
                    {record.deadlines.map((task, i) => {
                      const uniqueId = `${record.id}-${i}`;
                      return (
                        <li
                          key={uniqueId}
                          className="flex justify-between items-center gap-4 border rounded p-3 bg-gray-50"
                        >
                          <div>
                            <p className="font-medium">{task.subject}</p>
                            <p className="text-sm text-gray-500">{task.date}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              sendTaskToGoogleCalendar(task, uniqueId)
                            }
                            disabled={sendingTaskId === uniqueId}
                          >
                            {sendingTaskId === uniqueId
                              ? "Sending..."
                              : "Send to Calendar"}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {!record.transcript &&
                !record.summary &&
                !record.deadlines && (
                  <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded border border-gray-300">
                    {JSON.stringify(record, null, 2)}
                  </pre>
                )}
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
