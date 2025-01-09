'use client'

import { useState, useRef } from 'react'
import { PhotoIcon } from '@heroicons/react/24/outline'

interface ProfilePhotoUploaderProps {
  onUpload: (file: File) => void
}

export function ProfilePhotoUploader({ onUpload }: ProfilePhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      onUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-lg border-2 border-dashed p-6 text-center ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-700 bg-gray-800'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
      <div className="mt-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Upload a file
        </button>
        <p className="mt-2 text-sm text-gray-400">or drag and drop</p>
      </div>
      <p className="mt-1 text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
    </div>
  )
} 