#!/usr/bin/env node

/**
 * Post-install script for Specra
 * This script creates a config.schema.json file in the project root
 * for better IDE support and validation
 */

const fs = require('fs');
const path = require('path');

// Check if we're being installed as a dependency (not in development)
const isPostInstall = process.env.INIT_CWD && process.env.INIT_CWD !== process.cwd();

if (!isPostInstall) {
  console.log('Skipping postinstall script in development mode');
  process.exit(0);
}

try {
  // Find the project root (where package.json is)
  const projectRoot = process.env.INIT_CWD || process.cwd();

  // Path to the schema file in node_modules
  const schemaSource = path.join(__dirname, '../src/lib/config.schema.json');

  // Destination in the project root
  const schemaDestination = path.join(projectRoot, 'specra.config.schema.json');

  // Check if schema source exists
  if (!fs.existsSync(schemaSource)) {
    console.error('❌ Config schema file not found');
    process.exit(0);
  }

  // Copy schema to project root
  fs.copyFileSync(schemaSource, schemaDestination);

  console.log('✅ Specra config schema created at:', schemaDestination);
  console.log('💡 Update your specra.config.json to use: "$schema": "./specra.config.schema.json"');
} catch (error) {
  // Don't fail the installation if this script fails
  console.warn('⚠️  Failed to create config schema:', error.message);
}
