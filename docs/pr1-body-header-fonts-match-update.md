<!-- Suggested PR #1 agent-body update. Preserve footer outside CURSOR markers. -->
<!-- CURSOR_AGENT_PR_BODY_BEGIN -->
## Summary
Clean Next.js Renacon mirror on permanent Vercel URL. Twilio SMS path remains configured on Vercel; **brochure download no longer requires OTP**.

## Live
**https://renacon.vercel.app** @ `cdc80bb` (`cdc80bb91b5861264b4acdd5ac0830a945655590`)
Cache-bust: `?v=renacon-header-in-202609171050`

### Header (renacon.in Blocksy match)
- Transparent overlay header over inner mint/video heroes (not a solid white bar)
- 90px logo, Roboto 13px/500 uppercase navy nav (`#163e7c`), 40px item spacing
- Simple `#039440` social icons (not filled green squares)
- OUR PRODUCTS: dark `rgba(0,0,0,0.86)` overlay dropdown, `#f4c709` items, right chevrons on nested products
- Mobile offcanvas unchanged (hamburger still opens the dark panel)

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
- [x] Header matches renacon.in (overlay, fonts, dark products dropdown, simple socials)
- [ ] Optional Twilio SMS
<!-- CURSOR_AGENT_PR_BODY_END -->
