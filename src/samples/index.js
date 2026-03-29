// src/samples/index.js
import { ecommerceStories } from './ecommerce-stories.js'

export const SAMPLE_APPS = {
  ecommerce: {
    name: 'Ecommerce demo',
    description: 'Full ecommerce app — catalogue, cart, checkout, auth, admin',
    stack: ['node', 'react'],
    stories: ecommerceStories,
    sprint_1: ['STORY-001', 'STORY-002', 'STORY-003', 'STORY-004', 'STORY-005', 'STORY-010'],
    sprint_2: ['STORY-006', 'STORY-007', 'STORY-008', 'STORY-009'],
  }
  // Add more sample apps here as they are built:
  // saas: { ... },
  // blog: { ... },
  // dashboard: { ... },
}

export function listSampleApps() {
  return Object.entries(SAMPLE_APPS).map(([key, app]) => ({
    key,
    name:        app.name,
    description: app.description,
    story_count: app.stories.length,
    stack:       app.stack,
  }))
}

export function getSampleStories(appKey, options = {}) {
  const app = SAMPLE_APPS[appKey]
  if (!app) return null

  if (options.sprint) {
    const sprintKey = `sprint_${options.sprint}`
    const ids = app[sprintKey] || []
    return app.stories.filter(s => ids.includes(s.story_id))
  }

  return app.stories
}
