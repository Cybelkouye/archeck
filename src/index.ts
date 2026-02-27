#!/usr/bin/env node
import * as path from "path"
import { Analyzer } from "./analyzer"
import { TooManyDependenciesRule } from "./srp"
import { DIPViolationRule } from "./DIPViolationRule"

const inputPath = process.argv[2]

if (!inputPath) {
  console.error("Usage: npx archcheck <path-to-tsconfig>")
  process.exit(1)
}

const absolutePath = path.resolve(process.cwd(), inputPath)

try {
  const analyzer = new Analyzer(absolutePath)
//   const classes = analyzer.analyze()

//   for (const cls of classes) {
//     // console.log(`Class: ${cls.name}, File: ${cls.fileName}`)
//     if (cls.dependencies.length) {
//       console.log(`Class: ${cls.name}, File: ${cls.fileName}`)
//       console.log(`  Dependencies: ${cls.dependencies.join(", ")}`)
//     }
//   }

    // check classes for too many dependencies
    // const warnings = analyzer.checkTooManyDependencies(2) // set threshold to 2 for testing
    // for (const warning of warnings) {
    //     console.log(warning)
    // }

    analyzer.registerRule(new TooManyDependenciesRule(2)) // threshold 3 for testing
    analyzer.registerRule(new DIPViolationRule(analyzer.program, analyzer.typeChecker))

    const warnings = analyzer.runRules()
    for (const warning of warnings) {
        console.log(warning)
    }

} catch (err) {
  console.error("Error:", (err as Error).message)
  process.exit(1)
}