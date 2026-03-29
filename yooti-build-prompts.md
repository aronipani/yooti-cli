# Yooti CLI — Build Prompts for Unbuilt Commands

All prompts are ready to paste directly into Claude Code inside the `yooti-cli` repo.
Run them in the order listed. Each session is independent but builds on the previous.

---

## Session order

```
SESSION 1   story:import, story:sample
SESSION 2   task:add, plan:amend, plan:approve
SESSION 3   context:add, correct:inject, test:require
SESSION 4   qa:plan, qa:review
SESSION 5   audit, log:event, sprint:report
SESSION 6   sm:standup
SESSION 7   constitution system + story type templates (generator.js)
SESSION 8   unit test scaffold (generator.js)
SESSION 9   regression suite (generator.js)
```

---

---

# SESSION 1 — story:import and story:sample

## Prompt

Read `src/commands/story.js` and `bin/yooti.js` before starting.
Add two new commands: `story:import` and `story:sample`.
Do not modify any existing commands.
All imports use `.js` extension.

---

### TASK 1 — Create `src/samples/ecommerce-stories.js`

Create this file in full:

```javascript
// src/samples/ecommerce-stories.js
export const ecommerceStories = [
  {
    story_id: 'STORY-001',
    title: 'As a shopper, I want to browse the product catalogue so that I can find items to purchase',
    type: 'feature',
    priority: 'P0',
    sprint: 1,
    affected_layers: ['api', 'frontend'],
    acceptance_criteria: [
      {
        id: 'AC-1',
        given: 'a shopper visits the shop homepage',
        when: 'the page loads',
        then: 'they see a grid of products showing name, price, thumbnail image, and stock status',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-2',
        given: 'a shopper is on the catalogue page',
        when: 'they filter by category',
        then: 'only products in that category are shown and the URL updates to reflect the filter',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-3',
        given: 'a shopper is on the catalogue page',
        when: 'they sort by price low to high',
        then: 'products are reordered with the lowest price first',
        testable: true,
        test_layer: 'unit'
      },
      {
        id: 'AC-4',
        given: 'a product is out of stock',
        when: 'it appears in the catalogue',
        then: 'it shows an Out of Stock badge and the Add to Cart button is disabled',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-5',
        given: 'there are more than 20 products',
        when: 'the shopper reaches the bottom of the page',
        then: 'the next 20 products load automatically without a full page reload',
        testable: true,
        test_layer: 'integration'
      }
    ],
    non_functional_requirements: {
      performance: 'Catalogue page loads in under 1.5 seconds at P95 with 100 products',
      accessibility: 'Product grid is navigable by keyboard. Each product card has a descriptive aria-label.',
      security: 'No authentication required — catalogue is public'
    },
    definition_of_done: [
      'All AC have passing integration tests',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'Accessibility: 0 axe-core violations',
      'Lighthouse performance score >= 80',
      'Mutation score >= 85%'
    ],
    constitutions_to_apply: ['typescript', 'react', 'postgresql', 'security', 'testing'],
    api_endpoints: [
      'GET /api/v1/products?category=&sort=&page=&limit=',
      'GET /api/v1/categories'
    ],
    estimated_complexity: 'M',
    ambiguity_flags: []
  },
  {
    story_id: 'STORY-002',
    title: 'As a shopper, I want to view a product detail page so that I can see full information before purchasing',
    type: 'feature',
    priority: 'P0',
    sprint: 1,
    affected_layers: ['api', 'frontend'],
    acceptance_criteria: [
      {
        id: 'AC-1',
        given: 'a shopper clicks on a product in the catalogue',
        when: 'the product detail page loads',
        then: 'they see product name, full description, price, all available images, stock quantity, and category',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-2',
        given: 'a product has multiple images',
        when: 'the shopper clicks a thumbnail',
        then: 'the main image updates to show the selected thumbnail',
        testable: true,
        test_layer: 'unit'
      },
      {
        id: 'AC-3',
        given: 'a shopper selects a quantity greater than available stock',
        when: 'the quantity is changed',
        then: 'the quantity is capped at available stock and a message explains why',
        testable: true,
        test_layer: 'unit'
      },
      {
        id: 'AC-4',
        given: 'a shopper navigates directly to a product URL',
        when: 'the product does not exist',
        then: 'they see a 404 page with a link back to the catalogue',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-5',
        given: 'a shopper is on a product detail page',
        when: 'they click Add to Cart',
        then: 'the item is added to their cart and the cart icon shows the updated count',
        testable: true,
        test_layer: 'integration'
      }
    ],
    non_functional_requirements: {
      performance: 'Product detail page loads in under 1 second at P95',
      accessibility: 'Images have descriptive alt text. Quantity input has label and min/max attributes.',
      security: 'Product ID in URL validated as UUID — not a sequential integer'
    },
    definition_of_done: [
      'All AC have passing tests',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'Accessibility: 0 axe-core violations',
      'Mutation score >= 85%'
    ],
    constitutions_to_apply: ['typescript', 'react', 'postgresql', 'security', 'testing'],
    api_endpoints: ['GET /api/v1/products/:id'],
    estimated_complexity: 'S',
    ambiguity_flags: []
  },
  {
    story_id: 'STORY-003',
    title: 'As a new visitor, I want to create an account so that I can place orders and track my purchases',
    type: 'feature',
    priority: 'P0',
    sprint: 1,
    affected_layers: ['api', 'frontend'],
    acceptance_criteria: [
      {
        id: 'AC-1',
        given: 'a visitor submits the registration form with a valid email and password',
        when: 'the form is submitted',
        then: 'their account is created, they are automatically signed in, and redirected to the homepage',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-2',
        given: 'a visitor submits a registration form with an email already registered',
        when: 'the form is submitted',
        then: 'they see: An account with this email already exists — and the form is not cleared',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-3',
        given: 'a visitor submits a password shorter than 8 characters',
        when: 'the form is submitted',
        then: 'they see: Password must be at least 8 characters — before any API call is made',
        testable: true,
        test_layer: 'unit'
      },
      {
        id: 'AC-4',
        given: 'a visitor submits an invalid email format',
        when: 'the form is submitted',
        then: 'they see: Please enter a valid email address — before any API call is made',
        testable: true,
        test_layer: 'unit'
      },
      {
        id: 'AC-5',
        given: 'a new account is created',
        when: 'registration completes',
        then: 'a welcome email is sent to the registered address within 60 seconds',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-6',
        given: '5 or more failed registration attempts are made from the same IP in 15 minutes',
        when: 'the next attempt is made',
        then: 'the response is 429 with: Too many attempts. Please try again in 15 minutes.',
        testable: true,
        test_layer: 'integration'
      }
    ],
    non_functional_requirements: {
      performance: 'Registration API responds in under 500ms at P95',
      accessibility: 'Form inputs have associated labels. Error messages linked via aria-describedby.',
      security: 'Passwords hashed with bcrypt cost factor 12. Email enumeration prevented. Rate limiting enforced.'
    },
    definition_of_done: [
      'All AC have passing tests',
      'Password hashing verified in unit tests',
      'Rate limiting verified in integration tests',
      'Email enumeration timing test passes',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'Accessibility: 0 axe-core violations',
      'Mutation score >= 85%'
    ],
    constitutions_to_apply: ['typescript', 'react', 'postgresql', 'security', 'testing'],
    api_endpoints: ['POST /api/v1/auth/register'],
    estimated_complexity: 'M',
    ambiguity_flags: []
  },
  {
    story_id: 'STORY-004',
    title: 'As a registered user, I want to sign in and out of my account so that I can access my order history and saved details',
    type: 'feature',
    priority: 'P0',
    sprint: 1,
    affected_layers: ['api', 'frontend'],
    acceptance_criteria: [
      {
        id: 'AC-1',
        given: 'a registered user submits valid credentials',
        when: 'they sign in',
        then: 'they are redirected to the homepage, their name appears in the header, and they stay signed in on page refresh',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-2',
        given: 'a user submits incorrect credentials',
        when: 'they attempt to sign in',
        then: 'they see: Incorrect email or password — no indication given which field is wrong',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-3',
        given: 'a signed-in user clicks Sign Out',
        when: 'sign out completes',
        then: 'their session is invalidated server-side, they are redirected to the homepage, and protected routes are inaccessible',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-4',
        given: "a user's session token expires after 24 hours",
        when: 'they try to access a protected page',
        then: 'they are redirected to sign-in with: Your session has expired. Please sign in again.',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-5',
        given: 'a user makes 10 failed login attempts',
        when: 'the 11th attempt is made',
        then: 'the account is temporarily locked for 30 minutes and the user sees a clear message',
        testable: true,
        test_layer: 'integration'
      }
    ],
    non_functional_requirements: {
      performance: 'Login API responds in under 300ms at P95',
      security: 'JWT tokens with 24h expiry. Refresh token in httpOnly cookie not localStorage. Session invalidated server-side on logout.',
      accessibility: 'Error messages associated with form fields via aria-describedby'
    },
    definition_of_done: [
      'All AC have passing tests',
      'Token storage verified: httpOnly cookie not localStorage',
      'Server-side session invalidation verified on logout',
      'Brute force lockout verified in integration tests',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'Mutation score >= 85%'
    ],
    constitutions_to_apply: ['typescript', 'react', 'postgresql', 'security', 'testing'],
    api_endpoints: [
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/logout',
      'POST /api/v1/auth/refresh'
    ],
    estimated_complexity: 'M',
    ambiguity_flags: []
  },
  {
    story_id: 'STORY-005',
    title: 'As a shopper, I want to manage my shopping cart so that I can review and adjust my items before checkout',
    type: 'feature',
    priority: 'P0',
    sprint: 1,
    affected_layers: ['api', 'frontend'],
    acceptance_criteria: [
      {
        id: 'AC-1',
        given: 'a shopper adds a product to their cart',
        when: 'the item is added',
        then: 'the cart icon shows the updated item count and the item appears in the cart drawer with name, price, quantity, and subtotal',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-2',
        given: 'a shopper adds the same product twice',
        when: 'the second add occurs',
        then: 'the quantity increments by 1 rather than creating a duplicate line item',
        testable: true,
        test_layer: 'unit'
      },
      {
        id: 'AC-3',
        given: 'a shopper changes the quantity of a cart item to 0',
        when: 'the change is confirmed',
        then: 'the item is removed from the cart',
        testable: true,
        test_layer: 'unit'
      },
      {
        id: 'AC-4',
        given: 'a shopper has items in their cart',
        when: 'they close the browser and return within 7 days',
        then: 'their cart items are still present',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-5',
        given: "a cart item's stock drops below the quantity in the cart",
        when: 'the shopper views their cart',
        then: 'a warning appears showing the new stock level and quantity is adjusted to maximum available',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-6',
        given: 'a shopper views a non-empty cart',
        when: 'the cart drawer opens',
        then: 'they see the order subtotal, estimated tax, and a Proceed to Checkout button',
        testable: true,
        test_layer: 'integration'
      }
    ],
    non_functional_requirements: {
      performance: 'Cart updates reflect in under 200ms',
      security: 'Cart stored server-side for authenticated users. Guest carts in Redis with 7-day TTL. Prices validated server-side at checkout.',
      accessibility: 'Quantity inputs have labels. Remove buttons have aria-labels. Cart total announced to screen readers on update.'
    },
    definition_of_done: [
      'All AC have passing tests',
      'Price validation server-side verified',
      'Guest cart Redis TTL verified',
      'Stock validation at view time verified',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'Accessibility: 0 axe-core violations',
      'Mutation score >= 85%'
    ],
    constitutions_to_apply: ['typescript', 'react', 'postgresql', 'security', 'testing'],
    api_endpoints: [
      'GET    /api/v1/cart',
      'POST   /api/v1/cart/items',
      'PUT    /api/v1/cart/items/:productId',
      'DELETE /api/v1/cart/items/:productId'
    ],
    estimated_complexity: 'L',
    ambiguity_flags: []
  },
  {
    story_id: 'STORY-006',
    title: 'As a shopper, I want to complete a checkout so that I can place and pay for my order',
    type: 'feature',
    priority: 'P0',
    sprint: 2,
    affected_layers: ['api', 'frontend'],
    acceptance_criteria: [
      {
        id: 'AC-1',
        given: 'a shopper proceeds to checkout with items in their cart',
        when: 'the checkout page loads',
        then: 'they see a summary of cart items, delivery address form, and payment section',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-2',
        given: 'a shopper completes all checkout fields and submits',
        when: 'the order is placed successfully',
        then: 'they see an order confirmation page with order number, item summary, and estimated delivery date',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-3',
        given: 'an order is placed successfully',
        when: 'placement completes',
        then: 'a confirmation email is sent within 60 seconds containing the order number and itemised summary',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-4',
        given: 'an item in the cart went out of stock between cart and checkout',
        when: 'the order is submitted',
        then: 'the order is rejected and the shopper is returned to the cart with a message identifying the out-of-stock item',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-5',
        given: 'a payment fails',
        when: 'the shopper is notified',
        then: 'they see a clear error message, no order is created, and no stock is reserved',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-6',
        given: 'two shoppers attempt to purchase the last unit of a product simultaneously',
        when: 'both orders are submitted',
        then: 'only one order succeeds and the other receives an out-of-stock error — no overselling occurs',
        testable: true,
        test_layer: 'integration'
      }
    ],
    non_functional_requirements: {
      performance: 'Checkout submission responds in under 2 seconds at P95',
      security: 'Prices recalculated server-side. Payment details never logged. Idempotency key required to prevent duplicate orders.',
      accessibility: 'All form fields have labels. Progress steps announced to screen readers.'
    },
    definition_of_done: [
      'All AC have passing tests',
      'Server-side price recalculation verified',
      'Stock decrement atomicity verified with concurrent order test',
      'Idempotency key test: same key twice creates one order not two',
      'Payment details absence from logs verified',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'Accessibility: 0 axe-core violations',
      'Mutation score >= 85%'
    ],
    constitutions_to_apply: ['typescript', 'react', 'postgresql', 'security', 'testing'],
    api_endpoints: [
      'POST /api/v1/orders',
      'GET  /api/v1/orders/:id'
    ],
    estimated_complexity: 'XL',
    ambiguity_flags: []
  },
  {
    story_id: 'STORY-007',
    title: 'As a signed-in user, I want to view my order history so that I can track past purchases',
    type: 'feature',
    priority: 'P1',
    sprint: 2,
    affected_layers: ['api', 'frontend'],
    acceptance_criteria: [
      {
        id: 'AC-1',
        given: 'a signed-in user navigates to My Orders',
        when: 'the page loads',
        then: 'they see all past orders sorted by date descending showing order number, date, status, and total',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-2',
        given: 'a signed-in user clicks on an order',
        when: 'the order detail page loads',
        then: 'they see all items ordered, quantities, individual prices, delivery address, and current status',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-3',
        given: "a user attempts to access another user's order by manipulating the order ID in the URL",
        when: 'the request is made',
        then: 'they receive a 404 — no information about the order existence is revealed',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-4',
        given: 'a user has more than 10 orders',
        when: 'they view the orders page',
        then: 'orders are paginated with 10 per page and pagination controls allow navigation',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-5',
        given: 'a user has no orders',
        when: 'they view the orders page',
        then: 'they see: You have not placed any orders yet with a link to the catalogue',
        testable: true,
        test_layer: 'unit'
      }
    ],
    non_functional_requirements: {
      performance: 'Order list loads in under 500ms at P95',
      security: 'Orders scoped to authenticated user — user ID from JWT not request body.',
      accessibility: 'Order status communicated with text not colour alone. Table has proper column headers.'
    },
    definition_of_done: [
      'All AC have passing tests',
      'IDOR test passes: user cannot access other user orders',
      'Authentication requirement verified',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'Accessibility: 0 axe-core violations',
      'Mutation score >= 85%'
    ],
    constitutions_to_apply: ['typescript', 'react', 'postgresql', 'security', 'testing'],
    api_endpoints: [
      'GET /api/v1/orders?page=&limit=',
      'GET /api/v1/orders/:id'
    ],
    estimated_complexity: 'M',
    ambiguity_flags: []
  },
  {
    story_id: 'STORY-008',
    title: 'As a shopper, I want to search for products by name or description so that I can find specific items quickly',
    type: 'feature',
    priority: 'P1',
    sprint: 2,
    affected_layers: ['api', 'frontend'],
    acceptance_criteria: [
      {
        id: 'AC-1',
        given: 'a shopper types at least 2 characters in the search bar',
        when: 'the input is debounced at 300ms',
        then: 'search results appear showing matching products by name or description',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-2',
        given: 'a shopper searches for a term that matches no products',
        when: 'results load',
        then: 'they see: No products found for [search term] with a suggestion to browse by category',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-3',
        given: 'a shopper types rapidly in the search bar',
        when: 'keystrokes occur faster than 300ms apart',
        then: 'the API is called at most once per 300ms — not on every keystroke',
        testable: true,
        test_layer: 'unit'
      },
      {
        id: 'AC-4',
        given: 'a shopper submits a search query containing SQL special characters',
        when: 'the search executes',
        then: 'the characters are treated as literal text and no SQL error occurs',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-5',
        given: 'a shopper clears the search bar',
        when: 'the input is empty',
        then: 'results are cleared and the full catalogue is restored',
        testable: true,
        test_layer: 'unit'
      }
    ],
    non_functional_requirements: {
      performance: 'Search API responds in under 300ms at P95 for catalogues up to 10000 products',
      security: 'Search query sanitised — parameterised queries only. Maximum query length 200 characters.',
      accessibility: 'Search input has role=search. Results region has aria-live=polite.'
    },
    definition_of_done: [
      'All AC have passing tests',
      'SQL injection test passes',
      'Debounce behaviour verified in unit test',
      'Full text search index on products table verified in migration',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'Accessibility: 0 axe-core violations',
      'Mutation score >= 85%'
    ],
    constitutions_to_apply: ['typescript', 'react', 'postgresql', 'security', 'testing'],
    api_endpoints: ['GET /api/v1/products/search?q=&page=&limit='],
    estimated_complexity: 'M',
    ambiguity_flags: []
  },
  {
    story_id: 'STORY-009',
    title: 'As an admin, I want to manage products so that I can add, update, and remove items from the catalogue',
    type: 'feature',
    priority: 'P1',
    sprint: 2,
    affected_layers: ['api', 'frontend'],
    acceptance_criteria: [
      {
        id: 'AC-1',
        given: 'an admin submits the add product form with all required fields',
        when: 'the form is submitted',
        then: 'the product is created and appears in the catalogue immediately',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-2',
        given: 'an admin updates a product price',
        when: 'the update is saved',
        then: 'the new price appears in the catalogue and on the product detail page within 5 seconds',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-3',
        given: 'an admin attempts to delete a product that has pending orders',
        when: 'deletion is attempted',
        then: 'the deletion is blocked with: This product has pending orders and cannot be deleted. Archive it instead.',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-4',
        given: 'a non-admin user attempts to access admin product endpoints',
        when: 'the request is made',
        then: 'they receive a 403 Forbidden response regardless of authentication status',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-5',
        given: 'an admin uploads a product image larger than 5MB or not an image format',
        when: 'the upload is attempted',
        then: 'the upload is rejected with a clear error message before any server processing occurs',
        testable: true,
        test_layer: 'unit'
      }
    ],
    non_functional_requirements: {
      performance: 'Admin product list loads in under 1 second with up to 1000 products',
      security: 'Admin role verified server-side on every request. File upload validated for type and size before storage.',
      accessibility: 'Admin forms follow same accessibility standards as public forms'
    },
    definition_of_done: [
      'All AC have passing tests',
      'Authorisation bypass test: non-admin JWT rejected at every admin endpoint',
      'File upload validation: oversized and invalid type both rejected',
      'Pending order block test verified',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'Mutation score >= 85%'
    ],
    constitutions_to_apply: ['typescript', 'react', 'postgresql', 'security', 'testing'],
    api_endpoints: [
      'GET    /api/v1/admin/products',
      'POST   /api/v1/admin/products',
      'PUT    /api/v1/admin/products/:id',
      'DELETE /api/v1/admin/products/:id',
      'POST   /api/v1/admin/products/:id/images'
    ],
    estimated_complexity: 'L',
    ambiguity_flags: []
  },
  {
    story_id: 'STORY-010',
    title: 'Security: Add rate limiting to all authentication endpoints to prevent brute force attacks',
    type: 'bugfix',
    subtype: 'security',
    priority: 'P0',
    sprint: 1,
    affected_layers: ['api'],
    vulnerability_description: 'Authentication endpoints have no rate limiting. An attacker can make unlimited requests to brute force passwords or enumerate registered emails.',
    severity: 'HIGH',
    affected_component: 'services/api/src/routes/auth/',
    acceptance_criteria: [
      {
        id: 'AC-1',
        given: 'any IP makes more than 10 requests to POST /api/v1/auth/login within 15 minutes',
        when: 'the 11th request is made',
        then: 'the response is 429 Too Many Requests with a Retry-After header',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-2',
        given: 'rate limit counters are stored in Redis and Redis becomes unavailable',
        when: 'a request is made',
        then: 'requests are allowed through — rate limiting degrades gracefully',
        testable: true,
        test_layer: 'integration'
      },
      {
        id: 'AC-3',
        given: 'more than 5 registration attempts are made from one IP in 1 hour',
        when: 'the next attempt is made',
        then: 'it returns 429 with a Retry-After header',
        testable: true,
        test_layer: 'integration'
      }
    ],
    definition_of_done: [
      'Rate limiting test passes on all three auth endpoints',
      'Redis unavailability graceful degradation test passes',
      'Retry-After header present in all 429 responses',
      'Coverage on new code >= 90%',
      'Security scan: 0 HIGH/CRITICAL',
      'Mutation score >= 85%'
    ],
    constitutions_to_apply: ['typescript', 'security', 'testing'],
    agent_instructions: 'Write the test that demonstrates missing rate limiting FIRST. Confirm it fails. Then implement. Confirm it passes.',
    estimated_complexity: 'S',
    ambiguity_flags: []
  }
]
```

