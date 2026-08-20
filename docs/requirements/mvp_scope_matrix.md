# MVP Scope Matrix (MoSCoW) — KANGAYATH WEB

**Document Version**: 1.0.0  
**Phase**: Phase 02 — Product Requirements & Domain Specification  
**Status**: Authoritative Reference  

---

## 1. MoSCoW Prioritization Matrix

```text
┌───────────────────────────────────────┬───────────────────────────────────────┐
│              MUST HAVE                │              SHOULD HAVE              │
│        (P0 - Core MVP Release)        │      (P1 - Immediate Post-MVP)        │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ • 2-level Category/Subcategory model  │ • Admin bulk variant availability     │
│ • Product creation (Draft/Published)  │   toggle (e.g., mark all Size M out)  │
│ • Up to 6 images with 1 Primary image │ • Enhanced search analytics / query   │
│ • Size & Color variant matrix         │   telemetry                           │
│ • Boolean variant availability toggle │ • Automated holiday schedule presets  │
│ • Product-level sold-out override     │ • Customer share sheet integration    │
│ • Promotional custom sections         │   (Web Share API)                     │
│ • Operating schedule & status logic   │ • PWA offline catalog caching         │
│ • Manual shop open/closed override    │                                       │
│ • Keyword search & faceted filtering  │                                       │
│ • Anonymous Saved Items (Favorites)   │                                       │
│ • One-click WhatsApp & Map deep links │                                       │
│ • Local SEO (JSON-LD & Open Graph)    │                                       │
├───────────────────────────────────────┼───────────────────────────────────────┤
│              COULD HAVE               │              WON'T HAVE               │
│        (P2 - Future Evaluation)       │       (Strictly Out of Scope)         │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ • Multi-language UI (Malayalam/Tamil) │ • Online payments (Razorpay/Stripe)   │
│ • Customer product reviews/ratings    │ • E-commerce shopping cart & checkout │
│ • Instagram feed sync                 │ • Home delivery & shipping logistics  │
│ • Virtual try-on / size guide modal   │ • Customer user accounts & passwords  │
│ • PDF catalog download generation     │ • Exact numeric inventory counts      │
│                                       │ • Product price display (initially)   │
│                                       │ • ERP / POS automated hardware sync   │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. Explicit Exclusions Justification

| Excluded Feature | Justification | Phase Target |
| :--- | :--- | :--- |
| **Online Payments & Checkout** | The brand vision is strictly footfall discovery for the physical shop counter. Adding checkout alters the business model to e-commerce, requiring tax registration, shipping partners, and payment processing fees. | Out of Scope |
| **Customer User Accounts** | Hard constraint to eliminate friction for local shoppers. Unauthenticated `localStorage` favorites provide 100% of required utility without login barriers. | Phase 06 (Optional Admin Auth only) |
| **Numeric Stock Inventory** | Manual data entry of exact inventory during busy festival sales causes rapid stock count drift without automated barcode scanner POS integration. | Future Phase (Post-Launch) |
| **Product Price Display** | In accordance with client requirements, price discussions are handled in-person or via WhatsApp. | Client Discretion |
