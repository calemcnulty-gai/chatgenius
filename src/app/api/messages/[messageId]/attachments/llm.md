# Message Attachments API

This directory contains API routes for handling message attachments in ChatGenius.

## Endpoints

### POST /api/messages/[messageId]/attachments
Uploads an image attachment for a specific message.

Request:
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - file: Image file (required)

Supported file types:
- image/jpeg
- image/png
- image/gif
- image/webp

Constraints:
- Maximum file size: 10MB
- File must be a valid image format
- Message must exist

Response:
```json
{
  "filename": "string"
}
```

Error responses:
- 400: Invalid request (missing file, invalid type, file too large)
- 404: Message not found
- 500: Server error

### GET /api/messages/[messageId]/attachments
Retrieves all attachments for a specific message.

Request:
- Method: GET
- Parameters:
  - messageId: string (required)

Response:
```json
{
  "files": ["string"]
}
```

Error responses:
- 404: Message not found
- 500: Server error

## Implementation Details

### Storage
- Files are stored in the `public/uploads` directory
- Filenames are generated using message ID and timestamp
- Files are served directly through Next.js public directory

### Database
- Attachment metadata stored in messages table
- JSONB column 'attachments' contains:
  ```json
  {
    "files": ["filename1.jpg", "filename2.png"]
  }
  ```

### Security
- File type validation
- Size restrictions
- Unique filename generation
- Content-Type validation
- Public directory access control

### Error Handling
- Comprehensive error messages
- Proper HTTP status codes
- File system error handling
- Database error handling 