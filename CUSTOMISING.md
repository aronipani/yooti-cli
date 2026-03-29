# Yooti — Customising Your Pipeline

This guide shows how to wire your existing tools into the Yooti pipeline.
The framework is language agnostic. The Reference Implementation ships one
opinionated stack. This document is for teams who use something else.

---

## The mental model

Yooti's quality gates expect certain outputs. It does not care how those
outputs are produced — only that they are produced in the expected format
at the expected time.

    GATE G4 expects:    A passing test suite
                        A coverage report
                        A security scan result
                        A regression diff vs the baseline
                        A code audit vs your constitutions

    HOW YOU PRODUCE THEM is up to you. The Reference Implementation
    uses pytest, Vitest, Snyk, and Semgrep. Your team uses whatever
    tools your stack requires.

---

## What the evidence package looks like

Gate G4 reads these files from `.agent/evidence/[ID]/`. Your custom scripts
must produce files in these formats — the content is yours, the schema is fixed.

**test-results.json** — pass/fail counts per layer:

```json
{
  "story_id": "PROJ-123",
  "generated_at": "2026-03-29T14:32:00Z",
  "layers": {
    "api": {
      "unit":        { "passed": 24, "failed": 0, "skipped": 0 },
      "integration": { "passed":  8, "failed": 0, "skipped": 0 }
    },
    "frontend": {
      "unit":        { "passed": 18, "failed": 0, "skipped": 2 }
    }
  },
  "total_passed": 50,
  "total_failed": 0,
  "duration_seconds": 12.4
}
```

**coverage-summary.json** — overall and new code percentages:

```json
{
  "story_id": "PROJ-123",
  "overall_pct": 94.2,
  "new_code_pct": 98.7,
  "threshold_overall": 80,
  "threshold_new_code": 90,
  "passed": true,
  "layers": {
    "api":      { "lines": 94.2, "branches": 91.0 },
    "frontend": { "lines": 96.1, "branches": 88.4 }
  },
  "uncovered_files": []
}
```

**security-scan.json** — dependency and code scan results:

```json
{
  "story_id": "PROJ-123",
  "scanned_at": "2026-03-29T14:33:00Z",
  "dependency_scan": {
    "tool": "snyk",
    "critical": 0,
    "high": 0,
    "medium": 2,
    "low": 5,
    "passed": true
  },
  "code_scan": {
    "tool": "semgrep",
    "findings": 0,
    "passed": true
  }
}
```

**regression-diff.json** — tests failing that were passing before the sprint:

```json
{
  "story_id": "PROJ-123",
  "baseline_captured": "2026-03-28T09:00:00Z",
  "newly_failing": [],
  "newly_passing": 12,
  "total_tests": 318,
  "passed": true
}
```

**code-audit.md** — constitution compliance check (plain markdown):

```markdown
# Code Audit — PROJ-123
Generated: 2026-03-29T14:34:00Z

## Constitution checks

| Rule | Files checked | Violations |
|------|--------------|-----------|
| No hardcoded secrets | 14 | 0 |
| Tests before implementation | 6 new files | 0 |
| No bare except clauses | 14 | 0 |
| No direct DB queries in routes | 4 | 0 |
| All public functions documented | 14 | 0 |

**Result: PASSED — 0 violations**
```

**What your custom scripts must output:**
The agent calls your `test_coverage` command and reads the output.
For non-standard tools, pipe the output to the evidence folder and tell
the agent in CLAUDE.md how to parse it:

```markdown
## Coverage output — Go
Command: go test ./... -coverprofile=coverage.out
Parse:   go tool cover -func=coverage.out | tail -1
Format:  "total: (statements) 94.2%"
Write:   .agent/evidence/[ID]/coverage-summary.json
```

---

## Step 1 — Tell Yooti about your toolchain

Open `yooti.config.json` and update the toolchain section for your layers:

    {
      "toolchain": {
        "api": {
          "runtime":          "go",
          "lint_command":     "golangci-lint run ./...",
          "type_check":       "go vet ./...",
          "test_command":     "go test ./... -v",
          "test_unit":        "go test ./... -run Unit",
          "test_integration": "go test ./... -run Integration",
          "test_coverage":    "go test ./... -cover -coverprofile=coverage.out",
          "mutation":         "go-mutesting ./...",
          "coverage_threshold": 80,
          "new_code_threshold": 90
        }
      }
    }

