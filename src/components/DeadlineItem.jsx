"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DeadlineItem({ deadline, index, updateDeadline, removeDeadline }) {
  return (
    <div className="flex items-end space-x-3 mb-2">
      <div className="flex-1">
        <label className="block mb-1 font-medium text-gray-700">Date</label>
        <Input
          type="text"
          value={deadline.date}
          onChange={(e) => updateDeadline(index, { ...deadline, date: e.target.value })}
          placeholder="YYYY-MM-DD or text"
        />
      </div>
      <div className="flex-1">
        <label className="block mb-1 font-medium text-gray-700">Subject</label>
        <Input
          type="text"
          value={deadline.subject}
          onChange={(e) => updateDeadline(index, { ...deadline, subject: e.target.value })}
          placeholder="Deadline subject"
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => removeDeadline(index)}
        className="p-1 min-w-[2rem] rounded-md text-red-600 font-bold"
        aria-label="Remove deadline"
      >
        🗑️
      </Button>
    </div>
  );
}
