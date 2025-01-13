import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { messages } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = 'public/uploads'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.type.split('/')[1]
    const filename = `${params.messageId}-${Date.now()}.${ext}`
    const filepath = join(UPLOAD_DIR, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update message attachments in database
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, params.messageId)
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    const currentAttachments = message.attachments as { files?: string[] } || { files: [] }
    const updatedAttachments = {
      files: [...(currentAttachments.files || []), filename]
    }

    await db.update(messages)
      .set({ attachments: updatedAttachments })
      .where(eq(messages.id, params.messageId))

    return NextResponse.json({ filename })

  } catch (error) {
    console.error('Error handling file upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, params.messageId)
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    const attachments = message.attachments as { files?: string[] } || { files: [] }
    return NextResponse.json(attachments)

  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 