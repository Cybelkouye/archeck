import { ClassInfo } from "./analyzer"
import { Rule } from "./rules"

export class TooManyDependenciesRule implements Rule {
  name = "TooManyDependencies"
  description = "Warns if a class has too many constructor dependencies (possible SRP violation)"
  private max: number

  constructor(maxDependencies: number = 5) {
    this.max = maxDependencies
  }

  check(classes: ClassInfo[]): string[] {
    const warnings: string[] = []

    for (const cls of classes) {
      const depCount = cls.dependencies.length
      if (depCount > this.max) {
        warnings.push(
          `[WARNING] ${cls.name} in ${cls.fileName} has ${depCount} constructor dependencies → possible SRP violation`
        )
      }
    }

    return warnings
  }
}