---

### TASK 2 — Create `src/samples/index.js`

```javascript
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
    const ids = app[`sprint_${options.sprint}`] || []
    return app.stories.filter(s => ids.includes(s.story_id))
  }
  return app.stories
}
```

---

### TASK 3 — Add `storyImport` and `storySample` to `src/commands/story.js`

Add these imports at the top if not already present:

```javascript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { listSampleApps, getSampleStories, SAMPLE_APPS } from '../samples/index.js'
```

Add `storyImport`:

```javascript
export async function storyImport(filePath, options = {}) {
  if (!filePath) {
    console.log(chalk.red('\n  ✗ File path required.'))
    console.log(chalk.dim('  Usage: yooti story:import --file stories.json\n'))
    process.exit(1)
  }
  if (!existsSync(filePath)) {
    console.log(chalk.red(`\n  ✗ File not found: ${filePath}\n`))
    process.exit(1)
  }
  let raw
  try { raw = readFileSync(filePath, 'utf8') }
  catch (err) {
    console.log(chalk.red(`\n  ✗ Could not read file: ${err.message}\n`))
    process.exit(1)
  }
  let stories
  try {
    const parsed = JSON.parse(raw)
    stories = Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    console.log(chalk.red('\n  ✗ File is not valid JSON.\n'))
    console.log(chalk.dim('  Validate it at: jsonlint.com\n'))
    process.exit(1)
  }
  if (stories.length === 0) {
    console.log(chalk.yellow('\n  ⚠ File contains no stories.\n'))
    process.exit(0)
  }
  const reqDir = '.agent/requirements'
  mkdirSync(reqDir, { recursive: true })
  console.log(chalk.cyan(`\n◆ Importing ${stories.length} story/stories\n`))
  let imported = 0, skipped = 0, errors = 0
  for (const story of stories) {
    if (!story.story_id) {
      console.log(chalk.yellow('  ⚠ Skipping story with missing story_id'))
      errors++
      continue
    }
    const outPath = `${reqDir}/${story.story_id}-validated.json`
    if (existsSync(outPath) && !options.overwrite) {
      console.log(chalk.dim(`  → ${story.story_id} already exists — skipping (use --overwrite to replace)`))
      skipped++
      continue
    }
    try {
      writeFileSync(outPath, JSON.stringify(story, null, 2))
      const title = story.title?.length > 60 ? story.title.slice(0, 60) + '...' : story.title || story.story_id
      console.log(`  ${chalk.green('✓')} ${story.story_id} — ${title}`)
      imported++
    } catch (err) {
      console.log(chalk.red(`  ✗ ${story.story_id} — failed to write: ${err.message}`))
      errors++
    }
  }
  console.log(`\n  ${chalk.green(imported + ' imported')}${skipped > 0 ? chalk.dim(', ' + skipped + ' skipped') : ''}${errors > 0 ? chalk.red(', ' + errors + ' errors') : ''}`)
  if (imported > 0) {
    console.log(chalk.dim(`\n  Files written to: ${reqDir}/`))
    console.log(chalk.dim('  Next step:       yooti sprint:start\n'))
  }
}
```

