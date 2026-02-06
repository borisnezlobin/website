import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  datasource: {
    url:               env('PROD_POSTGRES_PRISMA_URL'),
    shadowDatabaseUrl: env('PROD_POSTGRES_PRISMA_URL')
  },
})