# DeepBench Paper – Interactive Site

Short description (use in GitHub About):
Interactive companion site for the DeepBench paper: domain-specific robustness evaluation of Vision–Language Models (VLMs) with live corruption galleries, per-domain experiments (RQ1–RQ6), and copyable citations.

Live demo
- GitHub Pages: https://ml-lab-htw.github.io/deepbench_paper/

Overview
This repository contains a static, self-contained web site (HTML/CSS/JS) that presents the DeepBench paper’s results in an interactive format:
- Corruption gallery with thumbnails and 4-up severity examples
- Use Cases panel showing datasets and example images
- Experiments panels RQ1–RQ6 with plots per domain and optional per-corruption filtering
- Expandable Sources parsed from a BibTeX file (paper-style, no links)
- “How to Cite” section with a light-themed, directly copyable BibTeX block
- Graphical abstract and highlights
- Modern sticky UI: shrinking page title, compact nav, sticky corruption thumbnails

Key features
- Corruption Examples
  - Click thumbnails to switch corruption; shows four examples (severity levels) from assets/images/<Corruption>/
  - Supports a dynamic manifest at assets/images/manifest.json; falls back to conventional filenames
- Use Cases
  - Dedicated panel with thumbnails, short domain descriptions, and 4 example images per use case
- Experiments (RQ1–RQ6)
  - RQ1: LLM-based corruption selection
  - RQ2: Main robustness experiment across models and domains
  - RQ3: Domain specialists
  - RQ4: Architecture ablations
  - RQ5: Pretraining data effects (Acc + MCE/Flip)
  - RQ6: Label-Flip Probability correlation with accuracy
  - Per-domain plots live under assets/experiments/<experiment>/
- Sources and Citations
  - BibTeX loaded from assets/references.bib and rendered as paper-style references (expandable)
  - Copyable BibTeX in “How to Cite,” light code theme with a one-click copy button
- Polished UX
  - Sticky shrinking title + compact menu
  - Sticky corruption thumbnails that span multiple experiment sections
  - Smooth scrolling and automatic anchor offset so section headers aren’t covered
  - “Coming Soon” overlay toggle: ?comingSoon=1 or window.setComingSoon(true)

Project structure
- index.html – Main page
- css/style.css – Styles (header/menu, sticky title, thumbnails, code block theme, etc.)
- js/main.js – Interactive logic (thumbnails, plots, sticky behavior, BibTeX rendering)
- assets/
  - references.bib – Paper references (BibTeX)
  - images/ – Corruption examples and thumbnails (supports manifest.json)
  - experiments/ – Plots for RQ1–RQ6 (grouped by experiment)
  - CVIU_*.pdf, LaTeX sources, tables, and section .tex files used for content

Local preview
You can serve the site locally with any static server. For example (Python 3):

```bash
cd deepbench_paper
python3 -m http.server 8000
# Open http://localhost:8000
```

Publishing with GitHub Pages (via Actions)
This repository is pre-configured to deploy using GitHub Pages + Actions.

1) Enable Pages for this repo
- On GitHub: Settings → Pages → Build and deployment → Source: GitHub Actions

2) Push to main
- Every push to the main branch triggers the workflow at .github/workflows/deploy.yml
- The deployed URL appears under Settings → Pages and in the “Deploy to GitHub Pages” step logs

Manual gh-pages alternative (optional)
If you prefer a branch deployment:
- Create a gh-pages branch with this site at the repo root
- Settings → Pages → Deploy from a branch → gh-pages / (root)

Editing content
- Add/replace plot images under assets/experiments/<experiment>/
- Add or adjust corruption example images under assets/images/<Corruption>/
  - Optional: list the exact example filenames in assets/images/manifest.json to override auto-fallbacks
- Update the bibliography in assets/references.bib
- Update textual content in index.html (graphical abstract, highlights, RQ summaries) and css/style.css/js/main.js as needed

Useful toggles and behaviors
- Coming Soon overlay
  - Enable via URL: ?comingSoon=1 or programmatically: window.setComingSoon(true)
- Sticky thumbnails bar
  - Automatically sticks from “Corruption Examples” through the end of RQ6
  - Thumbnails shrink by 50% while sticky
- Anchor offset
  - Sections use scroll-margin-top driven by a dynamic header offset so titles aren’t hidden under the sticky header

Suggested repository topics (GitHub → About → Topics)
- computer-vision, robustness, benchmark, corruptions, vision-language-models, clip, siglip, llava, gemma, laion, datacomp, label-flip-probability, deepbench

Issues and contributions
- Please open issues for bugs or enhancement requests
- Pull requests welcome for plots, content, styles, or small JS improvements
