import * as ts from "typescript"
import * as fs from "fs"
import { Analyzer, ClassInfo } from "../src/analyzer"
import { TooManyDependenciesRule } from "../src/srp"
import { DIPViolationRule } from "../src/DIPViolationRule"

// Mock fs.existsSync to always return true for tests
jest.spyOn(fs, "existsSync").mockImplementation((path: fs.PathLike) => true)

// Mock ts functions
jest.spyOn(ts, "readConfigFile").mockImplementation(() => ({ config: {}, error: undefined }))
jest.spyOn(ts, "parseJsonConfigFileContent").mockImplementation(() => ({
  fileNames: ["test.ts"],
  options: {},
  errors: []
}))

// Mock ts.createProgram to return a fake program
const sourceFile = ts.createSourceFile(
  "test.ts",
  `
  export class UserRepository {}
  export class EmailService {}
  export class PaymentService {}
  export class UserService {
    constructor(
      private repo: UserRepository,
      private email: EmailService,
      private payment: PaymentService
    ) {}
  }
  `,
  ts.ScriptTarget.ES2020,
  true
)

jest.spyOn(ts, "createProgram").mockImplementation(() => ({
  getSourceFiles: () => [sourceFile],
  getTypeChecker: () => ({
    resolveName: () => undefined
  })
}) as any)

// Sample code for fixtures
const badCode = `
export class UserRepository {}
export class EmailService {}
export class PaymentService {}
export class UserService {
  constructor(
    private repo: UserRepository,
    private email: EmailService,
    private payment: PaymentService
  ) {}
}
`

const goodCode = `
export interface IUserRepo {}
export interface IEmailService {}
export class UserService {
  constructor(private repo: IUserRepo, private email: IEmailService) {}
}
`

jest.mock("typescript", () => {
  const original = jest.requireActual("typescript")

  // Create a fake source file for testing
  const sourceCode = `
    export class UserRepository {}
    export class EmailService {}
    export class PaymentService {}
    export class UserService {
      constructor(
        private repo: UserRepository,
        private email: EmailService,
        private payment: PaymentService
      ) {}
    }
  `

  const sourceFile = original.createSourceFile(
    "test.ts",
    sourceCode,
    original.ScriptTarget.ES2020,
    true
  )

  const fakeProgram = {
    getSourceFiles: () => [sourceFile],
    getTypeChecker: () => ({
      resolveName: () => undefined
    })
  }

  return {
    ...original,
    readConfigFile: jest.fn(() => ({ config: {}, error: undefined })),
    parseJsonConfigFileContent: jest.fn(() => ({
      fileNames: ["test.ts"],
      options: {}
    })),
    createProgram: jest.fn(() => fakeProgram)
  }
})

// Helper: create a Program from source code string
function createProgramFromSource(source: string): ts.Program {
  const sourceFile = ts.createSourceFile("test.ts", source, ts.ScriptTarget.ES2020, true)
  const host = ts.createCompilerHost({})
  const program = ts.createProgram({
    rootNames: ["test.ts"],
    options: {},
    host,
  })

  // Mock getSourceFiles to return our source file
  jest.spyOn(program, "getSourceFiles").mockReturnValue([sourceFile] as any)

  return program
}

// Mock ProjectAnalyzer to bypass tsconfig
jest.mock("../src/analyzer", () => {
  const original = jest.requireActual("../src/analyzer")
  return {
    ...original,
    Analyzer: class extends original.Analyzer {
      constructor(_tsconfigPath: string, programOverride?: ts.Program) {
        super(_tsconfigPath)
        if (programOverride) {
          this.program = programOverride
          this.typeChecker = this.program.getTypeChecker()
        }
      }
    }
  }
})

describe("SOLID rules (mocked TS program)", () => {
  it("detects too many dependencies", () => {
    const program = createProgramFromSource(badCode)
    const analyzer = new Analyzer("fakePath")
    analyzer.registerRule(new TooManyDependenciesRule(2)) // threshold 2
    const warnings = analyzer.runRules()
    expect(warnings).toContain(expect.stringContaining("UserService"))
  })

  it("does not trigger too many dependencies for compliant class", () => {
    const program = createProgramFromSource(goodCode)
    const analyzer = new Analyzer("fakePath")
    analyzer.registerRule(new TooManyDependenciesRule(3))
    const warnings = analyzer.runRules()
    expect(warnings).toHaveLength(0)
  })

  it("detects DIP violations", () => {
    const program = createProgramFromSource(badCode)
    const analyzer = new Analyzer("fakePath")
    analyzer.registerRule(new DIPViolationRule(analyzer.program, analyzer.typeChecker))
    const warnings = analyzer.runRules()
    expect(warnings).toContain(expect.stringContaining("UserRepository"))
  })

  it("does not trigger DIP violation for interfaces", () => {
    const program = createProgramFromSource(goodCode)
    const analyzer = new Analyzer("fakePath")
    analyzer.registerRule(new DIPViolationRule(analyzer.program, analyzer.typeChecker))
    const warnings = analyzer.runRules()
    expect(warnings).toHaveLength(0)
  })
})
