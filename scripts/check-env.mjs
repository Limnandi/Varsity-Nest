#!/usr/bin/env node

// Load environment variables from .env.local
import { readFileSync } from 'fs'
import { join } from 'path'

try {
  const envPath = join(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (error) {
  console.log('⚠️  Could not load .env.local file:', error.message)
}

console.log(' Environment Variables Check:')
console.log('================================')

// Check required StackAuth variables
const requiredVars = [
  'NEXT_PUBLIC_STACK_PROJECT_ID',
  'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY', 
  'STACK_SECRET_SERVER_KEY'
]

const missingVars = []

requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(` ${varName}: ${value.substring(0, 10)}...`)
  } else {
    console.log(` ${varName}: MISSING`)
    missingVars.push(varName)
  }
})

console.log('\n Other Important Variables:')
console.log('==============================')

const otherVars = [
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL',
  'NODE_ENV'
]

otherVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(` ${varName}: ${value}`)
  } else {
    console.log(` ${varName}: MISSING`)
  }
})

if (missingVars.length > 0) {
  console.log('\n Missing required StackAuth variables:')
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`)
  })
  console.log('\n Make sure to set these in your .env.local file')
  process.exit(1)
} else {
  console.log('\n All required StackAuth variables are present!')
}
