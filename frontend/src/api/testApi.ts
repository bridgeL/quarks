import { apiRequest } from './base'
import type { CreateTestRequest, DeleteTestRequest, TestItem, UpdateTestRequest } from '../types'

const BASE_URL = 'http://127.0.0.1:52000/test'

export async function listTests(): Promise<TestItem[]> {
  const result = await apiRequest<TestItem[]>(`${BASE_URL}/list`)
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}

export async function createTest(payload: CreateTestRequest): Promise<TestItem> {
  const result = await apiRequest<TestItem>(`${BASE_URL}/create`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}

export async function updateTest(payload: UpdateTestRequest): Promise<TestItem> {
  const result = await apiRequest<TestItem>(`${BASE_URL}/update`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}

export async function deleteTest(payload: DeleteTestRequest): Promise<TestItem> {
  const result = await apiRequest<TestItem>(`${BASE_URL}/delete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.error) {
    throw new Error(result.error)
  }
  return result.data!
}
