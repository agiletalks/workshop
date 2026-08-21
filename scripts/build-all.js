const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const distWorkshopDir = path.join(distDir, 'workshop');
const distAiArmDir = path.join(distWorkshopDir, 'ai-arm');

console.log('=== Starting Workshop Suite Build ===');

// Helper to recursively copy directories
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

// 1. Clean existing dist folder
try {
  if (fs.existsSync(distDir)) {
    console.log('Cleaning existing dist directory...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }
} catch (err) {
  console.warn('Warning during clean phase:', err.message);
}

// 2. Build marshmallow project
console.log('Building marshmallow project...');
try {
  execSync('npm run build', {
    cwd: path.join(rootDir, 'marshmallow'),
    stdio: 'inherit',
    shell: process.platform === 'win32' ? 'cmd.exe' : true
  });
  console.log('✓ Marshmallow project built successfully.');
} catch (err) {
  console.error('Error: Failed to build marshmallow project.');
  process.exit(1);
}

// 3. Copy ai-arm files to dist/workshop/ai-arm
console.log('Copying ai-arm static files...');
try {
  const aiArmSrc = path.join(rootDir, 'ai-arm');
  copyFolderSync(aiArmSrc, distAiArmDir);
  console.log('✓ AI-ARM static files copied successfully.');
} catch (err) {
  console.error('Error: Failed to copy ai-arm files:', err.message);
  process.exit(1);
}

// 4. Copy root index.html to dist/workshop/index.html
console.log('Copying root index.html to dist/workshop/index.html...');
try {
  const rootIndexSrc = path.join(rootDir, 'index.html');
  if (fs.existsSync(rootIndexSrc)) {
    fs.copyFileSync(rootIndexSrc, path.join(distWorkshopDir, 'index.html'));
    console.log('✓ Root index.html copied successfully.');
  } else {
    console.warn('Warning: Root index.html not found, skipping.');
  }
} catch (err) {
  console.error('Error: Failed to copy root index.html:', err.message);
  process.exit(1);
}

console.log('=== Build Completed Successfully ===');
console.log(`Build output is ready at: ${distDir}`);
