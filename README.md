# Vivid Network — Website

A simple static website for the Vivid Network Discord bot. This repository contains:

- `index.html` — main site
- `styles.css` — styling
- `script.js` — loads commands.json and handles small interactions
- `commands.json` — editable list of commands shown on the site

Setup and customization
1. Replace placeholders:
   - In `index.html` replace `BOT_INVITE_LINK` with your bot OAuth2 invite URL.
   - Replace `DISCORD_SERVER_INVITE` with your support server invite link.
2. Edit `commands.json` to add or remove commands.
3. Optional: change text, logo SVG in `index.html`, or styles in `styles.css`.

Deploy
- GitHub Pages:
  - Create a new repository and push these files to the default branch.
  - In repo Settings → Pages, choose the branch (e.g., `main`) and root folder. Save.
  - Your site will be available at `https://<username>.github.io/<repo>/`.
- Netlify:
  - Drag-and-drop the site folder to Netlify or connect the repo. It's a static site—no build needed.
- Other hosts (Vercel, Surge, S3) will also work.

Notes and next steps
- Add Open Graph images and metadata for better sharing previews.
- Add analytics (Google Analytics / Plausible) or a custom dashboard if you want usage metrics.
- Consider converting to a small static site generator (Hugo, Eleventy) if content grows.

License
- Add a license file if you want to open-source this site.