Add `storySample`:

```javascript
export async function storySample(options = {}) {
  if (options.list) {
    console.log(chalk.cyan('\n◆ Available sample apps\n'))
    listSampleApps().forEach(app => {
      console.log(`  ${chalk.white(app.key.padEnd(14))} ${app.name}`)
      console.log(chalk.dim(`                 ${app.description}`))
      console.log(chalk.dim(`                 ${app.story_count} stories · stack: ${app.stack.join(', ')}`))
      console.log('')
    })
    console.log(chalk.dim('  Import with: yooti story:sample --app ecommerce\n'))
    return
  }
  if (!options.app) {
    const apps = listSampleApps()
    const { appKey } = await inquirer.prompt([{
      type: 'list',
      name: 'appKey',
      message: 'Which sample app?',
      choices: apps.map(a => ({ name: `${a.name.padEnd(20)} — ${a.description}`, value: a.key }))
    }])
    options.app = appKey
  }
  const app = SAMPLE_APPS[options.app]
  if (!app) {
    console.log(chalk.red(`\n  ✗ Unknown sample app: ${options.app}`))
    console.log(chalk.dim('  Run: yooti story:sample --list to see available apps\n'))
    process.exit(1)
  }
  const stories = getSampleStories(options.app, {
    sprint: options.sprint ? parseInt(options.sprint) : null
  })
  const reqDir = '.agent/requirements'
  mkdirSync(reqDir, { recursive: true })
  const sprintLabel = options.sprint ? ` Sprint ${options.sprint}` : ''
  console.log(chalk.cyan(`\n◆ Importing ${stories.length} ${app.name}${sprintLabel} stories\n`))
  let imported = 0, skipped = 0
  for (const story of stories) {
    const outPath = `${reqDir}/${story.story_id}-validated.json`
    if (existsSync(outPath) && !options.overwrite) {
      console.log(chalk.dim(`  → ${story.story_id} already exists — skipping`))
      skipped++
      continue
    }
    writeFileSync(outPath, JSON.stringify(story, null, 2))
    const title = story.title?.length > 55 ? story.title.slice(0, 55) + '...' : story.title
    console.log(`  ${chalk.green('✓')} ${story.story_id} — ${title}`)
    imported++
  }
  console.log(`\n  ${chalk.green(imported + ' imported')}${skipped > 0 ? chalk.dim(', ' + skipped + ' skipped') : ''}`)
  if (imported > 0) {
    console.log(chalk.dim(`\n  Files written to: ${reqDir}/`))
    if (!options.sprint && app.sprint_1) console.log(chalk.dim('  Tip: import Sprint 1 only with --sprint 1'))
    console.log(chalk.dim('  Next step: yooti sprint:start\n'))
  }
}
```

---

### TASK 4 — Register both commands in `bin/yooti.js`

```javascript
program
  .command('story:import')
  .description('Import stories from a JSON file — skips the wizard')
  .requiredOption('--file <path>', 'path to JSON file (single story or array)')
  .option('--overwrite', 'overwrite existing stories with the same ID')
  .action(async (options) => {
    const { storyImport } = await import('../src/commands/story.js')
    await storyImport(options.file, options)
  })

program
  .command('story:sample')
  .description('Import built-in sample stories for a demo app')
  .option('--app <name>',   'sample app name (e.g. ecommerce)')
  .option('--sprint <n>',   'import a specific sprint only')
  .option('--list',         'list all available sample apps')
  .option('--overwrite',    'overwrite existing stories')
  .action(async (options) => {
    const { storySample } = await import('../src/commands/story.js')
    await storySample(options)
  })
```

---

### TASK 5 — Test

```bash
node bin/yooti.js story:sample --list
# Should show: ecommerce — Full ecommerce app

node bin/yooti.js init test-s1 --type web --context greenfield --stack node,react --no-git --stage 3
cd test-s1
node ../bin/yooti.js story:sample --app ecommerce
# 10 imported
ls .agent/requirements/
node ../bin/yooti.js story:sample --app ecommerce --sprint 1 --overwrite
# 6 imported (Sprint 1 only)
node ../bin/yooti.js story:import --file ../ecommerce-stories.json --overwrite
# 10 imported
cd .. && rm -rf test-s1
```

---

---

# SESSION 2 — task:add, plan:amend, plan:approve

## Prompt

Read `CLAUDE.md`, `REQUIREMENTS.md`, and `bin/yooti.js` before starting.
Add three role-based pipeline interaction commands.
Do not modify any existing commands.
All imports use `.js` extension.

---

### TASK 1 — Create `src/commands/task.js`

```javascript
// src/commands/task.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'

export async function taskAdd(storyId, cliOptions = {}) {
  if (!existsSync('proxiom.config.json')) {
    console.log(chalk.red('\n  ✗ Not inside a Yooti project. Run yooti init first.\n'))
    process.exit(1)
  }
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input', name: 'storyId',
      message: 'Story ID (e.g. STORY-001)',
      validate: v => /^STORY-\d{3,}$/.test(v) || 'Format: STORY-NNN'
    }])
    storyId = ans.storyId
  }
  const reqPath = `.agent/requirements/${storyId}-validated.json`
  if (!existsSync(reqPath)) {
    console.log(chalk.red(`\n  ✗ Story ${storyId} not found at ${reqPath}\n`))
    console.log(chalk.dim('  Run: yooti story:add to create a new story\n'))
    process.exit(1)
  }
  const plansDir = '.agent/plans'
  mkdirSync(plansDir, { recursive: true })
  const existing = readdirSync(plansDir).filter(f => f.startsWith(storyId) && f.endsWith('.plan.md'))
  const nextNum = String(existing.length + 1).padStart(3, '0')
  const taskId = `${storyId}-T${nextNum}`
  console.log(chalk.cyan(`\n◆ Adding task ${taskId}\n`))
  const answers = await inquirer.prompt([
    { type: 'input', name: 'title', message: 'Task title', validate: v => v.length >= 5 || 'Must be at least 5 characters' },
    { type: 'list', name: 'addedBy', message: 'Your role', choices: ['PM', 'Architect', 'Developer', 'QA', 'DevOps', 'Other'] },
    { type: 'input', name: 'acCovered', message: 'Acceptance criteria covered (e.g. AC-1, AC-3)', default: 'see story' },
    { type: 'input', name: 'filesToCreate', message: 'Files to CREATE (comma-separated, blank if none)', default: '' },
    { type: 'input', name: 'filesToModify', message: 'Files to MODIFY (comma-separated, blank if none)', default: '' },
    { type: 'input', name: 'outOfScope', message: 'Directories OUT OF SCOPE (comma-separated, blank if none)', default: '' },
    { type: 'input', name: 'steps', message: 'Implementation steps (comma-separated)', validate: v => v.trim().length > 0 || 'At least one step required' },
    { type: 'input', name: 'dependsOn', message: 'Depends on (e.g. T001 — blank if none)', default: '' },
    { type: 'input', name: 'blocks', message: 'Blocks which tasks? (blank if none)', default: '' },
    { type: 'input', name: 'note', message: 'Notes for the agent (blank if none)', default: '' }
  ])
  const now = new Date().toISOString().split('T')[0]
  const fmt = (csv, prefix = '-') => csv.trim() ? csv.split(',').map(s => `${prefix} ${s.trim()}`).join('\n') : `${prefix} (none)`
  const stepLines = answers.steps.split(',').map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')
  const planContent = `# ${taskId} — ${answers.title}

## Status
PENDING

## Added by
${answers.addedBy} on ${now}

## Scope

CREATE:
${fmt(answers.filesToCreate)}

MODIFY:
${fmt(answers.filesToModify)}

OUT OF SCOPE (do not touch):
${fmt(answers.outOfScope)}

## Acceptance criteria covered
${fmt(answers.acCovered)}

## Implementation steps
${stepLines}

## Dependencies
Depends on: ${answers.dependsOn || 'none'}
Blocks: ${answers.blocks || 'none'}

## Role annotations
${answers.note ? `[${answers.addedBy.toUpperCase()} ${now}]: ${answers.note}` : `<!-- Add annotations with: yooti plan:amend ${taskId} -->`}
`
  const planPath = `${plansDir}/${taskId}.plan.md`
  writeFileSync(planPath, planContent)
  console.log(`\n  ${chalk.green('✓')} Task created: ${planPath}`)
  console.log(chalk.dim(`  Architect reviews: yooti plan:amend ${taskId}`))
  console.log(chalk.dim(`  Sign off G2:       yooti plan:approve ${storyId}\n`))
}

export async function taskList(storyId) {
  const plansDir = '.agent/plans'
  if (!existsSync(plansDir)) {
    console.log(chalk.dim('\n  No plans directory found.\n'))
    return
  }
  const plans = readdirSync(plansDir)
    .filter(f => f.endsWith('.plan.md'))
    .filter(f => !storyId || f.startsWith(storyId))
    .sort()
  if (plans.length === 0) {
    console.log(chalk.dim(`\n  No tasks found${storyId ? ` for ${storyId}` : ''}.\n`))
    return
  }
  const statusIcon = {
    PENDING:     chalk.yellow('○'),
    IN_PROGRESS: chalk.cyan('◉'),
    COMPLETE:    chalk.green('✓'),
    BLOCKED:     chalk.red('✗'),
    REJECTED:    chalk.red('✗'),
  }
  console.log(chalk.cyan(`\n◆ Tasks${storyId ? ` — ${storyId}` : ' — all stories'}\n`))
  plans.forEach(f => {
    const content = readFileSync(`${plansDir}/${f}`, 'utf8')
    const status = (content.match(/## Status\n(\w+)/) || [])[1] || 'UNKNOWN'
    const title  = (content.match(/^# (.+)/m) || [])[1] || f.replace('.plan.md', '')
    const deps   = (content.match(/Depends on: (.+)/) || [])[1] || 'none'
    const icon   = statusIcon[status] || chalk.white('?')
    console.log(`  ${icon} ${chalk.white(title)}`)
    if (deps !== 'none') console.log(chalk.dim(`      depends on: ${deps}`))
  })
  console.log('')
}
```

---

### TASK 2 — Create `src/commands/plan.js`

