// STEP 0: this file is used only by the TypeORM CLI (migrations).
// Export a default DataSource built from dbConfig.
// entities: ['src/**/*.entity.ts']

import { dbConfig } from "./db.config";
import { DataSource } from 'typeorm';
export default new DataSource({
    ...dbConfig,
     entities: ['src/**/*.entity.ts'],
     migrations: ['src/database/migrations/*.ts'],
     synchronize : false
});