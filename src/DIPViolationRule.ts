import { ClassInfo } from "./analyzer"
import { Rule } from "./rules"
import * as ts from "typescript"

export class DIPViolationRule implements Rule {
  name = "DIPViolation"
  description = "Warns if a class depends on concrete classes instead of abstractions"

  private program: ts.Program
  private typeChecker: ts.TypeChecker

  constructor(program: ts.Program, typeChecker: ts.TypeChecker) {
    this.program = program
    this.typeChecker = typeChecker
  }

  check(classes: ClassInfo[]): string[] {
    const warnings: string[] = []

    for (const cls of classes) {
      for (const depName of cls.dependencies) {
        const depSymbol = this.typeChecker.resolveName(
          depName,
          undefined,
          ts.SymbolFlags.Class,
          false
        )

        if (depSymbol) {
          // If the symbol is a concrete class (not abstract)
          const decl = depSymbol.valueDeclaration as ts.ClassDeclaration
          if (decl && !decl.modifiers?.some(m => m.kind === ts.SyntaxKind.AbstractKeyword)) {
            warnings.push(
              `[DIP WARNING] ${cls.name} in ${cls.fileName} depends on concrete class ${depName}`
            )
          }
        }
      }
    }

    return warnings
  }
}
