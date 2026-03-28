function determineConstitutions(config, layers) {
  const constitutions = ['security', 'testing']
  if (layers.includes('api') && config.stack?.includes('node')) {
    constitutions.push('typescript')
  }
  if (layers.includes('frontend') && config.stack?.includes('react')) {
    constitutions.push('react', 'typescript')
  }
  if (layers.includes('api') && config.stack?.includes('python')) {
    constitutions.push('python')
  }
  if (layers.includes('agents')) {
    constitutions.push('python', 'langgraph')
  }
  if (config.stack?.includes('node') || config.stack?.includes('python')) {
    constitutions.push('postgresql')
  }
  return [...new Set(constitutions)]
}

export function featureStoryTemplate(config) {
  return {
    _template: "feature-story",
    _instructions: "Copy this file, rename it STORY-NNN-validated.json, fill in every field. The agent cannot start without all required fields.",
    story_id: "STORY-NNN",
    title: "As a [user type], I want to [action] so that [benefit]",
    type: "feature",
    priority: "P1 | P0 | P2 | P3",
    affected_layers: ["api", "frontend", "agents", "batch"],
    acceptance_criteria: [
      {
        id: "AC-1",
        given: "describe the starting state",
        when: "describe the action taken",
        then: "describe the expected outcome — must be measurable",
        testable: true,
        test_layer: "integration | unit | e2e"
      }
    ],
    non_functional_requirements: {
      performance: "e.g. API responds in < 200ms at P95",
      security: "e.g. endpoint requires authentication",
      accessibility: "e.g. form is fully keyboard accessible"
    },
    definition_of_done: [
      "All acceptance criteria have passing tests",
      "Coverage on new code >= 90%",
      "Security scan: 0 HIGH/CRITICAL",
      "Accessibility: 0 axe-core violations (if frontend)",
      "Mutation score >= 85%",
      "PR body includes evidence package"
    ],
    constitutions_to_apply: determineConstitutions(config, ["api", "frontend"]),
    ambiguity_flags: [],
    estimated_complexity: "XS | S | M | L | XL"
  }
}

export function bugfixStoryTemplate(config) {
  return {
    _template: "bugfix-story",
    _instructions: "Fill in root cause and reproduction steps before the agent starts. A regression test must be written first.",
    story_id: "STORY-NNN",
    title: "Fix: [description of the broken behaviour]",
    type: "bugfix",
    priority: "P0 | P1",
    bug_description: "What is broken and how does it manifest",
    reproduction_steps: [
      "Step 1",
      "Step 2",
      "Expected: what should happen",
      "Actual: what currently happens"
    ],
    root_cause: "Fill in after investigation — agent needs this",
    affected_files: [],
    acceptance_criteria: [
      {
        id: "AC-1",
        given: "the reproduction steps above are followed",
        when: "the fix is applied",
        then: "the bug no longer occurs and existing behaviour is preserved",
        testable: true,
        test_layer: "integration"
      }
    ],
    definition_of_done: [
      "Regression test written that reproduces the bug",
      "Regression test passes after fix",
      "Zero other tests broken by the fix",
      "Root cause documented in PR body",
      "Fix is minimal — no unrelated changes",
      "Coverage not reduced by the fix"
    ],
    constitutions_to_apply: determineConstitutions(config, ["api"]),
    agent_instructions: "Write the regression test FIRST. Make it fail. Then fix the code. The regression test must be in the test suite permanently."
  }
}

export function refactorStoryTemplate(config) {
  return {
    _template: "refactor-story",
    _instructions: "Refactors must not change observable behaviour. All existing tests must pass before and after.",
    story_id: "STORY-NNN",
    title: "Refactor: [what is being improved]",
    type: "refactor",
    priority: "P2 | P3",
    motivation: "Why is this refactor needed? What problem does it solve?",
    scope: "Which files and functions are being changed",
    acceptance_criteria: [
      {
        id: "AC-1",
        given: "the refactor is applied",
        when: "all existing tests are run",
        then: "all tests pass with no behaviour changes",
        testable: true,
        test_layer: "unit"
      }
    ],
    definition_of_done: [
      "All existing tests pass unchanged",
      "No new behaviour introduced",
      "Code complexity reduced (measured)",
      "Coverage not reduced",
      "PR body explains the improvement"
    ],
    constitutions_to_apply: determineConstitutions(config, ["api"]),
    agent_instructions: "Do not change observable behaviour. If you find a bug during refactoring, open a separate bugfix story. Do not fix it inline."
  }
}

