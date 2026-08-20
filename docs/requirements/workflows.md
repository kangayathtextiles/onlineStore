# Critical Workflows Specification — KANGAYATH WEB

**Document Version**: 1.0.0  
**Phase**: Phase 02 — Product Requirements & Domain Specification  
**Status**: Authoritative Reference  

---

## Catalog of Workflows

```text
├── Admin Workflows
│   ├── Workflow A: Create a Category
│   ├── Workflow B: Create a Subcategory
│   ├── Workflow C: Create a Product with Multiple Sizes and Colors
│   ├── Workflow D: Update a Single Variant's Availability
│   ├── Workflow E: Mark a Product/Variant Sold Out
│   ├── Workflow F: Restore Availability After Stock Arrives
│   ├── Workflow G: Hide Sold-Out Products from Customer Website
│   ├── Workflow H: Create a Promotional Custom Section
│   ├── Workflow I: Add/Remove Products from Promotional Section
│   ├── Workflow J: Activate/Deactivate Promotional Section
│   └── Workflow O: Owner Changes Shop Open/Closed Status
└── Customer Workflows
    ├── Workflow K: Customer Searches for a Product
    ├── Workflow L: Customer Filters by Size and Color
    ├── Workflow M: Customer Saves a Product (Favorites)
    ├── Workflow N: Customer Returns and Accesses Saved Products
    ├── Workflow P: Customer Checks Shop Status and Opening Hours
    ├── Workflow Q: Customer Uses WhatsApp / Direct Contact
    └── Workflow R: Customer Uses Shop Location & Directions
```

---

## 1. Admin Workflows

### Workflow A: Create a Category
- **Actor**: Shop Owner / Admin
- **Preconditions**: Admin is on the Category Management screen.
- **Trigger**: Admin clicks "Add New Category".
- **Main Flow**:
  1. Admin enters Category Name (e.g., "Men"), optional description, and uploads a thumbnail image.
  2. System auto-generates a URL slug (e.g., `men`). Admin can adjust if desired.
  3. Admin sets display order index.
  4. Admin clicks "Save Category".
  5. System validates uniqueness and saves record.
- **Validation**: Name is non-empty ($\le 100$ chars); Slug is unique and alphanumeric.
- **Result**: New Category is created with status `Active` and visible in customer navigation.
- **Failure Cases**: Slug collision $\to$ system appends random suffix or requests edit.
- **Business Rules**: BR-007, BR-009.

---

### Workflow B: Create a Subcategory
- **Actor**: Shop Owner / Admin
- **Preconditions**: At least one parent Category exists.
- **Trigger**: Admin clicks "Add Subcategory" under a Category.
- **Main Flow**:
  1. Admin selects parent Category (e.g., "Men").
  2. Admin enters Subcategory Name (e.g., "Formal Shirts").
  3. System generates unique slug (`men-formal-shirts`).
  4. Admin saves Subcategory.
- **Validation**: Parent Category must exist; Subcategory cannot have child subcategories (2-level hierarchy limit).
- **Result**: Subcategory created under Category.
- **Failure Cases**: Missing parent Category $\to$ blocked.
- **Business Rules**: BR-008, BR-009.

---

### Workflow C: Create a Product with Multiple Sizes and Colors
- **Actor**: Shop Owner / Admin
- **Preconditions**: Target Category and Subcategory exist.
- **Trigger**: Admin clicks "Add New Product".
- **Main Flow**:
  1. Admin enters Name, Category, Subcategory, Description, Fabric, and Style Code.
  2. Admin uploads 1 to 6 photos, setting 1 as Primary.
  3. Admin selects Sizes (e.g., M, L, XL) and Colors (e.g., Navy, Maroon).
  4. System generates the Cartesian product of variants (e.g., 6 combinations).
  5. Admin reviews variants (all default to `is_available = true`).
  6. Admin clicks "Publish Product" (or "Save as Draft").
- **Validation**: Product must have $\ge 1$ image and $\ge 1$ variant to transition to `PUBLISHED`.
- **Result**: Product is persisted with generated variants and becomes discoverable on the customer website.
- **Failure Cases**: Zero images uploaded $\to$ forced into `DRAFT` state.
- **Business Rules**: BR-012, BR-013, BR-014, BR-015, BR-018.

