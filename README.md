# The HBC Volleyball Club website

Static website for The HBC Volleyball Club, a boys and girls volleyball club in Huntington Beach, CA.

## Pages
- `index.html`: Home
- `about.html`: Mission and values
- `teams.html`: Boys and girls club teams, tryout process
- `clinics.html`: Weekly clinics (beginner / intermediate / advanced)
- `summer-camp.html`: Summer camp
- `private-training.html`: Private and small group lessons
- `coaches.html`: Coaching staff
- `contact.html`: Contact info, map, and a message form (opens the visitor's email app)

Shared styles live in `css/styles.css` and behavior in `js/main.js`. There is no build step.

## Branding
- `images/logo-boys.png`: boys logo (black & white)
- `images/logo-girls.png`: girls logo (black & pink)
- Colors: black `#0a0a0a`, white, and girls-logo pink `#fb82ab` (deeper `#c2185b` for pink text on white). All are defined at the top of `css/styles.css`.
- The pink wave lines and shark fin echo the girls logo.

## Run locally
Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Deploy
Any static host works (GitHub Pages, Netlify, Vercel). For GitHub Pages, enable Pages on this branch with the repo root as the source.

## To update
- Coach bios: replace the placeholder "Coach Name" cards in `coaches.html`.
- Tryout and camp dates: update the notices in `teams.html` and `summer-camp.html`.
- Photos: add images to `images/` and swap them in for the logo `.visual` blocks.
