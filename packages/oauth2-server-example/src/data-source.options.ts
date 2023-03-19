import { config } from 'dotenv';
import path from 'path';
import { DataSourceOptions } from 'typeorm';

config({ path: path.join(__dirname, '.env') });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.POSTGRES_URL,
};