---

### Workflow D: Update a Single Variant's Availability
- **Actor**: Shop Owner / Admin
- **Preconditions**: Product exists with variants.
- **Trigger**: A specific size/color sells out in the physical store.
- **Main Flow**:
  1. Admin opens Product Edit screen on mobile phone.
  2. In the Variant list, Admin toggles the switch for "Size 40 - Navy" from `Available` to `Sold Out`.
  3. Admin clicks "Save".
- **Validation**: Variant must belong to the product.
- **Result**: Variant `is_available` becomes `false`. Other variants remain `true`. Product availability recomputed.
- **Failure Cases**: None. Instant database update.
- **Business Rules**: BR-019, BR-021.

---

### Workflow E: Mark a Product / Variant Sold Out
- **Actor**: Shop Owner / Admin
- **Preconditions**: Product is published.
- **Trigger**: Entire stock of a product is sold out or reserved.
- **Main Flow**:
  - *Option 1 (Variant-level)*: Admin toggles all variants to `is_available = false`.
  - *Option 2 (Product-level)*: Admin toggles the master switch `manual_sold_out = true`.
- **Validation**: None.
- **Result**: Product is immediately badged as "Sold Out" across customer catalog grids and search results.
- **Business Rules**: BR-020, BR-021.

---

### Workflow F: Restore Availability After Stock Arrives
- **Actor**: Shop Owner / Admin
- **Preconditions**: Product or variants are marked sold out.
- **Trigger**: New shipment arrives at the physical store.
- **Main Flow**:
  1. Admin locates product in Admin panel.
  2. Admin resets `manual_sold_out = false` and toggles arriving variants to `is_available = true`.
  3. Admin saves changes.
- **Result**: Product immediately resumes "In Stock" status on the customer website.
- **Business Rules**: BR-019, BR-020.

---

### Workflow G: Hide Sold-Out Products from Customer Website
- **Actor**: Shop Owner / Admin
- **Preconditions**: Product is discontinued or not expected to restock.
- **Trigger**: Owner decides to conceal the item.
- **Main Flow**:
  1. Admin changes product `lifecycle_state` from `PUBLISHED` to `HIDDEN` (or `ARCHIVED`).
  2. Admin saves.
- **Result**: Product is instantly excluded from public catalog grids, search results, and custom sections.
- **Business Rules**: BR-013, BR-029.

---

### Workflow H: Create a Promotional Custom Section
- **Actor**: Shop Owner / Admin
- **Preconditions**: Admin is on Custom Sections page.
- **Trigger**: Upcoming festival (e.g., Onam).
- **Main Flow**:
  1. Admin clicks "Create Section".
  2. Admin enters Title ("Onam Festive Collection"), Subtitle, and uploads banner image.
  3. System generates slug (`onam-festive-collection`).
  4. Admin toggles status to `Active`.
- **Result**: Section is created and ready for product assignments.
- **Business Rules**: BR-023.

---

### Workflow I: Add/Remove Products from Promotional Section
- **Actor**: Shop Owner / Admin
- **Preconditions**: Custom Section exists.
- **Trigger**: Admin selects products for the promotion.
- **Main Flow**:
  1. Admin opens section item picker.
  2. Admin selects 10 products from the catalog.
  3. Admin arranges products in desired carousel order (1 to 10).
  4. Admin saves section.
- **Result**: `CustomSectionItem` records created with explicit sort order.
- **Business Rules**: BR-024, BR-025.

---

### Workflow J: Activate/Deactivate Promotional Section
- **Actor**: Shop Owner / Admin
- **Preconditions**: Custom Section exists.
- **Trigger**: Promotional period ends.
- **Main Flow**:
  1. Admin toggles Section `is_active` to `false`.
- **Result**: Section carousel immediately disappears from the customer homepage. Products remain live in their regular categories.
- **Business Rules**: BR-023.

---

