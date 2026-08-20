# User Stories & Acceptance Criteria — KANGAYATH WEB

**Document Version**: 1.0.0  
**Phase**: Phase 02 — Product Requirements & Domain Specification  
**Status**: Authoritative  

---

## 1. Actor A: Shop Owner / Store Admin Stories

### US-ADM-001: Category & Subcategory Management
- **As a** Shop Owner,
- **I want to** create, edit, reorder, and activate Categories and Subcategories,
- **So that** I can organize my physical store's garments into a clear department structure (e.g., Men $\to$ Shirts).
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Create a new Category
    Given I am on the Admin Category Management page
    When I submit a new Category named "Women" with slug "women"
    Then the Category is saved and appears in the Category list
    And its initial status is Active

  Scenario: Reject Subcategory creation without parent Category
    Given I am attempting to create a Subcategory
    When I fail to specify a parent Category
    Then the system rejects the submission with "PARENT_CATEGORY_REQUIRED"

  Scenario: Prevent deleting a Category containing active Subcategories or Products
    Given a Category "Men" contains active Subcategory "Shirts"
    When I attempt to delete Category "Men"
    Then the system blocks the deletion with "CATEGORY_HAS_ACTIVE_DEPENDENCIES"
  ```

---

### US-ADM-002: Product Creation & Draft Workflow
- **As a** Shop Owner,
- **I want to** create a product in Draft mode and enter its details,
- **So that** I can prepare the listing before publishing it to customers.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Create a product in Draft mode
    Given I enter product name "Silk Wedding Saree" under Category "Women" and Subcategory "Sarees"
    When I save the product
    Then the product is saved with lifecycle_state = "DRAFT"
    And the product is not visible on the public customer website

  Scenario: Guard publishing incomplete products
    Given a product in "DRAFT" state has 0 uploaded images and 0 variants
    When I attempt to change its lifecycle_state to "PUBLISHED"
    Then the system blocks the transition with "PRODUCT_REQUIRES_IMAGE_AND_VARIANT"
  ```

---

### US-ADM-003: Product Image Management
- **As a** Shop Owner,
- **I want to** upload up to 6 images per product and set 1 as the primary image,
- **So that** customers can see clear, multi-angle photos of fabric and design.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Upload images and assign primary image
    Given I have a product in Draft or Published state
    When I upload 3 photos and mark the first photo as "Primary"
    Then all 3 images are saved
    And the first photo has is_primary = true while the others have is_primary = false

  Scenario: Reject exceeding 6 images
    Given a product already has 6 images
    When I attempt to upload a 7th image
    Then the system rejects the upload with "MAX_IMAGE_LIMIT_EXCEEDED"
  ```

---

### US-ADM-004: Variant Generation & Availability Management
- **As a** Shop Owner,
- **I want to** generate size and color variants for a product and toggle their availability,
- **So that** I can show customers exactly which sizes/colors are in stock.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Generate variants and toggle availability
    Given a product "Linen Shirt" has variants (Size 40, Maroon) and (Size 42, Maroon)
    When Size 40 sells out at the physical counter
    And I toggle Size 40 availability to "Sold Out"
    Then (Size 40, Maroon) has is_available = false
    And (Size 42, Maroon) remains is_available = true
    And the overall product remains Available because Size 42 is in stock

  Scenario: Prevent duplicate variants
    Given a product already contains variant (Size M, Color Navy)
    When I attempt to add a second variant with (Size M, Color Navy)
    Then the system rejects it with "DUPLICATE_VARIANT_COMBINATION"
  ```

---

### US-ADM-005: Product-Level Sold-Out Override
- **As a** Shop Owner,
- **I want to** toggle a product-level "Sold Out" switch,
- **So that** I can instantly mark an entire design as unavailable in one click without editing every single variant.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Force product-level sold out
    Given a product has 5 available variants
    When I set manual_sold_out = true
    Then the product displays as "Sold Out" across the public website
    And the individual variant availability flags remain preserved in the backend
  ```

---

### US-ADM-006: Promotional Custom Section Curation
- **As a** Shop Owner,
- **I want to** create custom sections (e.g., "Onam Special Offers", "New Arrivals") and arrange selected products,
- **So that** I can highlight seasonal campaigns on the homepage.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Create custom section and add products
    Given I create a Custom Section titled "Onam Festive Sarees"
    When I add 8 selected saree products and assign sort order 1 to 8
    And I activate the section
    Then the section appears as a carousel on the customer homepage
    And products display in the exact configured sort order

  Scenario: Deactivate custom section
    Given an active Custom Section "Summer Cotton Deals"
    When I toggle its status to Inactive
    Then the section is immediately removed from the customer homepage
    And the products remain unaffected in the general catalog
  ```

---

