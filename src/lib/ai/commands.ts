import { findSimilarMessages } from '../vectorStore'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AICommand {
  aiUser: string
  query: string
  messageId?: string
}

export function parseAICommand(message: string): AICommand | null {
  // Match /ai @username query
  const match = message.match(/^\/ai\s+@(\w+)\s+(.+)$/i)
  if (!match) return null

  return {
    aiUser: match[1],
    query: match[2],
  }
}

export async function generateAIResponse(command: AICommand) {
  // Find relevant messages from this AI user
  const similarMessages = await findSimilarMessages(command.query, 5)

  // Create a prompt that includes relevant context
  const contextMessages = similarMessages.map(msg => msg.content).join('\n\n')
  
  const prompt = `You are ${command.aiUser}, an AI personality in a chat application. 
You should respond in character based on your previous messages and the current query.

Here are some of your previous relevant messages for context:
${contextMessages}

Current query: ${command.query}

Please respond in character, maintaining consistency with your previous messages and personality.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: prompt,
      }
    ],
    temperature: 0.9,
    max_tokens: 300,
  })

  return response.choices[0].message.content || 'I apologize, but I am unable to respond at the moment.'
} 