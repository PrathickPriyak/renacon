<!-- Suggested PR #1 agent-body update (gh write blocked for this agent). Preserve footer outside CURSOR markers. -->
<!-- CURSOR_AGENT_PR_BODY_BEGIN -->
## Summary
Clean Next.js Renacon mirror on permanent Vercel URL. Twilio SMS path remains configured on Vercel; **brochure download no longer requires OTP**.

## Live
**https://renacon.vercel.app** @ `3a68f95` (`3a68f952222fe55c9f13d2fc12d8335cce2fec76`)
Cache-bust: `?v=renacon-products-spacing-no-img-hover-202609171015`
Products marker: `data-renacon-products-ix="products-hub-v3"`

### Homepage
- Exact home mirror on `/`
- **Highlights strip:** equal 64×64 icons in gray wash
- **OUR SERVICES:** side-by-side left skyscraper panel + right 2×2 green-border cards (live-verified; hard-refresh if cached)

### Contact / Products
- **/contact-us/:** premium interactive form — scroll-reveal, green/yellow focus rings & CTA hover (Forminator submit still works); forms use full content width
- **/our-products/:** Stackable hub styles, equal-height cards, 1:1 images, scroll-reveal + card hover lift (no image scale), fixed Renaplast/AAC links (`products-hub-v3`); tighter vertical spacing under banner
- **Product detail pages:** reduced top/vertical gaps (e.g. `/renaplast-readymix-plaster/`, `/renacon-aac-blocks/`); brochure forms full-width within content (no 70% skinny strip)

### Image hover
- Site-wide: no scale/lift/zoom transforms on images (home, products, gallery, news, etc.)

### Brochures / Careers
- Brochure: download **without OTP**
- Careers: premium form + resume upload → `/api/careers/`; form expanded to full content width

### Navigation
- Mobile offcanvas + active nav colors fixed

### Calculator
- Involve.me embeds restored with UI parity

### OTP / SMS (API available; not used for brochures)
- Twilio configured on Vercel Production; trial needs verified recipient numbers

## Test plan
- [x] Exact home mirror deployed + hard cache-bust on live
- [x] Highlights strip equal icon sizing
- [x] OUR SERVICES side-by-side parity on live
- [x] Brochure no OTP
- [x] Careers resume upload
- [x] Mobile menu
- [x] Contact Us premium form polish
- [x] Our Products equal-height + interactive hub v3
- [x] Product page spacing tightened (no huge white gaps)
- [x] No image hover scale site-wide
- [x] Product/contact/careers forms full content width
- [ ] Optional Twilio SMS
<!-- CURSOR_AGENT_PR_BODY_END -->
