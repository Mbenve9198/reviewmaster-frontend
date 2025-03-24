/**
 * Script di fix per il problema di build di Vercel.
 * Questo script crea artificialmente la struttura di directory e i file
 * che Vercel cerca durante la fase di creazione del bundle standalone.
 */

const fs = require('fs');
const path = require('path');

// Percorsi dei file che causano il problema
const basePath = process.cwd();
const targetDir = path.join(basePath, '.next/server/app/(site-layout)');
const targetFiles = [
  'page.js',
  'page_client-reference-manifest.js',
  'page.meta',
  'page.rsc'
];

// Crea la directory se non esiste
console.log(`Creazione della directory: ${targetDir}`);
try {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('✅ Directory creata con successo');
} catch (err) {
  console.error('❌ Errore nella creazione della directory:', err);
}

// Crea i file placeholder
for (const file of targetFiles) {
  const filePath = path.join(targetDir, file);
  console.log(`Creazione del file placeholder: ${filePath}`);
  try {
    fs.writeFileSync(filePath, '// Placeholder file creato per risolvere il problema di build');
    console.log(`✅ File ${file} creato con successo`);
  } catch (err) {
    console.error(`❌ Errore nella creazione del file ${file}:`, err);
  }
}

// Verifica che il file esista nella directory standalone (se presente)
const standaloneDir = path.join(basePath, '.next/standalone/.next/server/app/(site-layout)');
if (fs.existsSync(path.join(basePath, '.next/standalone'))) {
  console.log(`Creazione della directory standalone: ${standaloneDir}`);
  try {
    fs.mkdirSync(standaloneDir, { recursive: true });
    console.log('✅ Directory standalone creata con successo');
  
    // Copia i file placeholder nella directory standalone
    for (const file of targetFiles) {
      const sourceFile = path.join(targetDir, file);
      const destFile = path.join(standaloneDir, file);
      console.log(`Copia del file nella directory standalone: ${destFile}`);
      try {
        fs.copyFileSync(sourceFile, destFile);
        console.log(`✅ File ${file} copiato con successo`);
      } catch (err) {
        console.error(`❌ Errore nella copia del file ${file}:`, err);
      }
    }
  } catch (err) {
    console.error('❌ Errore nella creazione della directory standalone:', err);
  }
}

console.log('✅ Script completato'); 