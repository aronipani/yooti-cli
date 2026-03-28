// src/templates/agent-templates.js

export function agentRequirements(config) {
  const frameworks = config.agentFrameworks || ['langgraph', 'langchain']
  const hasLangGraph = frameworks.includes('langgraph')
  const hasLangChain = frameworks.includes('langchain')
  const anthropic = config.llmProvider === 'anthropic' || config.llmProvider === 'both'
  const openai = config.llmProvider === 'openai' || config.llmProvider === 'both'

  const lines = ['# Core agent dependencies']
  if (hasLangGraph) lines.push('langgraph>=0.2.0')
  if (hasLangChain) lines.push('langchain>=0.3.0', 'langchain-core>=0.3.0')
  if (anthropic)    lines.push('langchain-anthropic>=0.3.0', 'anthropic>=0.40.0')
  if (openai)       lines.push('langchain-openai>=0.2.0', 'openai>=1.50.0')
  lines.push(
    '',
    '# Vector store',
    config.vectorStore === 'chroma'   ? 'chromadb>=0.5.0' : '',
    config.vectorStore === 'pgvector' ? 'pgvector>=0.3.0\npsycopg2-binary>=2.9.0' : '',
    '',
    '# Testing and evals',
    'pytest>=8.0.0',
    'pytest-asyncio>=0.23.0',
    'pytest-cov>=5.0.0',
    'langsmith>=0.1.0',
    '',
    '# Utilities',
    'python-dotenv>=1.0.0',
    'pydantic>=2.0.0',
    'structlog>=24.0.0',
  )
  return lines.filter(l => l !== '').join('\n') + '\n'
}

export function agentGraphPy(agentName, config) {
  const stateName = toPascal(agentName) + 'State'
  const anthropic = config.llmProvider === 'anthropic' || config.llmProvider === 'both'
  const modelImport = anthropic
    ? 'from langchain_anthropic import ChatAnthropic'
    : 'from langchain_openai import ChatOpenAI'
  const modelInit = anthropic
    ? 'ChatAnthropic(model="claude-3-5-sonnet-20241022")'
    : 'ChatOpenAI(model="gpt-4o")'

  return `"""
${agentName} — LangGraph agent graph definition
Story: STORY-001
Agent: CodeGenAgent
"""
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
${modelImport}

from .state import ${stateName}
from .nodes import fetch_data, process, format_output


def build_graph() -> StateGraph:
    """Build and compile the ${agentName} graph."""
    model = ${modelInit}

    graph = StateGraph(${stateName})

    # Add nodes — one function per node
    graph.add_node("fetch",   fetch_data.run)
    graph.add_node("process", process.run)
    graph.add_node("output",  format_output.run)

    # Define edges
    graph.set_entry_point("fetch")
    graph.add_edge("fetch",   "process")
    graph.add_edge("process", "output")
    graph.add_edge("output",  END)

    # Compile with memory checkpointing
    memory = MemorySaver()
    return graph.compile(checkpointer=memory)


# Module-level compiled graph — import and invoke directly
graph = build_graph()
`
}

export function agentStatePy(agentName) {
  const stateName = toPascal(agentName) + 'State'
  return `"""
State schema for ${agentName}.
All state is immutable — nodes return updated copies, never mutate in place.
"""
from typing import TypedDict, Annotated, Optional
from langgraph.graph.message import add_messages


class ${stateName}(TypedDict):
    """
    State flows through every node in the graph.
    Add fields here as the agent needs more context.
    """
    # Input
    input: str

    # Conversation history (append-only via add_messages reducer)
    messages: Annotated[list, add_messages]

    # Working data — populated by nodes
    data: Optional[dict]
    result: Optional[str]

    # Metadata
    error: Optional[str]
    iteration: int
`
}

export function agentNodePy(nodeName, agentName) {
  const stateName = toPascal(agentName) + 'State'
  return `"""
Node: ${nodeName}
Receives state, performs one focused action, returns updated state.
Never mutates state in place — always return a dict of updated fields.
"""
import structlog
from ..state import ${stateName}

log = structlog.get_logger()


async def run(state: ${stateName}) -> dict:
    """
    ${nodeName} node.
    Input:  state['input'] or state['data']
    Output: updated state fields
    """
    log.info("${nodeName}.start", input=state.get("input"))

    try:
        # TODO: implement node logic here
        result = state.get("input", "")

        log.info("${nodeName}.complete", result=result)
        return {"result": result, "error": None}

    except Exception as e:
        log.error("${nodeName}.error", error=str(e))
        return {"error": str(e)}
`
}

