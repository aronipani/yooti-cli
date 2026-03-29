// src/samples/index.js
import { ecommerceStories } from './ecommerce-stories.js'

export const SAMPLE_APPS = {
  ecommerce: {
    name: 'Ecommerce demo',
    description: 'Full ecommerce app — catalogue, cart, checkout, auth, admin, design system',
    stack: ['node', 'react'],
    stories: ecommerceStories,
    sprint_1: [
      'STORY-001',  // Product catalogue
      'STORY-002',  // Product detail
      'STORY-003',  // User registration
      'STORY-004',  // Login and logout
      'STORY-005',  // Shopping cart
      'STORY-010',  // Rate limiting (security)
      'STORY-011',  // Design system
      'STORY-012',  // Layout + nav
      'STORY-013',  // Loading + errors
    ],
    sprint_2: [
      'STORY-006',  // Checkout
      'STORY-007',  // Order history
      'STORY-008',  // Product search
      'STORY-009',  // Admin products
    ],
    ux_stories: [
      'STORY-011',
      'STORY-012',
      'STORY-013',
    ]
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
