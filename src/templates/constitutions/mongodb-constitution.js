export function mongodbConstitution(config) {
  return `# MongoDB Constitution — ${config.projectName}

## Naming conventions
Collections:    camelCase plural — users, paymentTransactions
Fields:         camelCase — userId, createdAt, firstName
Indexes:        [collection]_[field]_idx

## Document structure rules
Every document must have:
  createdAt: Date
  updatedAt: Date
Use _id (ObjectId) as primary key — never create your own id field

## Query rules
Never use find() without a limit() in production queries
Always use projection — return only fields you need
Use indexes for all frequently queried fields
Never store unbounded arrays — they kill query performance

## What is banned
Storing passwords or tokens in plaintext
Unbounded array fields that grow indefinitely
Queries without indexes on large collections
String-based $where queries (security + performance)
`;
}
