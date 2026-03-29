// src/samples/ecommerce-stories.js
// Built-in sample stories for the ecommerce demo app.
// Used by: yooti story:sample --app ecommerce

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
        then: 'they receive a 404 — the order is not found and no information about its existence is revealed',
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
      security: 'Orders scoped to authenticated user — user ID from JWT not request body. Unauthenticated requests redirected to login.',
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