```javascript
// src/commands/plan.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

export async function planAmend(taskId) {
  const planPath = `.agent/plans/${taskId}.plan.md`
  if (!existsSync(planPath)) {
    console.log(chalk.red(`\n  ✗ Plan not found: ${planPath}`))
    console.log(chalk.dim('  Run: yooti task:list to see available tasks\n'))
    process.exit(1)
  }
  let content = readFileSync(planPath, 'utf8')
  console.log(chalk.cyan(`\n◆ Amending plan: ${taskId}\n`))
  const currentStatus = (content.match(/## Status\n(\w+)/) || [])[1] || 'UNKNOWN'
  console.log(chalk.dim(`  Current status: ${currentStatus}\n`))
  const { amendType } = await inquirer.prompt([{
    type: 'list', name: 'amendType',
    message: 'What do you want to change?',
    choices: [
      { name: '+ Add file to CREATE scope',         value: 'add-create' },
      { name: '+ Add file to MODIFY scope',         value: 'add-modify' },
      { name: '+ Add directory to OUT OF SCOPE',    value: 'add-oos' },
      { name: '+ Add implementation step',          value: 'add-step' },
      { name: '+ Add role annotation / constraint', value: 'annotate' },
      { name: '↔ Change task status',              value: 'status' },
      { name: '↔ Change depends-on',              value: 'depends' },
    ]
  }])
  const now = new Date().toISOString().split('T')[0]
  if (amendType === 'add-create') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'File path to add to CREATE' }])
    content = content.replace(/^CREATE:\n/m, `CREATE:\n- ${value}\n`)
  } else if (amendType === 'add-modify') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'File path to add to MODIFY' }])
    content = content.replace(/^MODIFY:\n/m, `MODIFY:\n- ${value}\n`)
  } else if (amendType === 'add-oos') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'Directory to add to OUT OF SCOPE' }])
    content = content.replace(/^OUT OF SCOPE \(do not touch\):\n/m, `OUT OF SCOPE (do not touch):\n- ${value}\n`)
  } else if (amendType === 'add-step') {
    const { value } = await inquirer.prompt([{ type: 'input', name: 'value', message: 'Implementation step to add' }])
    const stepCount = (content.match(/^\d+\./gm) || []).length
    content = content.replace(/^## Dependencies/m, `${stepCount + 1}. ${value}\n\n## Dependencies`)
  } else if (amendType === 'annotate') {
    const { role, note } = await inquirer.prompt([
      { type: 'list', name: 'role', message: 'Your role', choices: ['ARCHITECT', 'DEVELOPER', 'QA', 'PM', 'DEVOPS'] },
      { type: 'input', name: 'note', message: 'Annotation / constraint', validate: v => v.length > 0 }
    ])
    const annotation = `[${role} G2 ${now}]: ${note}`
    if (content.includes('<!-- Add annotations')) {
      content = content.replace(/<!-- Add annotations.*-->/, annotation)
    } else {
      content += `\n${annotation}`
    }
  } else if (amendType === 'status') {
    const { status } = await inquirer.prompt([{
      type: 'list', name: 'status', message: 'New status',
      choices: ['PENDING', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED', 'REJECTED']
    }])
    content = content.replace(/^(## Status\n)\w+/m, `$1${status}`)
  } else if (amendType === 'depends') {
    const { depends } = await inquirer.prompt([{ type: 'input', name: 'depends', message: 'Depends on (e.g. T001, or "none")' }])
    content = content.replace(/^Depends on: .+/m, `Depends on: ${depends}`)
  }
  writeFileSync(planPath, content)
  console.log(`\n  ${chalk.green('✓')} Plan updated: ${planPath}\n`)
}

export async function planApprove(storyId) {
  const gatesDir = '.agent/gates'
  mkdirSync(gatesDir, { recursive: true })
  console.log(chalk.cyan(`\n◆ Gate G2 — Architecture Review: ${storyId}\n`))
  const answers = await inquirer.prompt([
    { type: 'input', name: 'name', message: 'Your name', validate: v => v.length > 0 },
    {
      type: 'list', name: 'decision', message: 'Decision',
      choices: [
        { name: 'Approve — plans are structurally sound, proceed to code generation', value: 'approved' },
        { name: 'Reject — plans need revision before code generation', value: 'rejected' }
      ]
    },
    { type: 'input', name: 'notes', message: 'Notes', default: 'Plans reviewed and approved.' }
  ])
  const now = new Date().toISOString()
  const filename = `${storyId}-G2-${answers.decision}.md`
  const content = `# Gate G2 — Architecture Review\nStory: ${storyId}\nDecision: ${answers.decision.toUpperCase()}\nReviewed by: ${answers.name}\nDate: ${now}\nNotes: ${answers.notes}\n`
  writeFileSync(`${gatesDir}/${filename}`, content)
  if (answers.decision === 'approved') {
    console.log(`\n  ${chalk.green('✓')} Gate G2 signed: .agent/gates/${filename}`)
    console.log(chalk.dim('  The agent will proceed to code generation for this story.\n'))
  } else {
    console.log(`\n  ${chalk.yellow('⚠')} Gate G2 rejected: .agent/gates/${filename}`)
    console.log(chalk.dim('  Update the plan files then run this command again.\n'))
  }
}
```

---

### TASK 3 — Register in `bin/yooti.js`

```javascript
program
  .command('task:add [story-id]')
  .description('Add a task to an existing story (PM, Architect, Developer)')
  .action(async (storyId) => {
    const { taskAdd } = await import('../src/commands/task.js')
    await taskAdd(storyId)
  })

program
  .command('task:list [story-id]')
  .description('List tasks and their status')
  .action(async (storyId) => {
    const { taskList } = await import('../src/commands/task.js')
    await taskList(storyId)
  })

program
  .command('plan:amend <task-id>')
  .description('Amend a plan file (Architect, Developer)')
  .action(async (taskId) => {
    const { planAmend } = await import('../src/commands/plan.js')
    await planAmend(taskId)
  })

program
  .command('plan:approve <story-id>')
  .description('Sign off Gate G2 — architecture review complete (Architect)')
  .action(async (storyId) => {
    const { planApprove } = await import('../src/commands/plan.js')
    await planApprove(storyId)
  })
```

---

### TASK 4 — Test

```bash
node bin/yooti.js init test-s2 --type web --context greenfield --stack node,react --no-git --stage 3
cd test-s2
node ../bin/yooti.js story:add
node ../bin/yooti.js task:add STORY-001
node ../bin/yooti.js task:list STORY-001
node ../bin/yooti.js plan:amend STORY-001-T001
node ../bin/yooti.js plan:approve STORY-001
ls .agent/gates/
cd .. && rm -rf test-s2
```

---

---

# SESSION 3 — context:add, correct:inject, test:require

## Prompt

Read `bin/yooti.js` before starting.
Add three commands for attaching context and injecting corrections.
Do not modify any existing commands. All imports use `.js` extension.

---

### TASK 1 — Create `src/commands/context.js`

```javascript
// src/commands/context.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'

const CONTEXT_TYPES = {
  url:        'URL — API docs, Figma link, Confluence page',
  file:       'File — attach local spec, PDF, or markdown',
  note:       'Note — freeform text for the agent',
  jira:       'Jira/Linear — paste ticket content',
  constraint: 'Constraint — architectural rule agent must follow',
  figma:      'Figma — paste component spec or design notes',
  api:        'API contract — paste OpenAPI spec or endpoint definition',
}

const agentInstructions = {
  url:        'Fetch the content at the URL above before generating code.\nUse it as reference for API signatures, data formats, and integration patterns.',
  file:       'Read the file at the path above before generating code.',
  note:       'Read this note before generating code. Apply it as additional guidance.',
  jira:       'This is a ticket from the issue tracker. Use the AC and description to supplement the story.',
  constraint: 'This is a hard architectural constraint. Do NOT violate it. If implementing would require violating it, write an escalation file and stop.',
  figma:      'Match the component names, props, layout, and behaviour described here exactly.',
  api:        'Use the exact endpoint paths, request/response schemas, and status codes defined here.',
}

export async function contextAdd(storyId, cliOptions = {}) {
  if (!existsSync('proxiom.config.json')) {
    console.log(chalk.red('\n  ✗ Not inside a Yooti project.\n'))
    process.exit(1)
  }
  const contextDir = `.agent/context/${storyId}`
  mkdirSync(contextDir, { recursive: true })
  console.log(chalk.cyan(`\n◆ Adding context to ${storyId}\n`))
  let type = cliOptions.url ? 'url' : cliOptions.file ? 'file' : cliOptions.note ? 'note' : null
  if (!type) {
    const ans = await inquirer.prompt([{
      type: 'list', name: 'type',
      message: 'What type of context?',
      choices: Object.entries(CONTEXT_TYPES).map(([k, v]) => ({ name: v, value: k }))
    }])
    type = ans.type
  }
  const prompts = []
  if (type === 'url' && !cliOptions.url)
    prompts.push({ type: 'input', name: 'url', message: 'URL', validate: v => v.startsWith('http') || 'Must be a valid URL' })
  if (type === 'file' && !cliOptions.file)
    prompts.push({ type: 'input', name: 'filePath', message: 'File path (relative or absolute)' })
  if (['note', 'jira', 'constraint', 'figma', 'api'].includes(type) && !cliOptions.note)
    prompts.push({ type: 'editor', name: 'content', message: 'Paste or write your context (opens editor)' })
  prompts.push(
    { type: 'list', name: 'addedBy', message: 'Your role', choices: ['PM', 'Architect', 'Developer', 'QA', 'DevOps', 'UX Designer'] },
    { type: 'input', name: 'summary', message: 'One-line summary (shown in context:list)', validate: v => v.length > 0 }
  )
  const answers = await inquirer.prompt(prompts)
  const now = new Date().toISOString()
  const filename = `${contextDir}/${Date.now()}-${type}.md`
  const url      = cliOptions.url   || answers.url
  const filePath = cliOptions.file  || answers.filePath
  const content  = cliOptions.note  || answers.content || ''
  let fileContent = `# Context for ${storyId} — ${answers.summary}\nType: ${type}\nAdded by: ${answers.addedBy}\nDate: ${now}\nSummary: ${answers.summary}\n\n---\n\n`
  if (type === 'url')       fileContent += `## Source URL\n${url}\n\n`
  else if (type === 'file') fileContent += `## Source file\n${resolve(filePath)}\n\n`
  else                      fileContent += `## Content\n${content}\n\n`
  fileContent += `## Instructions for agent\n${agentInstructions[type]}\n`
  writeFileSync(filename, fileContent)
  console.log(`\n  ${chalk.green('✓')} Context attached: ${filename}`)
  console.log(chalk.dim(`  View: yooti context:list ${storyId}\n`))
}

export async function contextList(storyId) {
  const contextDir = `.agent/context/${storyId}`
  if (!existsSync(contextDir)) {
    console.log(chalk.dim(`\n  No context attached to ${storyId} yet.\n`))
    return
  }
  const files = readdirSync(contextDir).filter(f => f.endsWith('.md')).sort()
  if (files.length === 0) {
    console.log(chalk.dim(`\n  No context attached to ${storyId} yet.\n`))
    return
  }
  console.log(chalk.cyan(`\n◆ Context attached to ${storyId}\n`))
  files.forEach(f => {
    const c = readFileSync(`${contextDir}/${f}`, 'utf8')
    const type    = (c.match(/^Type: (.+)/m)     || [])[1] || 'note'
    const summary = (c.match(/^Summary: (.+)/m)  || [])[1] || f
    const by      = (c.match(/^Added by: (.+)/m) || [])[1] || '?'
    const date    = (c.match(/^Date: (.+)/m)     || [])[1]?.split('T')[0] || ''
    const color   = type === 'constraint' ? chalk.red : type === 'url' ? chalk.cyan : chalk.white
    console.log(`  ${color(type.padEnd(12))} ${summary} ${chalk.dim(`(${by}, ${date})`)}`)
  })
  console.log('')
}
```

---

### TASK 2 — Create `src/commands/correct.js`

```javascript
// src/commands/correct.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { writeFileSync, mkdirSync } from 'fs'

export async function correctInject(taskId) {
  if (!taskId) {
    console.log(chalk.red('\n  ✗ Task ID required. Example: yooti correct:inject STORY-001-T001\n'))
    process.exit(1)
  }
  const correctionsDir = '.agent/corrections'
  mkdirSync(correctionsDir, { recursive: true })
  console.log(chalk.cyan(`\n◆ Injecting correction for ${taskId}\n`))
  const answers = await inquirer.prompt([
    {
      type: 'list', name: 'failureType', message: 'What type of issue?',
      choices: [
        { name: 'Logic error     — code does the wrong thing',               value: 'LOGIC_ERROR' },
        { name: 'Type error      — wrong type, interface, or signature',      value: 'TYPE_ERROR' },
        { name: 'Import error    — wrong module or missing dependency',       value: 'IMPORT_ERROR' },
        { name: 'Scope error     — agent touched a file it should not have',  value: 'SCOPE_ERROR' },
        { name: 'Pattern error   — wrong pattern for this codebase',          value: 'PATTERN_ERROR' },
        { name: 'Security issue  — missing auth check or vulnerability',      value: 'SECURITY_ERROR' },
        { name: 'Test error      — tests not testing what they claim',        value: 'TEST_ERROR' },
        { name: 'Performance     — N+1 query, missing index, sync blocking',  value: 'PERF_ERROR' },
        { name: 'Other',                                                       value: 'OTHER' },
      ]
    },
    { type: 'input',  name: 'file',        message: 'Affected file (blank if general)', default: '' },
    { type: 'input',  name: 'line',        message: 'Affected line number (blank if unknown)', default: '' },
    { type: 'list',   name: 'by',          message: 'Your role', choices: ['Developer', 'Architect', 'QA', 'PM', 'DevOps'] },
    { type: 'editor', name: 'description', message: 'Describe the issue and correct behaviour (opens editor)' },
    { type: 'confirm', name: 'isBlocker',  message: 'Is this a blocker?', default: true }
  ])
  const now = new Date().toISOString()
  const filename = `${correctionsDir}/${taskId}-${Date.now()}.md`
  const content = `# Correction: ${taskId}
Type: ${answers.failureType}
File: ${answers.file || 'general'}
Line: ${answers.line || 'n/a'}
Is blocker: ${answers.isBlocker ? 'YES' : 'NO'}
Corrected by: ${answers.by}
Date: ${now}

## Issue and required fix
${answers.description}

## Instructions for agent
Read this correction before your next iteration.
Fix the specific issue described above.
Do not change anything outside the scope of this correction.
${answers.isBlocker ? '\nThis is marked as a BLOCKER. Do not continue until this is resolved.' : ''}
`
  writeFileSync(filename, content)
  console.log(`\n  ${chalk.green('✓')} Correction written: ${filename}`)
  console.log(chalk.dim(`  The agent will read this before its next iteration.\n`))
}
```

---

### TASK 3 — Create `src/commands/testrequire.js`

```javascript
// src/commands/testrequire.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { writeFileSync, mkdirSync } from 'fs'

export async function testRequire(storyId) {
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input', name: 'storyId', message: 'Story ID (e.g. STORY-001)',
      validate: v => /^STORY-\d+$/.test(v) || 'Format: STORY-NNN'
    }])
    storyId = ans.storyId
  }
  const reqDir = '.agent/test-requirements'
  mkdirSync(reqDir, { recursive: true })
  console.log(chalk.cyan(`\n◆ Adding test requirement to ${storyId}\n`))
  const answers = await inquirer.prompt([
    {
      type: 'list', name: 'layer', message: 'Which test layer?',
      choices: [
        { name: 'Unit test      — test a single function in isolation', value: 'unit' },
        { name: 'Integration    — test against real services',          value: 'integration' },
        { name: 'Accessibility  — WCAG / ARIA requirement',             value: 'a11y' },
        { name: 'Performance    — load time, query time, response time', value: 'performance' },
        { name: 'Security       — auth, injection, exposure check',     value: 'security' },
        { name: 'Eval           — agent output quality (nightly)',      value: 'eval' },
      ]
    },
    { type: 'input', name: 'acId', message: 'Which AC does this test cover? (e.g. AC-2)', default: '' },
    { type: 'input', name: 'scenario', message: 'Test scenario — Given/When/Then or plain English', validate: v => v.length > 10 || 'Be specific' },
    { type: 'input', name: 'file', message: 'Which file should the test go in? (blank = agent decides)', default: '' },
    { type: 'list', name: 'priority', message: 'Priority',
      choices: ['P0 — must pass before PR', 'P1 — must pass before G4', 'P2 — nice to have'], default: 0 },
    { type: 'list', name: 'addedBy', message: 'Your role', choices: ['QA / SDET', 'Developer', 'Architect', 'PM'] }
  ])
  const now = new Date().toISOString()
  const filename = `${reqDir}/${storyId}-${Date.now()}-${answers.layer}.md`
  const layerInstructions = {
    unit:        'Do not use real LLM calls or external services — mock everything.',
    integration: 'Use real services. Full setup and teardown. No shared state between tests.',
    a11y:        'Use axe-core. Assert 0 violations. Test with assistive technology attributes.',
    security:    'Test both the attack vector and the mitigation.',
    eval:        'Mark with @pytest.mark.eval. Use real LLM. Assert semantic correctness.',
    performance: 'Assert response time threshold. Use timing assertions.',
  }
  const content = `# Test requirement: ${storyId}
Layer: ${answers.layer}
AC covered: ${answers.acId || 'general'}
Priority: ${answers.priority}
Added by: ${answers.addedBy}
Date: ${now}

## Test scenario
${answers.scenario}

## Target file
${answers.file || '(agent decides based on layer and scenario)'}

## Instructions for agent
Write a ${answers.layer} test that covers the scenario above.
${layerInstructions[answers.layer] || ''}
This test must exist and must pass before the story can proceed past Gate G4.
`
  writeFileSync(filename, content)
  console.log(`\n  ${chalk.green('✓')} Test requirement written: ${filename}`)
  console.log(chalk.dim(`  The agent reads .agent/test-requirements/ before writing tests.\n`))
}
```

---

### TASK 4 — Register in `bin/yooti.js`

```javascript
program
  .command('context:add <story-id>')
  .description('Attach external context to a story (all roles)')
  .option('--url <url>',   'attach a URL')
  .option('--file <path>', 'attach a local file')
  .option('--note <text>', 'attach a freeform note')
  .action(async (storyId, options) => {
    const { contextAdd } = await import('../src/commands/context.js')
    await contextAdd(storyId, options)
  })

