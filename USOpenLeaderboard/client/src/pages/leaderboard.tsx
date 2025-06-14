import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Trophy, Users, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LeaderboardTable from "@/components/leaderboard-table";
import type { ParticipantWithGolfers, TournamentInfo } from "@shared/schema";

interface LeaderboardData {
  participants: ParticipantWithGolfers[];
  tournamentInfo: TournamentInfo;
}

export default function Leaderboard() {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<LeaderboardData>({
    queryKey: ["/api/leaderboard"],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/refresh-scores");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/leaderboard"], data);
      toast({
        title: "Scores Updated",
        description: "Leaderboard has been refreshed with the latest tournament data.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to refresh scores. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to Load Leaderboard
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to fetch tournament data. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="golf-green text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">US Open Pool Leaderboard</h1>
                <p className="text-green-200 mt-1">2025 Tournament • Live Results</p>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-golf-green mx-auto mb-4" />
            <p className="text-gray-600">Loading tournament data...</p>
          </div>
        </main>
      </div>
    );
  }

  const { participants, tournamentInfo } = data!;
  const playersMadeCut = participants.reduce((count, p) => 
    count + p.golfers.filter(g => !g.missedCut).length, 0
  );
  const totalPlayers = participants.reduce((count, p) => count + p.golfers.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="golf-green text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">US Open Pool Leaderboard</h1>
              <p className="text-green-200 mt-1">2025 Tournament • Live Results</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-green-200">Last Updated</p>
                <p className="font-semibold">
                  {tournamentInfo.lastUpdated 
                    ? new Date(tournamentInfo.lastUpdated).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })
                    : 'Never'
                  }
                </p>
              </div>
              <Button
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                className="golf-accent hover:bg-orange-600 text-white font-semibold"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                {refreshMutation.isPending ? 'Updating...' : 'Refresh Scores'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tournament Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-golf-green" />
                  Tournament Status
                </h2>
                <p className="text-gray-600">
                  {tournamentInfo.status} • {participants.length} Participants • {totalPlayers} Golfers
                </p>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-500 flex items-center justify-center">
                    <Target className="w-4 h-4 mr-1" />
                    Cut Line
                  </p>
                  <p className="font-semibold text-golf-green">
                    {tournamentInfo.cutLine !== null ? `+${tournamentInfo.cutLine}` : 'TBD'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 flex items-center justify-center">
                    <Users className="w-4 h-4 mr-1" />
                    Made Cut
                  </p>
                  <p className="font-semibold text-golf-green">
                    {playersMadeCut}/{totalPlayers}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <LeaderboardTable participants={participants} />

        {/* Rules & Info */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Pool Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Scoring</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Lowest aggregate score wins</li>
                  <li>• Scores relative to par</li>
                  <li>• Real-time updates during rounds</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Missed Cut Penalty</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• +20 stroke penalty applied</li>
                  <li>• Added to score at time of cut</li>
                  <li>• Highlighted in red</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="golf-green text-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-green-200">
              &copy; 2025 US Open Pool Leaderboard • Updated automatically during tournament play
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
