export type SchemaItem = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type SchemaRow = {
  id: string
  name: string
  description: string | null
  createdAt: string
}
