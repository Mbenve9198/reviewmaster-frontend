import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Zap } from 'lucide-react'

const missions = [
  {
    id: 1,
    title: "Response Champion",
    description: "Respond to 10 reviews",
    progress: 6,
    total: 10,
    xp: 50,
  },
  {
    id: 2,
    title: "Quick Responder",
    description: "Reply within 1 hour to 5 reviews",
    progress: 3,
    total: 5,
    xp: 30,
  },
  {
    id: 3,
    title: "Positive Impact",
    description: "Get 5 positive feedback on responses",
    progress: 2,
    total: 5,
    xp: 40,
  },
]

export function DailyMissions() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-medium">Daily Missions</h3>
        </div>
        <button className="text-sm text-blue-500 hover:underline">
          View All
        </button>
      </div>
      <div className="space-y-6">
        {missions.map((mission) => (
          <div key={mission.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{mission.title}</h4>
              <div className="flex items-center space-x-1 text-sm">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>{mission.xp} XP</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">{mission.description}</p>
            <div className="space-y-1">
              <Progress value={(mission.progress / mission.total) * 100} />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{mission.progress}/{mission.total}</span>
                <span>{Math.round((mission.progress / mission.total) * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

