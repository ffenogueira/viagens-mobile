import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const localesRoot = path.resolve('src/i18n/locales')
const sourceRoot = path.resolve('src')
const locales = ['pt-BR', 'en', 'es']
const namespaces = fs.readdirSync(path.join(localesRoot, 'pt-BR')).filter((name) => name.endsWith('.json'))
const allowedJsxText = new Set(['V', 'Viagens', 'by Up Your Idea', 'FEFAI', 'Lv.1'])
const allowedAttributes = new Set(['0,00', '2', '14:30'])
const issues = []

for (const namespace of namespaces) {
  const reference = JSON.parse(fs.readFileSync(path.join(localesRoot, 'pt-BR', namespace), 'utf8'))
  const referenceKeys = Object.keys(reference).sort()

  for (const locale of locales.slice(1)) {
    const candidate = JSON.parse(fs.readFileSync(path.join(localesRoot, locale, namespace), 'utf8'))
    const candidateKeys = Object.keys(candidate).sort()
    const missing = referenceKeys.filter((key) => !candidateKeys.includes(key))
    const extra = candidateKeys.filter((key) => !referenceKeys.includes(key))
    if (missing.length) issues.push(`${locale}/${namespace}: missing ${missing.join(', ')}`)
    if (extra.length) issues.push(`${locale}/${namespace}: extra ${extra.join(', ')}`)
  }
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(fullPath)
    return /\.tsx?$/.test(entry.name) ? [fullPath] : []
  })
}

for (const filename of sourceFiles(sourceRoot)) {
  const source = fs.readFileSync(filename, 'utf8')
  const sourceFile = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = node.text.trim()
      if (/[A-Za-zÀ-ÿ]/.test(value) && !allowedJsxText.has(value)) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
        issues.push(`${path.relative(process.cwd(), filename)}:${line}: untranslated JSX text ${JSON.stringify(value)}`)
      }
    }

    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const name = node.name.getText(sourceFile)
      const value = node.initializer.text
      if (['placeholder', 'label', 'title'].includes(name) && /[A-Za-zÀ-ÿ]/.test(value) && !allowedAttributes.has(value)) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
        issues.push(`${path.relative(process.cwd(), filename)}:${line}: untranslated ${name} ${JSON.stringify(value)}`)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

if (issues.length) {
  console.error(issues.join('\n'))
  process.exit(1)
}

console.log(`i18n OK: ${namespaces.length} namespaces aligned across ${locales.join(', ')}, with no literal UI copy.`)