### Workflow O: Owner Changes Shop Open/Closed Status
- **Actor**: Shop Owner / Admin
- **Preconditions**: Store profile exists.
- **Trigger**: Unexpected shop closure (e.g., festival holiday).
- **Main Flow**:
  1. Admin opens Store Settings on phone.
  2. Admin sets `override_mode = FORCE_CLOSED`.
  3. Admin enters banner message: "Closed today for Onam. Reopening tomorrow 9:30 AM".
  4. Admin saves.
- **Result**: Customer frontend immediately displays red "CLOSED NOW" badge and announcement banner.
- **Business Rules**: BR-004.

---

## 2. Customer Workflows

### Workflow K: Customer Searches for a Product
- **Actor**: Customer / Visitor
- **Preconditions**: Customer is on the website.
- **Trigger**: Customer enters search query "Silk Saree" in search bar.
- **Main Flow**:
  1. Customer types query.
  2. Frontend sends debounced search request to backend.
  3. Backend queries `Published` products matching keywords.
  4. Customer sees instant product results grid with photos and availability badges.
- **Alternative Flows**: No results found $\to$ display friendly empty state with suggested categories and WhatsApp inquiry CTA.
- **Business Rules**: BR-027.

---

### Workflow L: Customer Filters by Size and Color
- **Actor**: Customer / Visitor
- **Preconditions**: Customer is viewing a category page (e.g., Men > Shirts).
- **Trigger**: Customer opens filter drawer.
- **Main Flow**:
  1. Customer selects Size "40" and Color "Maroon".
  2. Customer toggles "Show Available Only".
  3. Catalog dynamically updates to show only matching available shirts.
- **Business Rules**: BR-028, BR-030.

---

### Workflow M: Customer Saves a Product (Favorites)
- **Actor**: Customer / Visitor
- **Preconditions**: Customer is viewing a product card or product detail page.
- **Trigger**: Customer clicks the heart icon.
- **Main Flow**:
  1. Frontend saves product ID to `localStorage`.
  2. Frontend sends background sync request to anonymous `SavedItemCollection`.
  3. Heart icon fills with active brand color and toast confirmation appears ("Saved to your list").
- **Business Rules**: BR-032, BR-033.

---

### Workflow N: Customer Returns and Accesses Saved Products
- **Actor**: Customer / Visitor
- **Preconditions**: Customer previously saved items.
- **Trigger**: Customer revisits website days later and taps "Saved Items" in navigation.
- **Main Flow**:
  1. Frontend reads stored IDs and fetches live product data.
  2. Customer sees saved items with live availability badges ("In Stock" or "Sold Out").
  3. If a saved item was archived, a note indicates "Design discontinued".
  4. Customer can show this screen directly to the shop counter staff.
- **Business Rules**: BR-033, BR-034.

---

### Workflow P: Customer Checks Shop Status and Opening Hours
- **Actor**: Customer / Visitor
- **Trigger**: Customer visits homepage or Info page before traveling.
- **Main Flow**:
  1. Customer observes header status badge: green "OPEN NOW" or red "CLOSED NOW".
  2. Customer clicks to expand full weekly schedule (e.g., Mon–Sat 9:30 AM – 8:30 PM).
  3. Customer checks today's closing time.
- **Business Rules**: BR-003, BR-005.

---

### Workflow Q: Customer Uses WhatsApp / Direct Contact
- **Actor**: Customer / Visitor
- **Trigger**: Customer wants to ask if a specific garment is available in another size.
- **Main Flow**:
  1. Customer taps "Inquire on WhatsApp" on the product page.
  2. Mobile device opens WhatsApp with pre-filled message:  
     *"Hi Kangayath, I am interested in [Product Name] (Ref: KS-101). Is Size 42 available?"*
  3. Customer sends message directly to the shop owner.
- **Business Rules**: BR-006, BR-035.

---

### Workflow R: Customer Uses Shop Location & Directions
- **Actor**: Customer / Visitor
- **Trigger**: Customer wants driving/walking directions to the shop.
- **Main Flow**:
  1. Customer taps "Get Directions" on the Store Info page.
  2. System launches Google Maps app with GPS coordinates of the shop.
  3. Customer follows turn-by-turn navigation to the store.
- **Business Rules**: BR-001, BR-005.
