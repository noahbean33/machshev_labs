# Kestrel RF — company website

Marketing site for **Kestrel RF Systems**, a (fictional) vendor of RF simulation and automated
test software for radar/EW, wireless, satcom, and semiconductor teams.

Static HTML, CSS, and vanilla JS. No build step, no dependencies, no network calls — open
`index.html` in a browser and it works.

## Pages

| File | Contents |
| --- | --- |
| `index.html` | Hero with a live spectrum/waterfall canvas, positioning, product overview, code sample, workflow, CTA |
| `products.html` | Kestrel Studio / Bench / Range / Core SDK deep dives, HIL target table, editions and pricing comparison |
| `solutions.html` | Radar & EW, 5G/NTN, satcom, semiconductor use cases plus adoption path |
| `company.html` | Story, principles, leadership, offices, open roles |
| `contact.html` | Demo/quote form with client-side validation, direct contact details, FAQ |

## Assets

- `assets/css/styles.css` — design tokens (colour, type, spacing) and all component styles
- `assets/js/main.js` — mobile nav, sticky header, scroll reveal, hero spectrum animation, form validation

## Run it

Just open the file:

```bash
start index.html
```

Or serve it locally if you prefer a real origin:

```bash
python -m http.server 8000
```

## Notes

- The contact form has **no backend**. `main.js` validates it and shows a local confirmation;
  point the submit handler at your CRM or form endpoint to make it live.
- The hero animation respects `prefers-reduced-motion` and pauses when scrolled out of view.
- Company name, people, logos, customers, metrics, and prices are all invented placeholder
  content — replace before any real use.
- Footer legal links (`Privacy`, `Terms`, `Export compliance`) are `#` placeholders.