program
  .command('context:list <story-id>')
  .description('List all context attached to a story')
  .action(async (storyId) => {
    const { contextList } = await import('../src/commands/context.js')
    await contextList(storyId)
  })

program
  .command('correct:inject <task-id>')
  .description('Inject a correction for the agent mid-generation (Developer, QA)')
  .action(async (taskId) => {
    const { correctInject } = await import('../src/commands/correct.js')
    await correctInject(taskId)
  })

program
  .command('test:require [story-id]')
  .description('Add a test requirement the agent must cover (QA, Developer)')
  .action(async (storyId) => {
    const { testRequire } = await import('../src/commands/testrequire.js')
    await testRequire(storyId)
  })
```

---

### TASK 5 — Test

```bash
node bin/yooti.js init test-s3 --type web --context greenfield --stack node,react --no-git --stage 3
cd test-s3
node ../bin/yooti.js story:add
node ../bin/yooti.js context:add STORY-001 --note "Use existing AuthService pattern"
node ../bin/yooti.js context:list STORY-001
node ../bin/yooti.js task:add STORY-001
node ../bin/yooti.js correct:inject STORY-001-T001
node ../bin/yooti.js test:require STORY-001
ls .agent/context/STORY-001/
ls .agent/corrections/
ls .agent/test-requirements/
cd .. && rm -rf test-s3
```

---

---

# SESSION 4 — qa:plan and qa:review

## Prompt

Read `bin/yooti.js` before starting.
Add the `qa:plan` and `qa:review` commands.
Do not modify any existing commands. All imports use `.js` extension.

---

### TASK 1 — Create `src/commands/qa.js`

```javascript
// src/commands/qa.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'

export async function qaPlan(storyId) {
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input', name: 'storyId', message: 'Story ID (e.g. STORY-001)',
      validate: v => /^STORY-\d+$/.test(v) || 'Format: STORY-NNN'
    }])
    storyId = ans.storyId
  }
  const reqPath = `.agent/requirements/${storyId}-validated.json`
  if (!existsSync(reqPath)) {
    console.log(chalk.red(`\n  ✗ Story ${storyId} not found.\n`))
    process.exit(1)
  }
  const story = JSON.parse(readFileSync(reqPath, 'utf8'))
  const qaDir = '.agent/qa'
  mkdirSync(qaDir, { recursive: true })
  console.log(chalk.cyan(`\n◆ Creating QA test plan for ${storyId}\n`))
  const answers = await inquirer.prompt([
    { type: 'input', name: 'qaName', message: 'Your name', validate: v => v.length > 0 },
    { type: 'input', name: 'filesChanged', message: 'Files this story touches (comma-separated)', default: '' },
    {
      type: 'checkbox', name: 'testLayers', message: 'Which test layers does this story require?',
      choices: [
        { name: 'Unit tests',                   value: 'unit',        checked: true },
        { name: 'Integration tests',             value: 'integration', checked: true },
        { name: 'Accessibility tests (frontend)',value: 'a11y',        checked: false },
        { name: 'Performance tests',             value: 'performance', checked: false },
        { name: 'Security tests',               value: 'security',    checked: true },
        { name: 'Regression tests',             value: 'regression',  checked: true },
        { name: 'Eval tests (agent stories)',    value: 'evals',       checked: false },
      ]
    },
    { type: 'input', name: 'regressionScope', message: 'Existing test files at risk of regression (comma-separated)', default: '' },
    { type: 'input', name: 'testData', message: 'Test data requirements (blank if none)', default: '' },
  ])
  const now = new Date().toISOString().split('T')[0]
  const files = answers.filesChanged
    ? answers.filesChanged.split(',').map(f => `- ${f.trim()}`).join('\n')
    : '- (list files this story touches)'
  const regressionRows = answers.regressionScope
    ? answers.regressionScope.split(',').map(f => `| ${f.trim()} | (why at risk) |`).join('\n')
    : '| (file) | (why at risk) |'
  const acTable = story.acceptance_criteria
    ? story.acceptance_criteria.map(ac => `| ${ac.id} | ${ac.then || ac.id} | API + DB |`).join('\n')
    : '| AC-1 | (describe test) | (services) |'
  const content = `# QA Test Plan — ${storyId}
Created by: ${answers.qaName}
Date: ${now}
Status: DRAFT

## Story summary
${story.title || storyId}

## Test scope — files this story touches
${files}

## Test layers required
${answers.testLayers.map(l => `- [x] ${l}`).join('\n')}

---

## Unit test scenarios
| Scenario | Input | Expected output | Priority |
|----------|-------|-----------------|----------|
| (happy path) | | | P0 |
| (boundary condition) | | | P0 |
| (error path) | | | P0 |

## Integration test scenarios (AC coverage)
| AC | Test description | Services involved |
|----|-----------------|------------------|
${acTable}

## Security tests
| Vulnerability | Test approach | Priority |
|---------------|--------------|----------|
| (injection) | (parameterised query test) | P0 |
| (auth bypass) | (unauthenticated request test) | P0 |

## Regression scope
| Test file | Why at risk |
|-----------|-------------|
${regressionRows}

## Test data requirements
${answers.testData || '- No special test data required'}

---

## Definition of done for QA
- [ ] All P0 unit scenarios implemented and passing
- [ ] All AC have at least one integration test
- [ ] Security tests passing
- [ ] No regression in files listed above
- [ ] Coverage on new code >= 90%
- [ ] Mutation score >= 85%
- [ ] Evidence package complete in .agent/evidence/${storyId}/
`
  const planPath = `${qaDir}/${storyId}-test-plan.md`
  writeFileSync(planPath, content)
  console.log(`\n  ${chalk.green('✓')} QA test plan created: ${planPath}`)
  console.log(chalk.dim(`  Fill in test scenarios before Phase 4 starts`))
  console.log(chalk.dim(`  Add test requirements: yooti test:require ${storyId}`))
  console.log(chalk.dim(`  Review evidence at G4:  yooti qa:review ${storyId}\n`))
}

