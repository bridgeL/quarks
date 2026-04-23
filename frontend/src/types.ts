export type TestItem = {
  id: string
  name: string
}

export type CreateTestRequest = {
  name: string
}

export type UpdateTestRequest = {
  id: string
  name: string
}

export type DeleteTestRequest = {
  id: string
}
