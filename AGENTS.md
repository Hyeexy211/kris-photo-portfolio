# AGENTS.md

## Purpose

This file defines how AI coding agents such as Codex should work inside this repository.

The project is a personal photography portfolio website.

The primary goals are:

- clean visual design
- photography-first presentation
- maintainable code
- strong performance
- responsive layouts
- gradual long-term evolution

Agents should prioritize clarity and simplicity over unnecessary abstraction.

---

# 1. Current Technology

Current frontend stack:

- HTML5
- CSS3
- Vanilla JavaScript

Do not introduce:

- React
- Vue
- Next.js
- Angular
- large UI libraries
- unnecessary build systems

unless the task explicitly requires them or the repository architecture has already changed.

Always inspect the existing project before proposing a new dependency.

---

# 2. Design Principles

The visual direction should remain:

- minimal
- clean
- photography-first
- spacious
- modern
- calm

The interface may take inspiration from Apple's visual discipline, but should not directly copy Apple components or layouts.

Photography should remain the strongest visual element.

Avoid:

- excessive gradients
- unnecessary decorative elements
- excessive borders
- excessive shadows
- visual clutter
- animation without purpose

---

# 3. Before Editing Code

Before modifying files:

1. Read the relevant files.
2. Understand the existing implementation.
3. Identify the smallest set of files that need modification.
4. Check whether similar functionality already exists.
5. Explain the proposed implementation when appropriate.

Do not immediately rewrite large sections of the project.

Do not modify unrelated files.

---

# 4. Implementation Rules

Prefer the smallest correct implementation.

When solving a task:

```text
Understand
    ↓
Plan
    ↓
Implement
    ↓
Verify
    ↓
Review
```

Keep existing behavior unless the task explicitly requires changing it.

Avoid speculative architecture.

Do not build systems for hypothetical future requirements unless requested.

---

# 5. HTML Rules

Use semantic HTML whenever appropriate.

Prefer elements such as:

```html
<header>
<nav>
<main>
<section>
<article>
<figure>
<footer>
```

instead of using `<div>` for everything.

Requirements:

- maintain logical document structure
- provide useful `alt` text for meaningful images
- keep accessibility in mind
- keep heading levels logical
- avoid deeply nested markup

---

# 6. CSS Rules

CSS should remain readable and organized.

Prefer understandable class names.

Good:

```css
.gallery-grid
.gallery-item
.hero-title
.site-header
.photo-card
```

Avoid unclear names such as:

```css
.box1
.test
.abc
.new-style
```

Prefer reusable styles over duplicated CSS.

Use CSS custom properties when values are shared across the site.

Example:

```css
:root {
  --page-width: 1440px;
  --content-padding: 24px;
  --header-height: 64px;
}
```

Do not introduce complex CSS architecture unless the project requires it.

---

# 7. JavaScript Rules

Prefer simple browser APIs and Vanilla JavaScript.

JavaScript should mainly handle:

- interactions
- navigation
- dynamic gallery behavior
- animations that cannot be handled cleanly by CSS
- data loading
- future API communication

Avoid JavaScript for purely visual styling that can be implemented in CSS.

Use descriptive names.

Good:

```js
openLightbox()
closeLightbox()
loadGallery()
updateNavigation()
```

Avoid:

```js
doThing()
test()
func1()
```

---

# 8. Responsive Design

Every UI feature should work across:

- desktop
- tablet
- mobile

When changing layout code, check:

```text
1440px
1024px
768px
430px
390px
```

Avoid designing only for desktop.

Touch interactions must remain usable on mobile devices.

---

# 9. Photography and Image Rules

This is an image-heavy project.

Performance must be considered whenever images are introduced.

Prefer:

- responsive images
- lazy loading
- optimized thumbnails
- modern image formats
- reasonable image dimensions

Example:

```html
<img
  src="image.webp"
  alt="..."
  loading="lazy"
>
```

Do not commit large photography archives into Git.

Do not commit:

```text
*.RAW
*.CR2
*.CR3
*.NEF
*.ARW
```

Large original images should eventually live in object storage rather than the code repository.

---

# 10. File Organization

Current structure:

```text
/
├── index.html
├── css/
├── js/
├── assets/
├── docs/
├── AGENTS.md
└── README.md
```

Do not create new directories without a clear purpose.

When the project becomes larger, files may be separated into logical modules.

Example:

```text
js/
├── gallery.js
├── lightbox.js
├── navigation.js
└── main.js
```

Do not split files prematurely.

---

# 11. Git Branch Strategy

