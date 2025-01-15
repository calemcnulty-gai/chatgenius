import { loadExistingMessages } from '../src/workers/messageUpload/loadExisting'
import { messageUploadWorker } from '../src/workers/messageUpload/worker'
import { messageQueue } from '../src/workers/messageUpload/queue'

async function main() {
  try {
    console.log('Starting message upload process...')
    
    // Load and queue messages
    const count = await loadExistingMessages()
    console.log(`Queued ${count} messages for processing`)
    
    // Wait for queue to be empty
    while (true) {
      const size = await messageQueue.size()
      if (size === 0) {
        break
      }
      console.log(`${size} messages remaining in queue...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    
    // Stop the worker
    await messageUploadWorker.stop()
    console.log('All messages processed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error processing messages:', error)
    process.exit(1)
  }
}

main() 