const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Change provider
schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');
schema = schema.replace('url      = env("DATABASE_URL")', 'url      = "file:./dev.db"');

// 2. Remove all enum blocks and collect their names
const enumRegex = /enum\s+(\w+)\s*{[^}]+}/g;
let match;
const enums = [];
while ((match = enumRegex.exec(schema)) !== null) {
  enums.push(match[1]);
}
schema = schema.replace(enumRegex, '');

// 3. Replace enum types with String and quote defaults
enums.forEach(e => {
  // Replace type declaration: e.g., role Role @default(INTERN) -> role String @default("INTERN")
  // Regex to find field declarations using the enum
  const fieldRegex = new RegExp(`(\\w+)\\s+(${e})(\\s+@default\\(([^)]+)\\))?`, 'g');
  schema = schema.replace(fieldRegex, (m, fieldName, type, defaultPart, defaultVal) => {
    let newField = `${fieldName} String`;
    if (defaultPart) {
      newField += ` @default("${defaultVal}")`;
    }
    return newField;
  });
  
  // also handle optional enums like `role Role?`
  const optFieldRegex = new RegExp(`(\\w+)\\s+(${e}\\?)(\\s+@default\\(([^)]+)\\))?`, 'g');
  schema = schema.replace(optFieldRegex, (m, fieldName, type, defaultPart, defaultVal) => {
    let newField = `${fieldName} String?`;
    if (defaultPart) {
      newField += ` @default("${defaultVal}")`;
    }
    return newField;
  });
});

// 4. Replace String[] with String (for arrays)
schema = schema.replace(/String\[\]/g, 'String');

// 5. Replace @db.Date with nothing
schema = schema.replace(/@db\.Date/g, '');

// 6. Replace JSON with String (since SQLite doesn't natively support JSON in Prisma, wait, Prisma DOES support Json for SQLite? Actually, sometimes it doesn't. Wait, Prisma 5 does NOT support Json in SQLite. We must change Json to String)
schema = schema.replace(/Json\?/g, 'String?');
schema = schema.replace(/Json/g, 'String');

// 7. Fix up any specific things that might have been missed
// For example: @unique([taskId, dependsOnTaskId]) is fine.
// Float is fine in SQLite.
// DateTime is fine.
// Boolean is fine.

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Schema converted to SQLite!');
