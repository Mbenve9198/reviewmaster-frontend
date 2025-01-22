export interface Review {
  _id: string
  hotelId: string
  platform: 'google' | 'booking' | 'tripadvisor' | 'manual'
  content: {
    text: string
    rating: number
    reviewerName: string
    language: string
    originalUrl?: string
  }
  response: {
    text: string | null
    createdAt: Date | null
    synced: boolean
  } | null
  metadata: {
    originalCreatedAt: Date
  }
}