import { ClassInfo } from "./analyzer"

export interface Rule {
  name: string
  description?: string
  check(classes: ClassInfo[]): string[] // returns warnings/errors
}