The repository uses a feature-branch workflow.

The `main` branch represents the stable version of the website.

Avoid developing large features directly on `main`.

## Branch Naming

Use the following prefixes.

### New feature

```text
feature/<name>
```

Examples:

```text
feature/gallery
feature/lightbox
feature/photo-categories
feature/download-button
```

### Bug fix

```text
fix/<name>
```

Examples:

```text
fix/mobile-navigation
fix/gallery-overflow
fix/broken-image-path
```

### Refactoring

```text
refactor/<name>
```

Examples:

```text
refactor/gallery-css
refactor/navigation-js
```

### Documentation

```text
docs/<name>
```

Examples:

```text
docs/update-readme
docs/gallery-architecture
```

### Performance

```text
perf/<name>
```

Examples:

```text
perf/image-loading
perf/gallery-rendering
```

Branch names should:

- use lowercase
- use hyphens between words
- describe one task
- remain short

Avoid:

```text
new
test
update
branch1
final
final-v2
kris-new-version
```

---

# 12. Development Workflow

For each feature:

```text
main
  ↓
create branch
  ↓
plan
  ↓
code
  ↓
test
  ↓
review diff
  ↓
commit
  ↓
merge into main
```

Example:

```bash
git switch main
git pull
git switch -c feature/gallery-lightbox
```

After implementation:

```bash
git status
git diff
```

Review all modifications before committing.

Then:

```bash
git add .
git commit -m "feat: add gallery lightbox"
```

After verification, merge the feature back into `main`.

---

# 13. Commit Convention

Use short, descriptive commit messages.

Preferred format:

```text
type: description
```

Supported types:

```text
feat:
fix:
style:
refactor:
perf:
docs:
chore:
```

Examples:

```text
feat: add photography category navigation

feat: add fullscreen photo viewer

fix: repair mobile navigation

fix: prevent gallery overflow

style: improve hero spacing

refactor: simplify scroll animation

perf: lazy load gallery images

docs: update project roadmap
```

Avoid vague commit messages such as:

```text
update

fix

changes

final

final2

new version
```

One logical task should ideally produce one focused commit.

---

# 14. Code Review

After implementing a task, review the Git diff.

Check specifically for:

- accidental file changes
- duplicated code
- unused CSS
- unused JavaScript
- broken paths
- syntax errors
- responsive problems
- accessibility issues
- console errors
- unnecessary dependencies

Do not automatically refactor unrelated code during review.

---

# 15. Testing Checklist

Before considering a feature complete, verify:

```text
[ ] Page loads correctly
[ ] No obvious console errors
[ ] Desktop layout works
[ ] Mobile layout works
[ ] Navigation still works
[ ] Existing features still work
[ ] Images load correctly
[ ] No accidental files were changed
[ ] Git diff has been reviewed
```

When tooling is introduced later, also run available:

```text
lint
test
build
```

commands.

---

# 16. Safety Rules

Do not:

- delete large groups of files without explicit need
- overwrite photography assets unnecessarily
- expose credentials
- commit `.env` files containing secrets
- commit API keys
- modify production infrastructure casually
- perform unrelated refactors

Ask for human review before destructive changes.

---

# 17. Secrets

Future API keys or credentials must use environment variables.

Never place credentials directly inside:

```text
HTML
CSS
JavaScript
Git history
README
```

Files such as:

```text
.env
.env.local
```

must be excluded from Git.

---

# 18. Roadmap

Before implementing major functionality, consult:

```text
docs/roadmap.md
```

Prefer completing the current development phase before jumping ahead to later infrastructure.

---

# 19. Definition of Done

A task is complete when:

```text
Requirement implemented
        ↓
Code reviewed
        ↓
Relevant behavior tested
        ↓
Responsive layout checked
        ↓
Git diff reviewed
        ↓
Ready for commit
```

Do not consider code complete merely because it was generated successfully.

## Image Rules

- Do not add RAW photography files to the repository.
- Prefer optimized WebP or JPEG assets for the website.
- Use lowercase filenames.
- Use `loading="lazy"` for gallery images.
- Do not lazy-load the hero image.
- Preserve meaningful `alt` text.
- Include image width and height when known.
## Responsive Image Rules

- Use `srcset` for important responsive image assets.
- Use `sizes` that reflect the actual layout width.
- Use multiple WebP sizes where practical.
- Do not lazy-load hero images.
- Use `loading="lazy"` for gallery images below the fold.
- Include intrinsic width and height when known.
- Avoid serving unnecessarily large images to mobile devices.