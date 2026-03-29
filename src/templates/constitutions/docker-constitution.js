export function dockerConstitution(config) {
  const services = []

  if (config.stack?.includes('python') || config.projectType === 'full') {
    services.push({ name: 'api_python', port: 8000, envPrefix: 'API_PYTHON' })
  }
  if (config.stack?.includes('node')) {
    services.push({ name: 'api', port: 3000, envPrefix: 'API' })
  }
  if (config.stack?.includes('react') || config.stack?.includes('nextjs')) {
    services.push({ name: 'frontend', port: config.stack?.includes('nextjs') ? 3000 : 5173 })
  }

  return `# Docker Constitution
# Applies to: docker-compose.yml, docker-compose.*.yml, Dockerfile

## The golden rule
Docker configuration must exactly match environment variable definitions.
If PORT=8000 is in .env.example, the container must EXPOSE 8000
and the compose service must map "8000:8000".
Mismatches between .env and docker-compose are a P0 defect.

## Port assignments for this project

${services.map(s => `  ${s.name.padEnd(16)} → port ${s.port}`).join('\n')}
${config.hasPostgres ? '  postgres         → port 5432' : ''}
${config.hasRedis    ? '  redis            → port 6379' : ''}
${config.hasMongo    ? '  mongodb          → port 27017' : ''}

These ports are fixed. Do not change them without updating:
  .env.example, all service configs, and health check URLs.

## docker-compose.yml rules

Every service MUST have:
  build: path to the service directory with a Dockerfile
  ports: host:container matching .env.example exactly
  environment: variables read from .env (use \${VAR_NAME} syntax)
  healthcheck: a real health check endpoint — not just a ping
  restart: unless-stopped

Environment variables in docker-compose MUST use .env values:
  CORRECT:   DATABASE_URL=\${DATABASE_URL}
  WRONG:     DATABASE_URL=postgresql://localhost:5432/mydb

Never hardcode:
  Passwords, secrets, or API keys
  Hostnames (use service names for inter-service communication)
  Port numbers in environment variables (use the .env values)

Inter-service communication:
  Services communicate using Docker service names not localhost
  CORRECT:   DATABASE_URL=postgresql://app:app@postgres:5432/appdb
  WRONG:     DATABASE_URL=postgresql://app:app@localhost:5432/appdb
  The service name in docker-compose IS the hostname inside Docker

## Dockerfile rules

Every Dockerfile MUST:
  Use a specific version tag — never :latest
  Install dependencies before copying source (for layer caching)
  Use non-root user for production images
  Have a HEALTHCHECK instruction
  Use .dockerignore to exclude tests/, .env, __pycache__

Development Dockerfiles (used in compose):
  Use npm install not npm ci (no lockfile guarantee)
  Mount source as a volume for hot reload
  Expose the port defined in .env.example

Production Dockerfiles (separate file):
  Use npm ci for reproducible builds
  Multi-stage build to minimise image size
  No development dependencies in final image

## Health check URLs — match these exactly

${services.map(s => `  ${s.name.padEnd(16)} → http://localhost:${s.port}/health`).join('\n')}

Every service MUST implement GET /health returning:
  { "status": "ok", "service": "[name]", "version": "0.1.0" }
`
}
