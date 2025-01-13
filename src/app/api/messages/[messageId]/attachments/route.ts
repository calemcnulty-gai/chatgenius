import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { messages } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
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
    const filename = `messages/${params.messageId}/${Date.now()}.${ext}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(putCommand)

    // Generate a signed URL for immediate access
    const url = await getSignedUrl(s3Client, putCommand, { expiresIn: 3600 })

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

    return NextResponse.json({ filename, url })

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

    // Generate signed URLs for each attachment
    const filesWithUrls = await Promise.all(
      (attachments.files || []).map(async (filename) => {
        const command = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: filename,
        })
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
        return { filename, url }
      })
    )

    return NextResponse.json({ files: filesWithUrls })

  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 