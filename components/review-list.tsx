import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ThumbsUp, MessageSquare } from 'lucide-react'

const reviews = [
  {
    id: 1,
    author: "John Doe",
    rating: 4,
    content: "Great hotel, friendly staff, and excellent amenities!",
    aiSuggestion: "Thank you for your positive feedback! We're delighted to hear you enjoyed your stay.",
    date: "2h ago",
  },
  {
    id: 2,
    author: "Jane Smith",
    rating: 5,
    content: "The best hotel experience I've ever had. Will definitely come back!",
    aiSuggestion: "We're thrilled to hear about your wonderful experience!",
    date: "5h ago",
  },
  {
    id: 3,
    author: "Mike Johnson",
    rating: 3,
    content: "Room service could be improved, but overall decent stay.",
    aiSuggestion: "Thank you for your feedback. We're constantly working to improve our services.",
    date: "1d ago",
  },
]

export function ReviewList() {
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="p-4 border rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {review.author[0]}
                </div>
              </Avatar>
              <div>
                <h4 className="font-medium">{review.author}</h4>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < review.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <span className="text-sm text-gray-500">{review.date}</span>
          </div>
          <p className="text-gray-600">{review.content}</p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">AI Suggestion: </span>
              {review.aiSuggestion}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <ThumbsUp className="w-4 h-4 mr-2" />
              Use Suggestion
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Custom Reply
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

