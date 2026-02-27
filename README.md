<div align="center">

# archeck

**A powerful TypeScript static analysis tool for detecting architecture violations and SOLID principle issues**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Dependency Analysis** | Analyzes class constructor dependencies across your TypeScript project |
| 🧩 **Extensible Rule System** | Plug in custom rules to enforce your own architectural constraints |
| ⚡ **Fast & Lightweight** | Built on TypeScript compiler API for accurate analysis |

### 📋 Built-in Rules

- **`TooManyDependencies`** — Detects classes with excessive constructor dependencies *(potential SRP violation)*
- **`DIPViolation`** — Detects classes depending on concrete implementations instead of abstractions

---

## 🚀 Installation

```bash
npm install
npm run build
```

---

## 📖 Usage

```bash
npx archeck <path-to-tsconfig>
```

### Example

```bash
npx archeck ./tsconfig.json
```

### Sample Output

```
⚠️  [WARNING] UserService in src/user.ts has 5 constructor dependencies → possible SRP violation
🔴 [DIP WARNING] OrderService in src/order.ts depends on concrete class PaymentProcessor
```

---

## 📏 Rules

### `TooManyDependencies`

> Flags classes whose constructors have more than N dependencies, which may indicate a **Single Responsibility Principle (SRP)** violation.

<details>
<summary>❌ Bad Example</summary>

```typescript
class UserService {
  constructor(
    private repo: UserRepository,
    private email: EmailService,
    private payment: PaymentService // Too many dependencies!
  ) {}
}
```

</details>

---

### `DIPViolation`

> Flags classes that depend on concrete implementations rather than abstractions, violating the **Dependency Inversion Principle**.

<details>
<summary>❌ Bad Example</summary>

```typescript
class UserService {
  constructor(private repo: UserRepository) {} // Depends on concrete class
}
```

</details>

<details>
<summary>✅ Good Example</summary>

```typescript
class UserService {
  constructor(private repo: IUserRepository) {} // Depends on interface ✓
}
```

</details>

---

## 🛠️ Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in development mode |
| `npm run build` | Build the project |
| `npm test` | Run tests |

---

## 🔧 Creating Custom Rules

Implement the `Rule` interface to create your own rules:

```typescript
import { ClassInfo } from "./analyzer"
import { Rule } from "./rules"

export class MyCustomRule implements Rule {
  name = "MyCustomRule"
  description = "Description of what this rule checks"

  check(classes: ClassInfo[]): string[] {
    const warnings: string[] = []
    
    for (const cls of classes) {
      // Your analysis logic here
      if (/* violation detected */) {
        warnings.push(`[WARNING] ${cls.name} violates MyCustomRule`)
      }
    }
    
    return warnings
  }
}
```

Then register your rule in `src/index.ts`:

```typescript
analyzer.registerRule(new MyCustomRule())
```

---