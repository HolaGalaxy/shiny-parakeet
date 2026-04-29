export const AuditEntity = {
  USER: 'User',
  SCHEMA: 'Schema',
  SCHEMA_FIELD: 'SchemaField',
  FEATURE_FIELD_VALUE: 'FeatureFieldValue',
  FIELD_REFERENCE: 'FieldReference',
} as const satisfies Record<string, string>

export type AuditEntityType = (typeof AuditEntity)[keyof typeof AuditEntity]
