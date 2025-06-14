import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import ParticipantRow from "./participant-row";
import type { ParticipantWithGolfers } from "@shared/schema";

interface LeaderboardTableProps {
  participants: ParticipantWithGolfers[];
}

export default function LeaderboardTable({ participants }: LeaderboardTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (participantId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(participantId)) {
      newExpanded.delete(participantId);
    } else {
      newExpanded.add(participantId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 golf-green text-white">
        <h2 className="text-xl font-semibold">Pool Standings</h2>
        <p className="text-green-200 text-sm mt-1">
          Click on participant names to view team details
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participant
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Score
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                isExpanded={expandedRows.has(participant.id)}
                onToggle={() => toggleRow(participant.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
