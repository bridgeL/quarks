import type { CreateTestRequest, DeleteTestRequest, TestItem, UpdateTestRequest } from '../types'

const BASE_URL = 'http://127.0.0.1:52000/test'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const data = (await response.json()) as { detail?: string }
      if (data.detail) {
        message = data.detail
      }
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export function listTests(): Promise<TestItem[]> {
  return request<TestItem[]>('/list')
}

export function createTest(payload: CreateTestRequest): Promise<TestItem> {
  return request<TestItem>('/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTest(payload: UpdateTestRequest): Promise<TestItem> {
  return request<TestItem>('/update', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteTest(payload: DeleteTestRequest): Promise<TestItem> {
  return request<TestItem>('/delete', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
