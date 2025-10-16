"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth } from "../../lib/firebase";

import { parse, nextDay, previousDay, format } from "date-fns";

// Helper functions for dates (same as your code)
function getExactDateFromText(text) {
  const today = new Date();
  const weekdayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const m = text.match(/(next|previous|this|last)?\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
  if (!m) return "";

  let modifier = m[1]?.toLowerCase() || "this";
  let dayName = m[2].toLowerCase();
  const dayNum = weekdayMap[dayName];

  let resultDate;
  switch (modifier) {
    case "next":
      resultDate = nextDay(today, dayNum);
      break;
    case "previous":
    case "last":
      resultDate = previousDay(today, dayNum);
      break;
    default:
      resultDate = nextDay(today, dayNum);
      break;
  }

  return format(resultDate, "yyyy-MM-dd");
}

function parseAbsoluteDate(dateStr) {
  const today = new Date();

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  const cleanDateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");

  let parsed = parse(cleanDateStr, "d 'of' MMMM yyyy", today);
  if (isNaN(parsed.getTime())) parsed = parse(cleanDateStr, "d-M-yyyy", today);
  if (isNaN(parsed.getTime())) parsed = parse(cleanDateStr, "d/M/yyyy", today);

  if (isNaN(parsed.getTime())) {
    parsed = parse(cleanDateStr, "d 'of' MMMM", today);
    if (!isNaN(parsed.getTime())) {
      parsed.setFullYear(today.getFullYear());
    } else {
      return "";
    }
  }

  return format(parsed, "yyyy-MM-dd");
}

export default function Dashboard() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [deadlines, setDeadlines] = useState([]);

  const db = getFirestore();

  const handleFileChange = (e) => {
    setFile(e.target.files ? e.target.files[0] : null);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select an audio file first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Replace this with your real token logic or Firebase Auth ID token
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(process.env.NEXT_PUBLIC_ML_URL,{
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }

      const data = await res.json();

      const processedDeadlines = (data.deadlines || []).map((d) => {
        let dateValue = d.date;
        if (/[a-zA-Z]/.test(d.date)) {
          const relativeDate = getExactDateFromText(d.date);
          if (relativeDate) {
            dateValue = relativeDate;
          } else {
            dateValue = parseAbsoluteDate(d.date);
          }
        } else {
          dateValue = parseAbsoluteDate(d.date);
        }
        return {
          date: dateValue,
          subject: d.subject,
        };
      });

      setTranscript(data.timestamped_text || "");
      setSummary(data.summary || "");
      setDeadlines(processedDeadlines);

      setMessage("Audio processed successfully!");
      setFile(null);
    } catch (err) {
      setMessage(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const addDeadline = () => setDeadlines([...deadlines, { date: "", subject: "" }]);
  const updateDeadline = (idx, key, value) => {
    const newDeadlines = [...deadlines];
    newDeadlines[idx][key] = value;
    setDeadlines(newDeadlines);
  };
  const removeDeadline = (idx) => setDeadlines(deadlines.filter((_, i) => i !== idx));

  async function saveDataToFirestore() {
    if (!auth.currentUser) {
      setMessage("User not logged in!");
      return;
    }
    setLoading(true);
    try {
      const myUUID = uuidv4();
      const user = auth.currentUser;
      const userDocRef = doc(db, "users",user.uid,"records",myUUID);

      await setDoc(
        userDocRef,
        {
          
          transcript,
          summary,
          deadlines,
        },
        { merge: true }
      );

      setMessage("Data saved successfully!");
    } catch (error) {
      console.error("Error saving data: ", error);
      setMessage("Failed to save data, try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-4xl shadow-md rounded-lg border border-gray-200">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-center mb-4">Dashboard</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <Button onClick={handleUpload} disabled={loading} className="w-full">
            {loading ? "Processing..." : "Upload & Process Audio"}
          </Button>
          {message && (
            <p className={`text-center ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}

          <div>
            <label className="block mb-1 font-medium text-gray-700">Transcript:</label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={6}
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Summary:</label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Deadlines:</span>
              <Button
                size="sm"
                onClick={addDeadline}
                variant="outline"
                className="flex items-center gap-1"
              >
                ➕ Add
              </Button>
            </div>
            <div className="space-y-3">
              {deadlines.map((d, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <Input
                    type="date"
                    value={d.date || ""}
                    onChange={(e) => updateDeadline(idx, "date", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Subject"
                    value={d.subject}
                    onChange={(e) => updateDeadline(idx, "subject", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDeadline(idx)}
                    className="p-1 min-w-[2rem] rounded-md text-red-600 font-bold"
                  >
                    🗑️
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={saveDataToFirestore} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Transcript & Deadlines"}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              localStorage.removeItem("authToken");
              router.push("/login");
            }}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
