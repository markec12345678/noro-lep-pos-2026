
---
Task ID: 6
Agent: main (Z.ai Code)
Task: Raziskaj ali imajo profesionalne POS blagajne slike artiklov ali samo napise

Work Log:
- Web search (4 queries) za POS menu UI vzorce:
  * Square, Toast, Lightspeed, TouchBistro/Lavu
  * Ključni rezultati: vsi podpirajo slike, a implementacija se razlikuje
- Obiskal 3 help strani z agent-browser:
  * Square help (squareup.com/help/.../create-menus)
  * Toast help (support.toasttab.com/.../Adding-Images-to-Menu-Items)
  * Lightspeed help (resto-support.lightspeedhq.com/.../Adding-images)
- VLM analiza help strani:
  * Square: SLIKE podprte, prikazane v POS
  * Toast: SLIKE podprte, 750x450px priporočeno, a za online ordering
  * Lightspeed: SLIKE podprte, a za Order Anywhere + CFD, ne POS
- Image search (z-ai image-search) za realne POS UI screenshot-e:
  * Square POS: 4 slike prenesene
  * Toast POS: 4 slike prenesene
  * Lightspeed POS: 4 slike prenesene
  * Shopify POS: 4 slike prenesene
  * TouchBistro/Lavu: 4 slike prenesene
  * Skupaj 20 realnih POS UI screenshotov v /public/pos-ui-research/real/
- VLM analiza realnih POS vmesnikov (KLJUČNO ODKRITJE):
  * **Square POS**: SLIKE + TEXT v POS vmesniku (retail-style)
  * **Toast POS**: SAMO TEXT v POS vmesniku (restaurant-style, kljub podpori slik)
  * **Lightspeed POS**: SAMO TEXT v POS vmesniku (restaurant-style)
  * **Shopify POS**: SLIKE + TEXT v POS vmesniku (retail-style)
  * **TouchBistro/Lavu**: MEŠANO (večinoma text, nekaj slik)

Ključno odkritje:
- RETAIL POS (Square, Shopify): SLIKE + TEXT v POS vmesniku
- RESTAURANT POS (Toast, Lightspeed): SAMO TEXT v POS vmesniku
- Vsi podpirajo slike, a restaurant POS jih uporablja za:
  1. Online ordering (gostje)
  2. Customer-facing display (CFD)
  3. Kitchen display (show & tell)
  4. Marketing materiale
  NE za sam POS vmesnik za natakarje

Razlogi zakaj restaurant POS uporablja TEXT:
1. Hitrost — natakarji morajo hitro najti artikle (50-200+)
2. Gostota — več artiklov na zaslon
3. Čistost — slike zasedejo prostor
4. Standardizacija — "Pizza Margherita" bolj prepoznavna kot generična slika

Priporočilo za Noro Lep POS:
- POS vmesnik: TEXT labele (kot Toast/Lightspeed) za hitrost
- Online ordering za goste: SLIKE artiklov
- Customer-facing display: SLIKE artiklov
- Landing page: SLIKE artiklov (že implementirano v industries/case studies)

Stage Summary:
- 20 realnih POS UI screenshotov z VLM analizo
- 3 help strani analizirane
- Odkrit vzorec: RETAIL=SLIKE, RESTAURANT=TEXT
- Toast (svetovni #1 restaurant POS) in Lightspeed (#3) uporabljata TEXT
- Square (retail-focused) in Shopify (retail) uporabljata SLIKE
- Za Noro Lep (restaurant POS): TEXT v POS, SLIKE za goste