export async function qaReview(storyId) {
  const evidenceDir = `.agent/evidence/${storyId}`
  if (!existsSync(evidenceDir)) {
    console.log(chalk.red(`\n  ✗ No evidence package found for ${storyId}`))
    console.log(chalk.dim(`  Expected: ${evidenceDir}/`))
    console.log(chalk.dim('  Evidence is generated after Phase 5 completes.\n'))
    process.exit(1)
  }
  console.log(chalk.cyan(`\n◆ Gate G4 Review — ${storyId}\n`))
  const read = (file) => {
    const path = `${evidenceDir}/${file}`
    try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null }
  }
  const testResults = read('test-results.json')
  const coverage    = read('coverage-summary.json')
  const regression  = read('regression-diff.json')
  const mutation    = read('mutation-score.json')
  const security    = read('security-scan.json')
  const a11y        = read('accessibility.json')
  const results = []
  const hardGate = (name, pass, detail = '') => results.push({ name, pass, hard: true, detail })
  const softGate = (name, pass, detail = '') => results.push({ name, pass, hard: false, detail })
  if (testResults) {
    hardGate('Unit tests 100% pass', testResults.unit?.failed === 0,
      testResults.unit ? `${testResults.unit.passed}/${testResults.unit.total}` : 'missing')
    hardGate('Integration tests 100% pass', testResults.integration?.failed === 0,
      testResults.integration ? `${testResults.integration.passed}/${testResults.integration.total}` : 'missing')
  } else {
    hardGate('Test results file exists', false, 'test-results.json not found')
  }
  if (regression) {
    hardGate('Zero regressions', regression.newly_failing?.length === 0,
      regression.newly_failing?.length > 0 ? `${regression.newly_failing.length} newly failing` : 'none')
  } else {
    hardGate('Regression diff exists', false, 'regression-diff.json not found')
  }
  if (coverage) {
    hardGate('Overall coverage >= 80%',  coverage.overall  >= 80, `${coverage.overall?.toFixed(1)}%`)
    hardGate('New code coverage >= 90%', coverage.new_code >= 90, `${coverage.new_code?.toFixed(1)}%`)
  } else {
    hardGate('Coverage report exists', false, 'coverage-summary.json not found')
  }
  if (security) {
    hardGate('Zero CRITICAL findings', security.snyk?.critical === 0, `Snyk: ${security.snyk?.critical} critical`)
    hardGate('Zero HIGH findings',     security.snyk?.high     === 0, `Snyk: ${security.snyk?.high} high`)
    hardGate('Zero Semgrep findings',  security.semgrep?.findings === 0, `Semgrep: ${security.semgrep?.findings}`)
  } else {
    hardGate('Security scan exists', false, 'security-scan.json not found')
  }
  if (a11y) hardGate('Zero a11y violations', a11y.violations === 0, `${a11y.violations} violations`)
  if (mutation) softGate('Mutation score >= 85%', mutation.score >= 85, `${mutation.score?.toFixed(1)}%`)
  const hardFails = results.filter(r => r.hard && !r.pass)
  console.log('  Hard gates:\n')
  results.filter(r => r.hard).forEach(r => {
    const icon = r.pass ? chalk.green('✓') : chalk.red('✗')
    console.log(`  ${icon} ${r.name.padEnd(40)} ${chalk.dim(r.detail)}`)
  })
  console.log('\n  Soft gates:\n')
  results.filter(r => !r.hard).forEach(r => {
    const icon = r.pass ? chalk.green('✓') : chalk.yellow('⚠')
    console.log(`  ${icon} ${r.name.padEnd(40)} ${chalk.dim(r.detail)}`)
  })
  console.log('')
  if (hardFails.length > 0) {
    console.log(chalk.red(`  ✗ ${hardFails.length} hard gate(s) failed — cannot approve\n`))
    return
  }
  const { decision, reviewer, notes } = await inquirer.prompt([
    { type: 'list', name: 'decision', message: 'Your decision:',
      choices: [
        { name: 'Approve — quality evidence is sufficient', value: 'approved' },
        { name: 'Reject — specify what must be fixed',      value: 'rejected' }
      ]
    },
    { type: 'input', name: 'reviewer', message: 'Your name', validate: v => v.length > 0 },
    { type: 'input', name: 'notes', message: 'Notes', default: 'All gates reviewed. Approved.' }
  ])
  const gatesDir = '.agent/gates'
  mkdirSync(gatesDir, { recursive: true })
  const filename = `${storyId}-G4-${decision}.md`
  writeFileSync(`${gatesDir}/${filename}`,
    `# Gate G4 — QA Sign-off\nStory: ${storyId}\nDecision: ${decision.toUpperCase()}\nReviewer: ${reviewer}\nDate: ${new Date().toISOString()}\nNotes: ${notes}\n`)
  const icon = decision === 'approved' ? chalk.green('✓') : chalk.yellow('⚠')
  console.log(`\n  ${icon} Gate G4 ${decision}: .agent/gates/${filename}\n`)
}
```

---

### TASK 2 — Register in `bin/yooti.js`

```javascript
program
  .command('qa:plan [story-id]')
  .description('Create a QA test plan for a story (QA / SDET)')
  .action(async (storyId) => {
    const { qaPlan } = await import('../src/commands/qa.js')
    await qaPlan(storyId)
  })

program
  .command('qa:review [story-id]')
  .description('Run Gate G4 QA review against evidence package')
  .action(async (storyId) => {
    const { qaReview } = await import('../src/commands/qa.js')
    await qaReview(storyId)
  })
```

---

### TASK 3 — Test

```bash
node bin/yooti.js init test-s4 --type web --context greenfield --stack node,react --no-git --stage 3
cd test-s4
node ../bin/yooti.js story:add
node ../bin/yooti.js qa:plan STORY-001
cat .agent/qa/STORY-001-test-plan.md

mkdir -p .agent/evidence/STORY-001
echo '{"unit":{"total":10,"passed":10,"failed":0},"integration":{"total":5,"passed":5,"failed":0}}' > .agent/evidence/STORY-001/test-results.json
echo '{"overall":91.2,"new_code":94.1}' > .agent/evidence/STORY-001/coverage-summary.json
echo '{"newly_failing":[],"total_tests_before":0,"total_tests_after":15}' > .agent/evidence/STORY-001/regression-diff.json
echo '{"score":89.2,"survived":4,"total_mutants":37}' > .agent/evidence/STORY-001/mutation-score.json
echo '{"snyk":{"critical":0,"high":0,"medium":1},"semgrep":{"findings":0}}' > .agent/evidence/STORY-001/security-scan.json

node ../bin/yooti.js qa:review STORY-001
ls .agent/gates/
cd .. && rm -rf test-s4
```

---

---

# SESSION 5 — audit, log:event, sprint:report

## Prompt

Read `bin/yooti.js` before starting.
Add the complete audit system: event logger, renderer, audit commands.
Do not modify any existing commands. All imports use `.js` extension.

---

### TASK 1 — Create `src/audit/logger.js`

```javascript
// src/audit/logger.js
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'

const LOGS_DIR = '.agent/logs'

export function getLogPath(storyId) {
  return `${LOGS_DIR}/${storyId}.log.json`
}

export function initLog(storyId, title) {
  mkdirSync(LOGS_DIR, { recursive: true })
  const logPath = getLogPath(storyId)
  if (existsSync(logPath)) return
  writeFileSync(logPath, JSON.stringify({
    story_id: storyId,
    title: title || storyId,
    started_at: new Date().toISOString(),
    events: []
  }, null, 2))
}

export function appendEvent(storyId, event) {
  mkdirSync(LOGS_DIR, { recursive: true })
  const logPath = getLogPath(storyId)
  let log = existsSync(logPath)
    ? JSON.parse(readFileSync(logPath, 'utf8'))
    : { story_id: storyId, title: storyId, started_at: new Date().toISOString(), events: [] }
  log.events.push({ at: new Date().toISOString(), ...event })
  writeFileSync(logPath, JSON.stringify(log, null, 2))
}

export function readLog(storyId) {
  const logPath = getLogPath(storyId)
  if (!existsSync(logPath)) return null
  return JSON.parse(readFileSync(logPath, 'utf8'))
}

export function listLogs() {
  mkdirSync(LOGS_DIR, { recursive: true })
  return readdirSync(LOGS_DIR)
    .filter(f => f.endsWith('.log.json'))
    .map(f => f.replace('.log.json', ''))
}

export const logPhaseStart    = (sid, phase, detail) =>        appendEvent(sid, { phase, type: 'PHASE_START', detail })
export const logAgentAction   = (sid, phase, detail, output) => appendEvent(sid, { phase, type: 'AGENT_ACTION', detail, ...(output && { output }) })
export const logHumanInput    = (sid, phase, actor, role, detail) => appendEvent(sid, { phase, type: 'HUMAN_INPUT', actor, role, detail })
export const logGate          = (sid, phase, gate, decision, actor, role, notes) => appendEvent(sid, { phase, type: 'GATE', gate, decision, actor, role, notes })
export const logIterationStart= (sid, task, iteration) =>      appendEvent(sid, { phase: 4, type: 'ITERATION_START', task, iteration })
export const logFilesChanged  = (sid, task, iteration, files) => appendEvent(sid, { phase: 4, type: 'FILES_CHANGED', task, iteration, files })
export const logQualityResult = (sid, task, iteration, check, result, detail) => appendEvent(sid, { phase: 4, type: 'QUALITY_RESULT', task, iteration, check, result, detail })
export const logEscalation    = (sid, task, type, detail) =>   appendEvent(sid, { phase: 4, type: 'ESCALATION', task, escalation_type: type, detail })
export const logPrOpened      = (sid, prNumber, url) =>        appendEvent(sid, { phase: 6, type: 'PR_OPENED', pr_number: prNumber, url })
export const logStoryClosed   = (sid, summary) =>              appendEvent(sid, { phase: 7, type: 'STORY_CLOSED', ...summary })
```

---

### TASK 2 — Create `src/audit/renderer.js`

```javascript
// src/audit/renderer.js
const PHASE_NAMES = {
  1: 'Requirements ingestion', 2: 'Story decomposition',
  3: 'Environment setup',      4: 'Code generation',
  5: 'Test orchestration',     6: 'PR review',
  7: 'Deployment',
}
const fmt = iso => iso ? iso.replace('T', ' ').slice(0, 16) : '—'
const D = '═'.repeat(62)
const T = '─'.repeat(62)

export function renderFullAudit(log) {
  const lines = ['', `STORY-AUDIT: ${log.story_id} — ${log.title}`, D]
  let currentPhase = null
  for (const ev of log.events) {
    if (ev.phase && ev.phase !== currentPhase) {
      currentPhase = ev.phase
      lines.push('', `PHASE ${ev.phase} — ${PHASE_NAMES[ev.phase] || ''}`, T)
    }
    const t = fmt(ev.at)
    if (ev.type === 'PHASE_START')     lines.push(`  ${t}  ◆ ${ev.detail}`)
    else if (ev.type === 'AGENT_ACTION') {
      lines.push(`  ${t}  → ${ev.detail}`)
      if (ev.output) Object.entries(ev.output).forEach(([k,v]) => lines.push(`                    ${k}: ${v}`))
    }
    else if (ev.type === 'HUMAN_INPUT') lines.push(`  ${t}  👤 [${ev.role}] ${ev.actor}: ${ev.detail}`)
    else if (ev.type === 'GATE') {
      lines.push(`  ${t}  ◀ GATE ${ev.gate} — ${ev.decision === 'APPROVED' ? '✓ APPROVED' : '✗ REJECTED'}`)
      lines.push(`                    Reviewer: ${ev.actor} (${ev.role})`)
      if (ev.notes) lines.push(`                    Notes: ${ev.notes}`)
    }
    else if (ev.type === 'ITERATION_START') lines.push(`  ${t}  ↺ Task ${ev.task} — Iteration ${ev.iteration} started`)
    else if (ev.type === 'FILES_CHANGED') {
      lines.push(`  ${t}  📝 Task ${ev.task} — Files changed (iteration ${ev.iteration})`)
      if (ev.files) ev.files.forEach(f => lines.push(`                    ${f.action.padEnd(7)} ${f.path} +${f.lines_added||0}/-${f.lines_removed||0}`))
    }
    else if (ev.type === 'QUALITY_RESULT') lines.push(`  ${t}  ${ev.result==='PASS'?'✓':'✗'} ${ev.check}: ${ev.result}${ev.detail ? ' — '+ev.detail : ''}`)
    else if (ev.type === 'ESCALATION')  lines.push(`  ${t}  ⚠ ESCALATION [${ev.escalation_type}] ${ev.detail}`)
    else if (ev.type === 'PR_OPENED')   lines.push(`  ${t}  🔀 PR #${ev.pr_number} opened${ev.url ? ' — '+ev.url : ''}`)
    else if (ev.type === 'STORY_CLOSED') {
      lines.push('', D, 'SUMMARY', T)
      if (ev.duration_minutes) lines.push(`  Total time:          ${Math.floor(ev.duration_minutes/60)}h ${ev.duration_minutes%60}min`)
      if (ev.total_iterations !== undefined) lines.push(`  Agent iterations:    ${ev.total_iterations}`)
      if (ev.human_interventions !== undefined) lines.push(`  Human interventions: ${ev.human_interventions}`)
      if (ev.files_changed !== undefined) lines.push(`  Files changed:       ${ev.files_changed}`)
      if (ev.tests_added !== undefined) lines.push(`  Tests added:         ${ev.tests_added}`)
      lines.push(D)
    }
  }
  lines.push('')
  return lines.join('\n')
}