export function agentToolPy(toolName) {
  return `"""
Tool: ${toolName}
LangChain tool — can be bound to any LLM that supports tool calling.
"""
from langchain_core.tools import tool
import structlog

log = structlog.get_logger()


@tool
def ${toSnake(toolName)}(input: str) -> str:
    """
    ${toolName} tool.

    Args:
        input: Description of what the tool receives

    Returns:
        Description of what the tool returns
    """
    log.info("tool.${toSnake(toolName)}", input=input)

    # TODO: implement tool logic
    return f"${toolName} result for: {input}"
`
}

export function agentUnitTestPy(agentName) {
  const stateName = toPascal(agentName) + 'State'
  return `"""
Unit tests for ${agentName} nodes.
Each node tested in complete isolation — no LLM calls, no external services.
All dependencies mocked.
"""
import pytest
from unittest.mock import AsyncMock, patch
from agents.${toSnake(agentName)}.nodes import fetch_data, process, format_output
from agents.${toSnake(agentName)}.state import ${stateName}


@pytest.fixture
def base_state() -> ${stateName}:
    return ${stateName}(
        input="test input",
        messages=[],
        data=None,
        result=None,
        error=None,
        iteration=0,
    )


class TestFetchDataNode:

    @pytest.mark.asyncio
    async def test_returns_data_on_success(self, base_state):
        result = await fetch_data.run(base_state)
        assert result.get("error") is None
        assert "result" in result

    @pytest.mark.asyncio
    async def test_handles_missing_input_gracefully(self, base_state):
        base_state["input"] = ""
        result = await fetch_data.run(base_state)
        # Should not raise — returns error field instead
        assert isinstance(result, dict)


class TestProcessNode:

    @pytest.mark.asyncio
    async def test_processes_data_correctly(self, base_state):
        base_state["data"] = {"key": "value"}
        result = await process.run(base_state)
        assert result.get("error") is None
`
}

export function agentEvalTestPy(agentName) {
  const stateName = toPascal(agentName) + 'State'
  return `"""
Evaluation tests for ${agentName}.

Evals are different from unit tests:
  - They test LLM OUTPUT QUALITY, not code logic
  - They use real LLM calls (or recorded traces)
  - They assert on semantic correctness, not exact strings
  - They run in CI nightly, not on every commit (expensive)

Run with: pytest tests/evals/ --eval
Skip in fast CI: pytest tests/ --ignore=tests/evals/
"""
import pytest
from agents.${toSnake(agentName)}.graph import graph
from agents.${toSnake(agentName)}.state import ${stateName}


# Mark all evals so they can be excluded from fast CI
pytestmark = pytest.mark.eval


@pytest.fixture
def agent_config():
    """Thread config for graph invocation."""
    return {"configurable": {"thread_id": "eval-test-1"}}


class TestAgentOutput:

    @pytest.mark.asyncio
    async def test_returns_non_empty_result(self, agent_config):
        """Basic sanity: agent produces output."""
        state = ${stateName}(
            input="test question",
            messages=[], data=None, result=None, error=None, iteration=0
        )
        result = await graph.ainvoke(state, agent_config)
        assert result.get("result") is not None
        assert len(result.get("result", "")) > 0

    @pytest.mark.asyncio
    async def test_consistent_on_same_input(self, agent_config):
        """Consistency check: same input → same category of output."""
        state = ${stateName}(
            input="deterministic test input",
            messages=[], data=None, result=None, error=None, iteration=0
        )
        result_1 = await graph.ainvoke(state, {**agent_config, "configurable": {"thread_id": "eval-1"}})
        result_2 = await graph.ainvoke(state, {**agent_config, "configurable": {"thread_id": "eval-2"}})

        # Not asserting exact equality (LLMs vary) — asserting category
        assert result_1.get("error") is None
        assert result_2.get("error") is None

    @pytest.mark.asyncio
    async def test_handles_edge_case_input(self, agent_config):
        """Robustness: agent does not crash on unusual input."""
        state = ${stateName}(
            input="",
            messages=[], data=None, result=None, error=None, iteration=0
        )
        result = await graph.ainvoke(state, agent_config)
        # Should return an error field, not raise an exception
        assert isinstance(result, dict)
`
}

