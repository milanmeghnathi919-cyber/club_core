# Style Blockers Log

This file records any visual or motion enhancement ideas that could not be implemented because they would require altering data structures, event handlers, routes, text copy, or backend contracts.

| ID | Proposed Visual Feature | Why It Was Blocked (Logic/Contract Conflict) | Resolution Taken |
|---|---|---|---|
| SB-01 | Third-party animation library (e.g. Framer Motion, GSAP) | Forbidden dependency addition in `package.json` | Used zero-dependency modern CSS keyframes, transitions, CSS variables, and native IntersectionObserver / CSS scroll animations |
| SB-02 | Rewording headings or card badges to fit shorter grid cards | Copy & user-visible text is strictly frozen | Used adaptive responsive grid layouts, clamp font-sizes, and flexible whitespace reflow |
| SB-03 | Altering table columns for compact visual density | Table headers and data fields are bound to business models and strict accessibility | Preserved every column, data label, and formatting exactly; refined typographic hierarchy, cell padding, and high-contrast borders |