### US-ADM-007: Operating Schedule & Real-Time Status Management
- **As a** Shop Owner,
- **I want to** configure my store's weekly opening hours and set emergency manual open/closed overrides,
- **So that** customers always know if the shop is open before visiting.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Set weekly operating hours
    Given I configure Monday–Saturday as 09:30 to 20:30 and Sunday as Closed
    When current time is Tuesday 14:00 IST and override_mode is AUTO
    Then the calculated store status is "OPEN"

  Scenario: Emergency manual closure override
    Given regular hours indicate the store is OPEN
    When an unexpected local strike occurs and I set override_mode = FORCE_CLOSED with message "Closed today due to local bandh"
    Then the customer website displays "CLOSED" with banner "Closed today due to local bandh"
  ```

---

## 2. Actor B: Customer / Visitor Stories

### US-CUS-001: Category & Subcategory Catalog Browsing
- **As a** Customer,
- **I want to** browse clothing by category (e.g., Women $\to$ Sarees),
- **So that** I can quickly find the type of garment I am looking for.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Browse products in a subcategory
    Given published products exist under "Women > Sarees"
    When I navigate to "/category/women/sarees"
    Then I see a responsive grid of sarees
    And each card displays the primary image, product name, and availability status badge
  ```

---

### US-CUS-002: Product Detail & Variant Availability Inspection
- **As a** Customer,
- **I want to** inspect a product's photos, fabric description, and available sizes and colors,
- **So that** I can decide whether to visit the shop to try it on.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Inspect sizes and color availability
    Given a shirt has Size 38 (Available), Size 40 (Available), and Size 42 (Sold Out)
    When I view the product details page
    Then Sizes 38 and 40 are selectable
    And Size 42 is visually badged as "Sold Out" and non-selectable
    And selecting Size 38 updates the availability status indicator to "In Stock at Store"
  ```

---

### US-CUS-003: Faceted Search & Filtering
- **As a** Customer,
- **I want to** search by keywords and filter by size, color, section, and availability,
- **So that** I can easily find clothes that match my specific preferences.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Search with combined filters
    Given I search for "Cotton"
    And I apply filters: Category = "Men", Size = "L", "Show Available Only" = true
    Then only Published products matching "Cotton" in Men's with an available Size L are returned
    And Sold Out products are excluded
  ```

---

### US-CUS-004: Anonymous Saved Items (Favorites)
- **As a** Customer,
- **I want to** save products to my Saved Items list with a heart icon without logging in,
- **So that** I can show my saved list to the shopkeeper when I visit the store.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Save product and access without login
    Given I am browsing the catalog without an account
    When I tap the heart icon on "Festive Silk Kurta"
    Then the product is added to my Saved Items
    And the item remains in my Saved Items list after page refresh and browser restart

  Scenario: Remove product from Saved Items
    Given "Festive Silk Kurta" is in my Saved Items
    When I tap the remove button on the Saved Items page
    Then the product is removed from my Saved Items list immediately
  ```

---

### US-CUS-005: Store Status, Hours & Location Discovery
- **As a** Customer,
- **I want to** see whether the shop is open right now, check the address, and get Google Maps directions,
- **So that** I can plan my travel to the physical store.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: View real-time store status and hours
    Given I visit the homepage or shop info page
    When the current IST time is within store hours and no manual override is active
    Then I see a green "OPEN NOW" status indicator
    And I see today's closing time and weekly schedule
    And clicking the address or map button opens Google Maps directly to the shop location
  ```

---

### US-CUS-006: Direct WhatsApp Inquiry
- **As a** Customer,
- **I want to** click a WhatsApp button on a product page or my Saved Items list,
- **So that** I can ask the shop owner about product availability, customization, or reserve a trial visit.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Launch WhatsApp from Product Detail
    Given I am viewing product "Chanderi Cotton Saree" (Style Code: "KS-104")
    When I click the "Inquire on WhatsApp" button
    Then WhatsApp opens to the store's configured WhatsApp number
    And the chat text is pre-filled with "Hi Kangayath, I am interested in 'Chanderi Cotton Saree' (Ref: KS-104). Is this currently available?"
  ```

---

## 3. System Automation Stories

### US-SYS-001: Dynamic SEO Generation
- **As a** Search Engine Crawler,
- **I want to** access pre-rendered Open Graph tags, canonical URLs, and JSON-LD schema,
- **So that** Kangayath Web products rank highly for local garment searches.
- **Priority**: **P0 (MVP Mandatory)**
- **Acceptance Criteria**:
  ```gherkin
  Scenario: Index product page
    When a search crawler fetches "/products/pure-silk-saree-101"
    Then the HTML response contains <title>, <meta name="description">, <link rel="canonical">
    And a valid JSON-LD script with "@type": "Product" and image URLs is included
  ```