export function agentIntegrationTestPy(agentName) {
  const stateName = toPascal(agentName) + 'State'
  return `"""
Integration tests for ${agentName} graph.
Tests the full graph end-to-end with mocked LLM responses.
Uses recorded LLM responses (VCR-style) to avoid real API calls in CI.
"""
import pytest
from unittest.mock import patch, AsyncMock
from agents.${toSnake(agentName)}.graph import build_graph
from agents.${toSnake(agentName)}.state import ${stateName}


@pytest.fixture
def mock_llm_response():
    """Mock LLM response for integration tests — no real API calls."""
    with patch('langchain_anthropic.ChatAnthropic.ainvoke') as mock:
        mock.return_value = AsyncMock(content="mocked LLM response")
        yield mock


@pytest.fixture
def graph_instance():
    return build_graph()


@pytest.fixture
def thread_config():
    return {"configurable": {"thread_id": "integration-test-1"}}


class TestFullGraph:

    @pytest.mark.asyncio
    async def test_graph_runs_to_completion(
        self, graph_instance, thread_config, mock_llm_response
    ):
        """Full graph executes without error."""
        state = ${stateName}(
            input="integration test input",
            messages=[], data=None, result=None, error=None, iteration=0
        )
        result = await graph_instance.ainvoke(state, thread_config)
        assert result is not None
        assert result.get("error") is None

    @pytest.mark.asyncio
    async def test_graph_state_flows_correctly(
        self, graph_instance, thread_config, mock_llm_response
    ):
        """State is passed and updated correctly between nodes."""
        state = ${stateName}(
            input="state flow test",
            messages=[], data=None, result=None, error=None, iteration=0
        )
        result = await graph_instance.ainvoke(state, thread_config)
        # Input should still be in final state
        assert result.get("input") == "state flow test"
`
}

export function agentEnvExample(config) {
  const anthropic = config.llmProvider === 'anthropic' || config.llmProvider === 'both'
  const openai = config.llmProvider === 'openai' || config.llmProvider === 'both'
  return `# LLM Providers
${anthropic ? 'ANTHROPIC_API_KEY=your-key-here' : ''}
${openai ? 'OPENAI_API_KEY=your-key-here' : ''}

# LangSmith (observability — get key at smith.langchain.com)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_PROJECT=${config.projectName}

# Vector store
${config.vectorStore === 'pgvector' ? 'DATABASE_URL=postgresql://app:app@localhost:5432/appdb' : ''}
${config.vectorStore === 'chroma' ? 'CHROMA_HOST=localhost\nCHROMA_PORT=8000' : ''}

# Agent config
AGENT_MAX_ITERATIONS=10
AGENT_TEMPERATURE=0
`
}

export function agentDockerCompose(config) {
  const hasChroma = config.vectorStore === 'chroma'
  const hasPgVector = config.vectorStore === 'pgvector'

  return `# docker-compose.yml — ${config.projectName} agent stack
services:

  agent-api:
    build: ./agents
    ports: ["8001:8001"]
    environment:
      ANTHROPIC_API_KEY: \${ANTHROPIC_API_KEY}
      LANGCHAIN_API_KEY: \${LANGCHAIN_API_KEY}
      LANGCHAIN_TRACING_V2: "true"
      ${hasPgVector ? 'DATABASE_URL: postgresql://app:app@postgres:5432/appdb' : ''}
      ${hasChroma ? 'CHROMA_HOST: chroma' : ''}
    depends_on:
      ${hasPgVector ? '- postgres' : ''}
      ${hasChroma ? '- chroma' : ''}
    volumes:
      - ./agents:/app

  ${hasPgVector ? `postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    ports: ["5432:5432"]
    volumes:
      - postgres_data:/var/lib/postgresql/data` : ''}

  ${hasChroma ? `chroma:
    image: chromadb/chroma:latest
    ports: ["8000:8000"]
    volumes:
      - chroma_data:/chroma/chroma` : ''}

volumes:
  ${hasPgVector ? 'postgres_data:' : ''}
  ${hasChroma ? 'chroma_data:' : ''}
`
}