export function renderGateLog(log) {
  const lines = ['', `GATE LOG: ${log.story_id} — ${log.title}`, T, '']
  const gates  = log.events.filter(e => e.type === 'GATE')
  const humans = log.events.filter(e => e.type === 'HUMAN_INPUT')
  if (gates.length === 0) { lines.push('  No gate decisions recorded yet.', ''); return lines.join('\n') }
  gates.forEach(g => {
    lines.push(`  ${g.decision==='APPROVED'?'✓':'✗'} Gate ${g.gate}`)
    lines.push(`    Decision:  ${g.decision}`)
    lines.push(`    Reviewer:  ${g.actor} (${g.role})`)
    lines.push(`    Time:      ${fmt(g.at)}`)
    if (g.notes) lines.push(`    Notes:     ${g.notes}`)
    lines.push('')
  })
  if (humans.length > 0) {
    lines.push('Human inputs:', '')
    humans.forEach(h => { lines.push(`  [${h.role}] ${h.actor} — ${h.detail}`); lines.push(`    ${fmt(h.at)}`); lines.push('') })
  }
  return lines.join('\n')
}

export function renderDiffLog(log) {
  const lines = ['', `DIFF LOG: ${log.story_id} — ${log.title}`, T, '']
  const fileEvents = log.events.filter(e => e.type === 'FILES_CHANGED')
  if (fileEvents.length === 0) { lines.push('  No file changes recorded yet.', ''); return lines.join('\n') }
  const allFiles = {}
  fileEvents.forEach(ev => {
    if (!ev.files) return
    ev.files.forEach(f => {
      if (!allFiles[f.path]) allFiles[f.path] = { action: f.action, added: 0, removed: 0, iters: [] }
      allFiles[f.path].added   += f.lines_added   || 0
      allFiles[f.path].removed += f.lines_removed || 0
      allFiles[f.path].iters.push(`${ev.task}-i${ev.iteration}`)
    })
  })
  const created  = Object.entries(allFiles).filter(([,v]) => v.action === 'CREATE')
  const modified = Object.entries(allFiles).filter(([,v]) => v.action === 'MODIFY')
  if (created.length)  { lines.push('Created:');  created.forEach(([p,i])  => lines.push(`  + ${p}  (+${i.added} lines)  [${i.iters.join(', ')}]`)); lines.push('') }
  if (modified.length) { lines.push('Modified:'); modified.forEach(([p,i]) => lines.push(`  ~ ${p}  (+${i.added}/-${i.removed} lines)  [${i.iters.join(', ')}]`)); lines.push('') }
  const ta = Object.values(allFiles).reduce((s,v) => s+v.added,   0)
  const tr = Object.values(allFiles).reduce((s,v) => s+v.removed, 0)
  lines.push(`Total: ${Object.keys(allFiles).length} files  +${ta}/-${tr} lines`, '')
  return lines.join('\n')
}

export function renderSprintReport(logs) {
  const lines = ['', 'SPRINT REPORT', D, '']
  if (logs.length === 0) { lines.push('  No stories logged this sprint.', ''); return lines.join('\n') }
  let totIter=0, totHuman=0, totFiles=0, totTests=0, closed=0
  logs.forEach(log => {
    const cl     = log.events.find(e => e.type === 'STORY_CLOSED')
    const gates  = log.events.filter(e => e.type === 'GATE')
    const iters  = log.events.filter(e => e.type === 'ITERATION_START')
    const humans = log.events.filter(e => e.type === 'HUMAN_INPUT')
    const esc    = log.events.filter(e => e.type === 'ESCALATION')
    const status = cl ? 'CLOSED' : gates.some(g=>g.gate==='G3') ? 'MERGED' : gates.some(g=>g.gate==='G2') ? 'IN PROGRESS' : 'PLANNING'
    totIter  += cl?.total_iterations   || iters.length
    totHuman += cl?.human_interventions || humans.length
    totFiles += cl?.files_changed       || 0
    totTests += cl?.tests_added         || 0
    if (cl) closed++
    lines.push(`${log.story_id} — ${log.title}`)
    lines.push(`  Status:        ${status}`)
    lines.push(`  Iterations:    ${cl?.total_iterations   || iters.length}`)
    lines.push(`  Interventions: ${cl?.human_interventions || humans.length}`)
    if (esc.length > 0) lines.push(`  Escalations:   ${esc.length}`)
    lines.push(`  Gates signed:  ${gates.filter(g=>g.decision==='APPROVED').map(g=>g.gate).join(', ') || 'none'}`)
    if (cl) {
      lines.push(`  Duration:      ${Math.floor(cl.duration_minutes/60)}h ${cl.duration_minutes%60}min`)
      lines.push(`  Files:         ${cl.files_changed}`)
      lines.push(`  Tests added:   ${cl.tests_added}`)
    }
    lines.push('')
  })
  lines.push(D, 'SPRINT TOTALS', T)
  lines.push(`  Stories:              ${logs.length} total, ${closed} closed`)
  lines.push(`  Agent iterations:     ${totIter}`)
  lines.push(`  Human interventions:  ${totHuman}`)
  lines.push(`  Files changed:        ${totFiles}`)
  lines.push(`  Tests added:          ${totTests}`)
  lines.push(`  Avg iterations/story: ${logs.length > 0 ? (totIter/logs.length).toFixed(1) : 0}`)
  lines.push(D, '')
  return lines.join('\n')
}

export function renderMarkdown(log) {
  const lines = [`# Audit Trail: ${log.story_id}`, '', `**Story:** ${log.title}`, `**Started:** ${fmt(log.started_at)}`, '']
  const cl = log.events.find(e => e.type === 'STORY_CLOSED')
  if (cl) {
    lines.push('## Summary', '', '| Metric | Value |', '|--------|-------|')
    if (cl.duration_minutes) lines.push(`| Total time | ${Math.floor(cl.duration_minutes/60)}h ${cl.duration_minutes%60}min |`)
    if (cl.total_iterations !== undefined)   lines.push(`| Agent iterations | ${cl.total_iterations} |`)
    if (cl.human_interventions !== undefined) lines.push(`| Human interventions | ${cl.human_interventions} |`)
    if (cl.files_changed !== undefined)      lines.push(`| Files changed | ${cl.files_changed} |`)
    if (cl.tests_added !== undefined)        lines.push(`| Tests added | ${cl.tests_added} |`)
    lines.push('')
  }
  const gates = log.events.filter(e => e.type === 'GATE')
  if (gates.length > 0) {
    lines.push('## Gate decisions', '', '| Gate | Decision | Reviewer | Role | Time | Notes |', '|------|----------|----------|------|------|-------|')
    gates.forEach(g => lines.push(`| ${g.gate} | ${g.decision==='APPROVED'?'✅':'❌'} ${g.decision} | ${g.actor} | ${g.role} | ${fmt(g.at)} | ${g.notes||''} |`))
    lines.push('')
  }
  const humans = log.events.filter(e => e.type === 'HUMAN_INPUT')
  if (humans.length > 0) {
    lines.push('## Human inputs', '')
    humans.forEach(h => lines.push(`- **${fmt(h.at)}** [${h.role}] ${h.actor}: ${h.detail}`))
    lines.push('')
  }
  const fileEvents = log.events.filter(e => e.type === 'FILES_CHANGED')
  if (fileEvents.length > 0) {
    lines.push('## Files changed', '', '| Action | File | Lines added | Lines removed | Task/Iter |', '|--------|------|-------------|---------------|-----------|')
    fileEvents.forEach(ev => { if (!ev.files) return; ev.files.forEach(f => lines.push(`| ${f.action} | \`${f.path}\` | ${f.lines_added||0} | ${f.lines_removed||0} | ${ev.task}-i${ev.iteration} |`)) })
    lines.push('')
  }
  lines.push('## Full event log', '', '| Time | Phase | Type | Detail |', '|------|-------|------|--------|')
  log.events.forEach(e => {
    const phase  = e.phase ? `${e.phase} — ${PHASE_NAMES[e.phase]||''}` : '—'
    const detail = e.detail || e.check || (e.gate ? `Gate ${e.gate}: ${e.decision}` : '') || ''
    lines.push(`| ${fmt(e.at)} | ${phase} | ${e.type} | ${detail} |`)
  })
  lines.push('')
  return lines.join('\n')
}
```

---

### TASK 3 — Create `src/commands/audit.js`

```javascript
// src/commands/audit.js
import chalk from 'chalk'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { readLog, listLogs } from '../audit/logger.js'
import { renderFullAudit, renderGateLog, renderDiffLog, renderSprintReport, renderMarkdown } from '../audit/renderer.js'

export async function auditStory(storyId, options = {}) {
  if (!storyId) {
    console.log(chalk.red('\n  ✗ Story ID required. Example: yooti audit STORY-001\n'))
    process.exit(1)
  }
  const log = readLog(storyId)
  if (!log) {
    console.log(chalk.red(`\n  ✗ No audit log found for ${storyId}`))
    console.log(chalk.dim(`  Expected: .agent/logs/${storyId}.log.json\n`))
    process.exit(1)
  }
  let output
  if (options.gates)      output = renderGateLog(log)
  else if (options.diff)  output = renderDiffLog(log)
  else                    output = renderFullAudit(log)
  console.log(output)
  if (!options.noSave) {
    const auditDir = '.agent/audit'
    mkdirSync(auditDir, { recursive: true })
    if (options.gates || options.diff) {
      const suffix = options.gates ? 'gates' : 'diff'
      const path = `${auditDir}/${storyId}-${suffix}.md`
      writeFileSync(path, '```\n' + output + '\n```\n')
      console.log(chalk.dim(`  Saved: ${path}`))
    } else {
      const path = `${auditDir}/${storyId}-audit.md`
      writeFileSync(path, renderMarkdown(log))
      console.log(chalk.dim(`  Saved: ${path}\n`))
    }
  }
}

export async function sprintReport(options = {}) {
  const storyIds = listLogs()
  if (storyIds.length === 0) {
    console.log(chalk.dim('\n  No stories logged this sprint.\n'))
    return
  }
  const logs   = storyIds.map(id => readLog(id)).filter(Boolean)
  const output = renderSprintReport(logs)
  console.log(output)
  if (!options.noSave) {
    const auditDir = '.agent/audit'
    mkdirSync(auditDir, { recursive: true })
    const now  = new Date().toISOString().split('T')[0]
    const path = `${auditDir}/sprint-report-${now}.md`
    writeFileSync(path, '# Sprint Report\n\n```\n' + output + '\n```\n')
    console.log(chalk.dim(`  Saved: ${path}\n`))
  }
}
```

---

### TASK 4 — Create `src/commands/logEvent.js`

```javascript
// src/commands/logEvent.js
import chalk from 'chalk'
import inquirer from 'inquirer'
import { appendEvent, initLog } from '../audit/logger.js'
import { existsSync } from 'fs'

