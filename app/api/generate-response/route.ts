import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Changed from CLAUDE_API_KEY to OPENAI_API_KEY
})

export async function POST(req: Request) {
  if (req.method === 'POST') {
    try {
      const { review, hotelId } = await req.json()

      if (!review || !hotelId) {
        return NextResponse.json({ error: 'Missing review or hotelId' }, { status: 400 })
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates professional and empathetic responses to hotel reviews."
          },
          {
            role: "user",
            content: `Generate a professional and empathetic response to the following hotel review:\n\n${review}`
          }
        ],
        max_tokens: 150,
      })

      const response = completion.choices[0].message.content

      if (!response) {
        return NextResponse.json({ error: 'No response generated' }, { status: 500 })
      }

      return NextResponse.json({ response })
    } catch (error) {
      console.error('Error generating response:', error)
      return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }
}

