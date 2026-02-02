// src/lib/gemini/files.ts
// Gemini File API - 파일 업로드 및 관리

import { GoogleAIFileManager } from '@google/generative-ai/server'

let fileManager: GoogleAIFileManager | null = null

function getFileManager(): GoogleAIFileManager {
  if (!fileManager) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }
    fileManager = new GoogleAIFileManager(apiKey)
  }
  return fileManager
}

export interface UploadedFile {
  name: string        // files/xxx 형식의 파일 ID
  displayName: string
  mimeType: string
  uri: string
  sizeBytes: string
  state: 'PROCESSING' | 'ACTIVE' | 'FAILED'
  createTime: string
  updateTime: string
}

// 파일 업로드
export async function uploadFile(
  filePath: string,
  displayName: string,
  mimeType: string
): Promise<UploadedFile> {
  const fm = getFileManager()

  const result = await fm.uploadFile(filePath, {
    displayName,
    mimeType,
  })

  return result.file as UploadedFile
}

// Buffer로 파일 업로드 (메모리에서 직접)
export async function uploadFileFromBuffer(
  buffer: Buffer,
  displayName: string,
  mimeType: string
): Promise<UploadedFile> {
  const fm = getFileManager()

  // Buffer를 Uint8Array로 변환 후 Blob 생성
  const uint8Array = new Uint8Array(buffer)
  const blob = new Blob([uint8Array], { type: mimeType })

  const result = await fm.uploadFile(blob as unknown as string, {
    displayName,
    mimeType,
  })

  return result.file as UploadedFile
}

// 파일 상태 확인
export async function getFile(fileName: string): Promise<UploadedFile> {
  const fm = getFileManager()
  const result = await fm.getFile(fileName)
  return result as UploadedFile
}

// 파일이 ACTIVE 상태가 될 때까지 대기
export async function waitForFileActive(
  fileName: string,
  maxWaitMs: number = 60000,
  intervalMs: number = 2000
): Promise<UploadedFile> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const file = await getFile(fileName)

    if (file.state === 'ACTIVE') {
      return file
    }

    if (file.state === 'FAILED') {
      throw new Error(`File processing failed: ${fileName}`)
    }

    // PROCESSING 상태면 대기
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error(`File processing timeout: ${fileName}`)
}

// 파일 삭제
export async function deleteFile(fileName: string): Promise<void> {
  const fm = getFileManager()
  await fm.deleteFile(fileName)
}

// 모든 파일 목록 조회
export async function listFiles(): Promise<UploadedFile[]> {
  const fm = getFileManager()
  const result = await fm.listFiles()
  return (result.files || []) as UploadedFile[]
}

// 파일 URI로 Gemini 모델에 전달할 형식 생성
export function createFileReference(file: UploadedFile) {
  return {
    fileData: {
      fileUri: file.uri,
      mimeType: file.mimeType,
    }
  }
}

// 여러 파일 참조 생성
export function createFileReferences(files: UploadedFile[]) {
  return files.map(createFileReference)
}