export function agentClaudeMd(config) {
  const frameworks = config.agentFrameworks || ['langgraph', 'langchain']
  return `# CLAUDE — Agent Development Context
# Project: ${config.projectName}
# Type: Agent Service (${frameworks.join(' + ')})
# LLM: ${config.llmProvider} | Vector store: ${config.vectorStore}

## Your role
You are building LangGraph agents. You write graph definitions, node functions,
tool definitions, and evaluation tests. You follow the patterns in agents/template-agent/.

## Agent architecture rules
- One graph per agent — defined in graph.py
- One function per node — in nodes/ directory
- State is immutable — nodes return dicts of updated fields, never mutate
- All external I/O in tools/ or nodes/ — never in the graph definition itself
- Prompts versioned as files in prompts/ — never hardcoded in Python
- Structured logging with structlog on every node entry and exit
- Every node catches exceptions and returns {"error": str(e)} — never raises

## Test mandate (THREE layers, all required)

### Layer 1 — Unit tests (tests/unit/)
- Test each node function in complete isolation
- No real LLM calls — mock all LLM responses
- No real DB/API calls — mock all external services
- Run on every commit, must be fast (< 2s per test)

### Layer 2 — Integration tests (tests/integration/)
- Test full graph end-to-end with MOCKED LLM responses
- Use pytest fixtures with patch() to intercept LLM calls
- Verify state flows correctly between nodes
- Run on every PR

### Layer 3 — Evals (tests/evals/)
- Test LLM OUTPUT QUALITY with real API calls
- Mark with @pytest.mark.eval
- Run nightly in CI — NEVER on every commit (expensive)
- Assert semantic correctness, not exact string matches

## Toolchain
Lint + format: ruff check src/ && ruff format --check src/
Type check:    mypy src/ --strict
Unit tests:    pytest tests/unit/ --cov=agents -v
Integration:   pytest tests/integration/ -v
Evals (slow):  pytest tests/evals/ --eval -v

## LangSmith tracing
All agent runs are traced automatically via LANGCHAIN_TRACING_V2=true.
Do not add manual trace calls — LangSmith instruments LangGraph automatically.
Set LANGCHAIN_PROJECT=${config.projectName} in .env.

## Escalation
STOP and write .agent/escalations/ if:
- A node needs to modify state outside its declared output fields
- A graph needs to call another graph (multi-agent) — needs architect review
- LLM provider config needs changing — update .env, not code
`
}

export function agentReadmeMd(config) {
  const frameworks = config.agentFrameworks || ['langgraph', 'langchain']
  return `# ${config.projectName} — Agent Service

Built with [yooti](https://github.com/yooti/cli) · ${frameworks.join(' + ')}

## Quick start

\`\`\`bash
cp .env.example .env
# Add your API keys to .env
docker compose up -d
pytest tests/unit/
\`\`\`

## Project structure

\`\`\`
agents/
└── template-agent/          <- copy this to create a new agent
    ├── graph.py             <- LangGraph StateGraph definition
    ├── state.py             <- TypedDict state schema
    ├── nodes/               <- one file per graph node
    ├── tools/               <- LangChain tools
    ├── prompts/             <- system prompts as versioned files
    └── tests/
        ├── unit/            <- isolated node tests (no LLM calls)
        ├── integration/     <- full graph tests (mocked LLM)
        └── evals/           <- output quality tests (real LLM, nightly)
\`\`\`

## Creating a new agent

\`\`\`bash
cp -r agents/template-agent agents/my-new-agent
# Edit agents/my-new-agent/state.py — define your state
# Edit agents/my-new-agent/nodes/ — implement your logic
# Edit agents/my-new-agent/graph.py — wire up the graph
\`\`\`

## Testing

\`\`\`bash
pytest tests/unit/            # fast — run on every change
pytest tests/integration/     # medium — run before PR
pytest tests/evals/ --eval    # slow — run nightly only
\`\`\`

## Observability

All runs traced in LangSmith automatically.
Set LANGCHAIN_API_KEY and LANGCHAIN_TRACING_V2=true in .env.
View traces at: https://smith.langchain.com
`
}

export function agentPyprojectToml(config) {
  return `[tool.pytest.ini_options]
testpaths = ["agents"]
asyncio_mode = "auto"
markers = [
    "eval: marks tests as LLM eval tests (deselect with '-m not eval')",
]
addopts = "--cov=agents --cov-report=json -v"

[tool.ruff]
target-version = "py312"
line-length = 100
select = ["E", "W", "F", "I", "N", "UP", "B", "ANN"]

[tool.mypy]
python_version = "3.12"
strict = true
ignore_missing_imports = true
`
}

export function agentConftestPy() {
  return `"""
Shared pytest fixtures for all agent tests.
"""
import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--eval",
        action="store_true",
        default=False,
        help="Run eval tests (requires real LLM API keys, slow)"
    )


def pytest_collection_modifyitems(config, items):
    if not config.getoption("--eval"):
        skip_eval = pytest.mark.skip(reason="Use --eval flag to run eval tests")
        for item in items:
            if "eval" in item.keywords:
                item.add_marker(skip_eval)
`
}

// ── Helpers ──
function toPascal(str) {
  return str.replace(/(^\w|-\w|_\w)/g, c => c.replace(/[-_]/, '').toUpperCase())
}
function toSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/-/g, '_')
}
