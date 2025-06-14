import { ChevronDown, ChevronUp } from "lucide-react";
import type { ParticipantWithGolfers } from "@shared/schema";

interface ParticipantRowProps {
  participant: ParticipantWithGolfers;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function ParticipantRow({ 
  participant, 
  isExpanded, 
  onToggle 
}: ParticipantRowProps) {
  
  const getRankBadgeClass = (rank: number | null) => {
    if (!rank) return "rank-other";
    switch (rank) {
      case 1: return "rank-1";
      case 2: return "rank-2";
      case 3: return "rank-3";
      default: return "rank-other";
    }
  };

  const getScoreClass = (score: number) => {
    if (score < 0) return "score-negative";
    if (score > 0) return "score-positive";
    return "score-even";
  };

  const formatScore = (score: number) => {
    if (score === 0) return "E";
    return score > 0 ? `+${score}` : `${score}`;
  };

  const activePlayers = participant.golfers.filter(g => !g.missedCut).length;
  const missedCutCount = participant.golfers.filter(g => g.missedCut).length;
  const statusText = missedCutCount > 0 
    ? `${activePlayers} golfers active • ${missedCutCount} MC`
    : `${activePlayers} golfers active`;

  return (
    <>
      {/* Main participant row */}
      <tr 
        className="hover:bg-gray-50 cursor-pointer" 
        onClick={onToggle}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <span className={`rank-badge ${getRankBadgeClass(participant.rank)}`}>
              {participant.rank || '?'}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-lg font-semibold text-gray-900">
            {participant.name}
          </div>
          <div className="text-sm text-gray-500">
            {statusText}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <span className={`text-2xl ${getScoreClass(participant.totalScore)}`}>
            {formatScore(participant.totalScore)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </td>
      </tr>

      {/* Expanded team details */}
      {isExpanded && (
        <tr>
          <td colSpan={4} className="px-6 py-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {participant.golfers.map((golfer) => (
                <div
                  key={golfer.id}
                  className={`flex justify-between items-center p-3 bg-white rounded border ${
                    golfer.missedCut ? 'missed-cut' : ''
                  }`}
                >
                  <span className={`font-medium ${golfer.missedCut ? 'missed-cut-text' : ''}`}>
                    {golfer.name}
                  </span>
                  <span className={getScoreClass(golfer.scoreToPar || 0)}>
                    {golfer.missedCut 
                      ? `${formatScore(golfer.cutScore || 0)} → ${formatScore(golfer.scoreToPar || 0)} (MC)`
                      : formatScore(golfer.scoreToPar || 0)
                    }
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