export async function logEvent(storyId) {
  if (!storyId) {
    const ans = await inquirer.prompt([{
      type: 'input', name: 'storyId', message: 'Story ID',
      validate: v => /^STORY-\d+$/.test(v) || 'Format: STORY-NNN'
    }])
    storyId = ans.storyId
  }
  console.log(chalk.cyan(`\n◆ Logging event for ${storyId}\n`))
  const answers = await inquirer.prompt([
    {
      type: 'list', name: 'type', message: 'Event type',
      choices: [
        { name: 'Human input   — PM clarification, architect note', value: 'HUMAN_INPUT' },
        { name: 'Gate decision — G1/G2/G3/G4/G5',                  value: 'GATE' },
        { name: 'Agent action  — log what the agent did',           value: 'AGENT_ACTION' },
        { name: 'Escalation    — log an escalation event',          value: 'ESCALATION' },
        { name: 'Story closed  — mark the story complete',          value: 'STORY_CLOSED' },
      ]
    },
    {
      type: 'list', name: 'phase', message: 'Which phase?',
      choices: [
        { name: '1 — Requirements ingestion', value: 1 },
        { name: '2 — Story decomposition',    value: 2 },
        { name: '3 — Environment setup',      value: 3 },
        { name: '4 — Code generation',        value: 4 },
        { name: '5 — Test orchestration',     value: 5 },
        { name: '6 — PR review',              value: 6 },
        { name: '7 — Deployment',             value: 7 },
      ]
    },
    { type: 'input', name: 'detail', message: 'What happened?', validate: v => v.length > 5 || 'Be specific' },
    { type: 'input', name: 'actor',  message: 'Who did this? (name)', when: a => ['HUMAN_INPUT','GATE'].includes(a.type), default: '' },
    { type: 'list',  name: 'role',   message: 'Their role', when: a => ['HUMAN_INPUT','GATE'].includes(a.type), choices: ['PM','Architect','Developer','QA','DevOps','Release Manager'] },
    { type: 'list',  name: 'gate',   message: 'Which gate?', when: a => a.type === 'GATE', choices: ['G1','G2','G3','G4','G5'] },
    { type: 'list',  name: 'decision', message: 'Decision', when: a => a.type === 'GATE', choices: ['APPROVED','REJECTED'] },
  ])
  if (!existsSync(`.agent/logs/${storyId}.log.json`)) initLog(storyId, storyId)
  const event = { phase: answers.phase, type: answers.type, detail: answers.detail }
  if (answers.actor)    event.actor    = answers.actor
  if (answers.role)     event.role     = answers.role
  if (answers.gate)     event.gate     = answers.gate
  if (answers.decision) event.decision = answers.decision
  appendEvent(storyId, event)
  console.log(`\n  ${chalk.green('✓')} Event logged to .agent/logs/${storyId}.log.json`)
  console.log(chalk.dim(`  View trail: yooti audit ${storyId}\n`))
}
```

---

### TASK 5 — Register in `bin/yooti.js`

```javascript
program
  .command('audit <story-id>')
  .description('Show full audit trail for a story')
  .option('--gates',    'show gate decisions only')
  .option('--diff',     'show file changes only')
  .option('--no-save',  'print only, do not save to .agent/audit/')
  .action(async (storyId, options) => {
    const { auditStory } = await import('../src/commands/audit.js')
    await auditStory(storyId, options)
  })

program
  .command('sprint:report')
  .description('Show audit summary for all stories in the sprint')
  .option('--no-save', 'print only, do not save')
  .action(async (options) => {
    const { sprintReport } = await import('../src/commands/audit.js')
    await sprintReport(options)
  })

program
  .command('log:event [story-id]')
  .description('Manually log a pipeline event for a story')
  .action(async (storyId) => {
    const { logEvent } = await import('../src/commands/logEvent.js')
    await logEvent(storyId)
  })
```

---

### TASK 6 — Test

```bash
node bin/yooti.js init test-s5 --type web --context greenfield --stack node,react --no-git --stage 3
cd test-s5
node ../bin/yooti.js story:add

node ../bin/yooti.js log:event STORY-001
# HUMAN_INPUT, Phase 1, "PM clarified 60s requirement"
node ../bin/yooti.js log:event STORY-001
# GATE, Phase 2, Gate G2, APPROVED, "James Wright", Architect

node ../bin/yooti.js audit STORY-001
node ../bin/yooti.js audit STORY-001 --gates
node ../bin/yooti.js audit STORY-001 --diff
node ../bin/yooti.js sprint:report

ls .agent/audit/
cd .. && rm -rf test-s5
```

---

---

# SESSION 6 — sm:standup (stub)

## Prompt

Read `bin/yooti.js` and `src/audit/logger.js` before starting.
Add a `sm:standup` command that generates a daily standup summary by
reading existing pipeline data — no LLM required. Pure data aggregation.
Do not modify any existing commands. All imports use `.js` extension.

---

### TASK 1 — Create `src/commands/standup.js`

```javascript
// src/commands/standup.js
import chalk from 'chalk'
import { readLog, listLogs } from '../audit/logger.js'
import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'fs'

export async function smStandup(options = {}) {
  console.log(chalk.cyan('\n◆ Daily Standup\n'))

  const storyIds = listLogs()
  if (storyIds.length === 0) {
    console.log(chalk.dim('  No stories logged yet. Add stories and start the sprint first.\n'))
    return
  }

  const logs = storyIds.map(id => readLog(id)).filter(Boolean)

  const completed   = []
  const inProgress  = []
  const blocked     = []
  const notStarted  = []

  for (const log of logs) {
    const events     = log.events || []
    const isClosed   = events.some(e => e.type === 'STORY_CLOSED')
    const hasMerged  = events.some(e => e.type === 'GATE' && e.gate === 'G3' && e.decision === 'APPROVED')
    const hasG2      = events.some(e => e.type === 'GATE' && e.gate === 'G2' && e.decision === 'APPROVED')
    const escalations= events.filter(e => e.type === 'ESCALATION')
    const lastPhase  = events.filter(e => e.type === 'PHASE_START').pop()
    const iters      = events.filter(e => e.type === 'ITERATION_START')

    // Check how long at current gate
    const g2Events   = events.filter(e => e.type === 'GATE' && e.gate === 'G2')
    const lastG2     = g2Events[g2Events.length - 1]
    const g2Hours    = lastG2
      ? Math.round((Date.now() - new Date(lastG2.at)) / 3600000)
      : null

    if (isClosed || hasMerged) {
      const actor = events.find(e => e.type === 'GATE' && e.gate === 'G3')?.actor || 'agent'
      completed.push({ id: log.story_id, title: log.title, actor })
    } else if (escalations.length > 0) {
      const lastEsc = escalations[escalations.length - 1]
      blocked.push({
        id: log.story_id, title: log.title,
        reason: lastEsc.escalation_type || 'escalation',
        detail: lastEsc.detail || '',
        action: escalationOwner(lastEsc.escalation_type)
      })
    } else if (g2Hours !== null && !hasMerged && g2Hours > 24) {
      blocked.push({
        id: log.story_id, title: log.title,
        reason: `Gate G2 open ${g2Hours}h`,
        detail: 'Architect review overdue',
        action: 'Architect'
      })
    } else if (hasG2 || iters.length > 0) {
      const phase = lastPhase?.detail || 'In progress'
      inProgress.push({ id: log.story_id, title: log.title, phase, iterations: iters.length })
    } else {
      notStarted.push({ id: log.story_id, title: log.title })
    }
  }

  // Check for escalation files outside logs
  const escDir = '.agent/escalations'
  if (existsSync(escDir)) {
    const escFiles = readdirSync(escDir).filter(f => f.endsWith('.md'))
    if (escFiles.length > 0 && blocked.length === 0) {
      escFiles.forEach(f => {
        const storyId = f.split('-')[0] + '-' + f.split('-')[1]
        if (!blocked.find(b => b.id === storyId)) {
          blocked.push({ id: storyId, title: storyId, reason: 'escalation file found', detail: f, action: 'Developer' })
        }
      })
    }
  }

  // Print report
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  console.log(`  ${chalk.white(dateStr)}\n`)

  if (completed.length > 0) {
    console.log(chalk.green('  COMPLETED'))
    completed.forEach(s => {
      const title = s.title?.length > 60 ? s.title.slice(0, 60) + '...' : s.title
      console.log(`  ${chalk.green('✓')} ${s.id} — ${title}`)
      if (s.actor) console.log(chalk.dim(`      reviewed by ${s.actor}`))
    })
    console.log('')
  }

  if (inProgress.length > 0) {
    console.log(chalk.cyan('  IN PROGRESS'))
    inProgress.forEach(s => {
      const title = s.title?.length > 60 ? s.title.slice(0, 60) + '...' : s.title
      console.log(`  ${chalk.cyan('◉')} ${s.id} — ${title}`)
      console.log(chalk.dim(`      ${s.phase}${s.iterations > 0 ? ' · ' + s.iterations + ' iterations' : ''}`))
    })
    console.log('')
  }

  if (blocked.length > 0) {
    console.log(chalk.red('  BLOCKED'))
    blocked.forEach(s => {
      const title = s.title?.length > 55 ? s.title.slice(0, 55) + '...' : s.title
      console.log(`  ${chalk.red('✗')} ${s.id} — ${title}`)
      console.log(chalk.yellow(`      ⚠ ${s.reason}`))
      if (s.detail) console.log(chalk.dim(`      ${s.detail}`))
      console.log(chalk.dim(`      Action required: ${s.action}`))
    })
    console.log('')
  }

  if (notStarted.length > 0) {
    console.log(chalk.dim('  NOT STARTED'))
    notStarted.forEach(s => {
      const title = s.title?.length > 60 ? s.title.slice(0, 60) + '...' : s.title
      console.log(chalk.dim(`  ○ ${s.id} — ${title}`))
    })
    console.log('')
  }

  // Sprint health summary
  const total = logs.length
  const done  = completed.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
  console.log('  SPRINT HEALTH')
  console.log(`  ${done}/${total} stories complete (${pct}%)`)
  if (blocked.length > 0) console.log(chalk.yellow(`  ${blocked.length} story/stories blocked — action required`))
  if (blocked.length === 0 && inProgress.length > 0) console.log(chalk.green('  No blockers'))
  console.log('')

  // Save to file
  if (!options.noSave) {
    mkdirSync('.agent/audit', { recursive: true })
    const dateKey = now.toISOString().split('T')[0]
    const path = `.agent/audit/standup-${dateKey}.md`
    const content = [
      `# Daily Standup — ${dateStr}`, '',
      `## Completed (${completed.length})`,
      ...completed.map(s => `- ${s.id} — ${s.title}`), '',
      `## In Progress (${inProgress.length})`,
      ...inProgress.map(s => `- ${s.id} — ${s.title} (${s.phase})`), '',
      `## Blocked (${blocked.length})`,
      ...blocked.map(s => `- ${s.id} — ${s.reason} → ${s.action}`), '',
      `## Not Started (${notStarted.length})`,
      ...notStarted.map(s => `- ${s.id} — ${s.title}`), '',
      `## Sprint health: ${done}/${total} complete (${pct}%)`,
    ].join('\n')
    writeFileSync(path, content)
    console.log(chalk.dim(`  Saved: ${path}\n`))
  }
}

function escalationOwner(type) {
  const owners = {
    SCOPE_ERROR:   'Developer and Architect',
    ENV_ERROR:     'DevOps',
    AMBIGUITY:     'PM',
    ARCH_ERROR:    'Architect',
    IMPORT_ERROR:  'Developer',
    SECURITY_ERROR:'Developer',
    TYPE_ERROR:    'Developer',
  }
  return owners[type] || 'Developer'
}
```

---

### TASK 2 — Register in `bin/yooti.js`

```javascript
program
  .command('sm:standup')
  .description('Generate daily standup summary from pipeline data')
  .option('--no-save', 'print only, do not save')
  .action(async (options) => {
    const { smStandup } = await import('../src/commands/standup.js')
    await smStandup(options)
  })
```

---

### TASK 3 — Test

```bash
node bin/yooti.js init test-s6 --type web --context greenfield --stack node,react --no-git --stage 3
cd test-s6
node ../bin/yooti.js story:add
node ../bin/yooti.js log:event STORY-001
# GATE, G2, APPROVED, "James Wright", Architect
node ../bin/yooti.js sm:standup
# Should show In Progress section
ls .agent/audit/standup-*.md
cd .. && rm -rf test-s6
```

---

---

# Notes for all sessions

- Do not modify any existing commands
- All imports use `.js` extension
- All new command files go in `src/commands/`
- All commands registered in `bin/yooti.js`
- Test each session before moving to the next
- If a command already exists, skip it — do not overwrite

---

## Quick reference — commands after all sessions complete

```
yooti story:import --file stories.json      # import stories from JSON
yooti story:sample --list                   # list sample apps
yooti story:sample --app ecommerce          # import sample stories
yooti story:sample --app ecommerce --sprint 1

yooti task:add STORY-001                    # PM adds task mid-sprint
yooti task:list STORY-001                   # list tasks and status
yooti plan:amend STORY-001-T001             # architect amends plan
yooti plan:approve STORY-001                # architect signs Gate G2

yooti context:add STORY-001 --url https://  # attach URL context
yooti context:add STORY-001 --note "..."    # attach note
yooti context:list STORY-001                # list attached context
yooti correct:inject STORY-001-T001         # developer injects correction
yooti test:require STORY-001                # QA adds test requirement

yooti qa:plan STORY-001                     # create QA test plan
yooti qa:review STORY-001                   # run Gate G4 review

yooti audit STORY-001                       # full story audit trail
yooti audit STORY-001 --gates               # gate decisions only
yooti audit STORY-001 --diff                # file changes only
yooti sprint:report                         # all stories in sprint
yooti log:event STORY-001                   # manually log an event

yooti sm:standup                            # daily standup summary
```
