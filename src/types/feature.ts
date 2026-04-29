export type FieldReference = {
  id: string
  targetFeatureId: string
  targetSchemaName: string
  targetFieldName: string
  targetSchemaFieldId: string
}

export type FeatureFieldRow = {
  schemaFieldId: string
  name: string
  valueType: string
  defaultValue: unknown
  createdAt: string
  effectiveValue: unknown
  reference: FieldReference | null
}

export type FeatureFieldsResponse = {
  schemaId: string
  schemaName: string
  featureId: string
  featureName: string
  fields: FeatureFieldRow[]
}

export type PendingAdd = {
  localKey: string
  consumerSchemaFieldId: string
  targetSchemaName: string
  targetFieldName: string
}

export type PendingRemove = {
  referenceId: string
}

export type ReferenceDialogState = {
  pendingAdds: PendingAdd[]
  pendingRemoves: Set<string>
}