The agent reads these commands from yooti.config.json and runs them during
Phase 4 (build loop) and Phase 5 (evidence generation).

---

## Step 2 — Write constitutions for your stack

Delete the RI-specific constitution stubs and write your own:

    rm .claude/constitutions/python.md     # if you are not using Python
    rm .claude/constitutions/react.md      # if you are not using React

Write your stack's constitution:

    cat > .claude/constitutions/go.md << 'EOF'
    # Go Constitution
    # The agent reads this before writing any Go code.

    ## Patterns
    - Errors are values — always check, never ignore with _
    - No global state — pass dependencies explicitly as function parameters
    - Interfaces defined at the point of use, not the point of implementation
    - Table-driven tests for all pure functions
    - Context is the first parameter in every function that does IO

    ## Testing
    - go test ./... must pass before any commit
    - Test files in the same package as the code they test
    - Use testify/assert for assertions — not raw t.Error()
    - Benchmark any function that runs in a hot path

    ## Security
    - No credentials in code — use environment variables
    - All user input validated before use
    - SQL queries use parameterised inputs — never fmt.Sprintf into SQL
    EOF

    cat > .claude/constitutions/java.md << 'EOF'
    # Java + Spring Constitution

    ## Patterns
    - Constructor injection only — never @Autowired on fields
    - Every @Service has a corresponding interface
    - Repository methods return Optional<T> for nullable results
    - No business logic in @Controller classes

    ## Testing
    - JUnit 5 + Mockito for unit tests
    - @SpringBootTest for integration tests — not unit tests
    - Test method names: methodName_stateUnderTest_expectedBehavior()

    ## Security
    - No secrets in application.properties — use environment variables
    - All endpoints explicitly mapped to security rules
    - SQL via JPA/QueryDSL — no raw SQL string concatenation
    EOF

Reference them in .claude/CLAUDE.md:

    Go code:         .claude/constitutions/go.md
    Java + Spring:   .claude/constitutions/java.md

---

## Step 3 — Map your tools to the quality gates

Use this table to identify what to put in each toolchain field:

| Requirement | RI default | Go | Java | Ruby | Rust |
|-------------|-----------|-----|------|------|------|
| Lint | ruff / ESLint | golangci-lint | checkstyle | rubocop | clippy |
| Type check | mypy / tsc | go vet | javac -Xlint | sorbet | rustc |
| Unit tests | pytest / vitest | go test -run Unit | mvn test | rspec --tag unit | cargo test |
| Integration | pytest -m integration | go test -run Integration | mvn verify | rspec --tag integration | cargo test --test integration |
| Coverage | coverage.py / istanbul | go test -cover | jacoco | simplecov | cargo tarpaulin |
| Security | bandit / snyk | govulncheck | OWASP dep-check | bundler-audit | cargo audit |
| Mutation | mutmut / stryker | go-mutesting | pitest | mutant | cargo-mutants |

---

## Step 4 — Configure the evidence package format

Phase 5 generates evidence files that Gate G4 reads. The format is
JSON — your tools need to output data that the agent can translate
into the expected format.

The agent handles this translation automatically if your toolchain
commands are in yooti.config.json. For custom output formats, add
a note to CLAUDE.md:

    ## Coverage output format — Go
    The coverage command produces: go test -cover -coverprofile=coverage.out
    Parse with: go tool cover -func=coverage.out
    Extract the total line from the output and write to:
    .agent/evidence/[ID]/coverage-summary.json

---

## Step 5 — Update the CI workflows

The generated GitHub Actions workflows use RI defaults. Update them
to use your tools:

    # .github/workflows/unit-tests.yml
    # Replace the default test steps with your stack's commands

    - name: Run tests (Go)
      run: go test ./... -v -cover
      working-directory: ./your-service

    - name: Generate coverage
      run: go tool cover -func=coverage.out > coverage-summary.txt

