import * as ts from "typescript"
import * as fs from "fs"
import * as path from "path"
import { Rule } from "./rules"

export interface ClassInfo {
  name: string
  fileName: string
  dependencies: string[]
}

export class Analyzer {
  public program: ts.Program
  public typeChecker: ts.TypeChecker
  private rules: Rule[] = []

  constructor(tsconfigPath: string) {
    this.program = this.loadProject(tsconfigPath)
    this.typeChecker = this.program.getTypeChecker()
  }

    public registerRule(rule: Rule) {
    this.rules.push(rule)
  }

  public runRules(): string[] {
    const classes = this.analyze()
    let results: string[] = []

    for (const rule of this.rules) {
      results = results.concat(rule.check(classes))
    }

    return results
  }

  private loadProject(tsconfigPath: string): ts.Program {
    if (!fs.existsSync(tsconfigPath)) {
      throw new Error(`tsconfig not found at: ${tsconfigPath}`)
    }

    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
    if (configFile.error) {
      throw new Error("Error reading tsconfig.json")
    }

    const configDir = path.dirname(tsconfigPath)

    const parsed = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      configDir
    )

    return ts.createProgram({
      rootNames: parsed.fileNames,
      options: parsed.options
    })
  }

  public analyze(): ClassInfo[] {
    const classes: ClassInfo[] = []

    for (const sourceFile of this.program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) continue

      ts.forEachChild(sourceFile, (node) => this.visitNode(node, sourceFile, classes))
    }

    return classes
  }

  private visitNode(node: ts.Node, sourceFile: ts.SourceFile, classes: ClassInfo[]) {
    if (ts.isClassDeclaration(node) && node.name) {
      const className = node.name.text
      const dependencies: string[] = []

      // Find constructor and its parameters
      const constructor = node.members.find(ts.isConstructorDeclaration)
      if (constructor) {
        for (const param of constructor.parameters) {
          const type = param.type
          if (type && ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)) {
            dependencies.push(type.typeName.text)
          }
        }
      }

      classes.push({
        name: className,
        fileName: sourceFile.fileName,
        dependencies
      })
    }

    // Recurse children
    ts.forEachChild(node, (child) => this.visitNode(child, sourceFile, classes))
  }

    public checkTooManyDependencies(maxDependencies: number = 5) {
        const classes = this.analyze() // reuse analyze method
        const warnings: string[] = []

        for (const cls of classes) {
            const depCount = cls.dependencies.length
            if (depCount > maxDependencies) {
                warnings.push(
                    `[WARNING] ${cls.name} in ${cls.fileName} has ${depCount} constructor dependencies → possible SRP violation`
                )
            }
        }
        return warnings
    }
}