export function agentStoryTemplate(config) {
  return {
    _template: "agent-story",
    _instructions: "Agent stories require three test layers. The eval layer must be written before the agent is considered done.",
    story_id: "STORY-NNN",
    title: "Agent: [what the agent does]",
    type: "feature",
    subtype: "agent",
    priority: "P1",
    agent_name: "descriptive-agent-name",
    agent_purpose: "One sentence: what this agent does and why",
    llm_provider: config.llmProvider || "anthropic",
    input_state_fields: ["describe what flows in"],
    output_state_fields: ["describe what flows out"],
    acceptance_criteria: [
      {
        id: "AC-1",
        given: "a valid input is provided to the agent",
        when: "the graph is invoked",
        then: "the agent returns a non-empty result with no error field",
        testable: true,
        test_layer: "integration"
      },
      {
        id: "AC-2",
        given: "an invalid or edge-case input is provided",
        when: "the graph is invoked",
        then: "the agent returns an error field — it does not raise an exception",
        testable: true,
        test_layer: "unit"
      }
    ],
    definition_of_done: [
      "Unit tests for every node — no real LLM calls",
      "Integration tests for full graph — mocked LLM",
      "Eval tests for output quality — real LLM, marked @pytest.mark.eval",
      "LangSmith tracing verified in development",
      "All node functions follow the LangGraph constitution",
      "State schema documented with field purposes"
    ],
    constitutions_to_apply: ["python", "langgraph", "security", "testing"],
    agent_instructions: "Build the state schema first. Then implement nodes one at a time with unit tests. Wire the graph last. Evals must be written before the story is closed."
  }
}

export function securityPatchTemplate(config) {
  return {
    _template: "security-patch",
    _instructions: "Security patches have the highest priority. The vulnerability test must be written first.",
    story_id: "STORY-NNN",
    title: "Security: [CVE or vulnerability description]",
    type: "bugfix",
    subtype: "security",
    priority: "P0",
    vulnerability_description: "What is the vulnerability and how can it be exploited",
    cve_reference: "CVE-YYYY-NNNNN if applicable",
    affected_component: "which file, endpoint, or dependency",
    severity: "CRITICAL | HIGH | MEDIUM",
    acceptance_criteria: [
      {
        id: "AC-1",
        given: "the attack vector described above is attempted",
        when: "the patch is applied",
        then: "the attack is blocked and returns an appropriate error",
        testable: true,
        test_layer: "integration"
      }
    ],
    definition_of_done: [
      "Security test written that demonstrates the vulnerability",
      "Security test passes (vulnerability is blocked) after patch",
      "Snyk scan shows vulnerability resolved",
      "Semgrep scan shows 0 findings",
      "Security event logged appropriately",
      "No other tests broken by the patch"
    ],
    constitutions_to_apply: ["security", "typescript", "testing"],
    agent_instructions: "Write a test that demonstrates the vulnerability FIRST. Confirm it fails (the vulnerability exists). Then patch. Confirm the test passes. Do not change anything outside the patch scope."
  }
}

export function apiContractTemplate(config) {
  return {
    _template: "api-contract",
    _instructions: "API stories require contract tests. The OpenAPI spec must be defined in the story before coding starts.",
    story_id: "STORY-NNN",
    title: "API: [endpoint or contract description]",
    type: "feature",
    subtype: "api-contract",
    priority: "P1",
    endpoint: "POST /api/v1/resource",
    method: "POST | GET | PUT | PATCH | DELETE",
    request_schema: {
      description: "Describe the request body fields here",
      example: {}
    },
    response_schema: {
      success: { status: 201, description: "describe success response" },
      errors: [
        { status: 400, description: "validation error" },
        { status: 401, description: "unauthenticated" },
        { status: 403, description: "unauthorised" }
      ]
    },
    acceptance_criteria: [
      {
        id: "AC-1",
        given: "a valid authenticated request",
        when: "the endpoint is called",
        then: "returns 201 with the defined response schema",
        testable: true,
        test_layer: "integration"
      },
      {
        id: "AC-2",
        given: "an unauthenticated request",
        when: "the endpoint is called",
        then: "returns 401",
        testable: true,
        test_layer: "integration"
      }
    ],
    definition_of_done: [
      "Contract tests cover all response codes defined above",
      "Request schema validated with Zod or Pydantic",
      "Authentication enforced",
      "OpenAPI spec updated to include this endpoint",
      "Supertest integration tests pass"
    ],
    constitutions_to_apply: determineConstitutions(config, ["api"]),
    agent_instructions: "Implement the exact request and response schemas defined above. Do not add or remove fields. If the schema is ambiguous, escalate before coding."
  }
}