Or if you already have CI, add the Yooti gate checks alongside your
existing jobs:

    - name: Check G4 evidence exists
      run: |
        STORY_ID=$(git log --format=%s HEAD~1 | grep -oP '[A-Z]+-\d+' | head -1)
        if [ ! -f ".agent/evidence/${STORY_ID}/test-results.json" ]; then
          echo "G4 evidence package missing for ${STORY_ID}"
          exit 1
        fi

---

## Complete examples by stack

---

### Go + Gin + PostgreSQL

    # yooti.config.json toolchain section
    "api": {
      "runtime":          "go",
      "version":          "1.22",
      "lint_command":     "golangci-lint run ./...",
      "type_check":       "go vet ./...",
      "test_command":     "go test ./... -v",
      "test_unit":        "go test ./... -run TestUnit",
      "test_integration": "go test ./... -run TestIntegration -tags integration",
      "test_coverage":    "go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out",
      "coverage_threshold": 80,
      "new_code_threshold": 90
    }

    # Constitution: .claude/constitutions/go.md (see Step 2 above)

---

### Java 21 + Spring Boot + PostgreSQL

    # yooti.config.json toolchain section
    "api": {
      "runtime":          "java",
      "version":          "21",
      "lint_command":     "mvn checkstyle:check",
      "type_check":       "mvn compile -q",
      "test_command":     "mvn test",
      "test_unit":        "mvn test -Dgroups=unit",
      "test_integration": "mvn verify -Dgroups=integration",
      "test_coverage":    "mvn jacoco:report",
      "coverage_threshold": 80,
      "new_code_threshold": 90
    }

---

### Ruby on Rails + PostgreSQL

    # yooti.config.json toolchain section
    "api": {
      "runtime":          "ruby",
      "version":          "3.3",
      "lint_command":     "bundle exec rubocop",
      "type_check":       "bundle exec srb tc",
      "test_command":     "bundle exec rspec",
      "test_unit":        "bundle exec rspec --tag unit",
      "test_integration": "bundle exec rspec --tag integration",
      "test_coverage":    "COVERAGE=true bundle exec rspec",
      "coverage_threshold": 80,
      "new_code_threshold": 90
    }

---

### .NET 8 + C# + SQL Server

    # yooti.config.json toolchain section
    "api": {
      "runtime":          "dotnet",
      "version":          "8",
      "lint_command":     "dotnet format --verify-no-changes",
      "type_check":       "dotnet build --no-restore -warnaserror",
      "test_command":     "dotnet test",
      "test_unit":        "dotnet test --filter Category=Unit",
      "test_integration": "dotnet test --filter Category=Integration",
      "test_coverage":    "dotnet test --collect:\"XPlat Code Coverage\"",
      "coverage_threshold": 80,
      "new_code_threshold": 90
    }

---

## The global constitution — works for any stack

Regardless of language, these rules apply. Put them in global.md:

    # .claude/constitutions/global.md

    ## Tests (any language)
    Every new function has a unit test before implementation (TDD).
    No external service calls in unit tests — mock everything.
    No new dependency added without Gate G2 approval.
    Tests assert observable behaviour — not implementation details.

    ## Security (any language)
    No secrets, passwords, or tokens in any code or config file.
    All user input validated before use.
    Errors never expose stack traces, file paths, or internal details.
    SQL queries use parameterised inputs — never string concatenation.

    ## Quality (any language)
    Every public function has a doc comment.
    No commented-out code in production files.
    All configuration from environment variables — never hardcoded.

    ## Scope (enforced by pipeline)
    Only touch files listed in the task plan (CREATE or MODIFY).
    If a file outside scope is needed: write an escalation, stop.

---

## What you cannot customise (by design)

These parts of the framework are fixed. They are fixed because they are
the governance — changing them removes the value.

    The five gates              G1 through G5 exist in every project
    The gate file format        .agent/gates/[ID]-G[N]-approved.md
    The evidence package format .agent/evidence/[ID]/*.json
    The escalation system       .agent/escalations/ — agent writes, human resolves
    The audit trail             .agent/logs/ — immutable once written
    The phase order             1 through 7 — plans before code, evidence before PR

Everything else is configurable: the language, the tools, the thresholds,
the constitutions, the adoption stage, the CI platform, the ticket ID format.

---

*Yooti Customising Guide — v1.2*
