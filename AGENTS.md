# AGENTS.md

## 1. Project Overview

This is a long-term personal photography website project.

Primary goals:

- Showcase photography work
- Present photography collections and projects
- Provide a gallery experience
- Present personal and photography-related information
- Gradually support content management
- Later support image upload, editing, and deletion
- Eventually become a self-maintainable photography website

This project is also used as a Web development learning project.

Therefore, code should be:

- Clear
- Easy to understand
- Easy to maintain
- Easy to extend
- No more complex than necessary

Prefer simple, explicit solutions over clever abstractions.

---

## 2. Core Engineering Principles

Before making any change:

1. Understand the existing implementation first.
2. Preserve working behavior unless the task explicitly requires changing it.
3. Make the smallest reasonable change that solves the task.
4. Reuse existing structures before creating new ones.
5. Avoid unrelated refactors.
6. Do not redesign the project based on personal preference.
7. Do not replace existing technologies only because another solution is more modern.
8. New code should fit naturally into the existing codebase.
9. Prefer maintainability over novelty.
10. Do not over-engineer.

Core rule:

> Preserve first. Improve second.

---

## 3. Inspect Before Editing

Before implementation, inspect all files relevant to the current task.

This may include:

- `README.md`
- `ROADMAP.md`
- `AGENTS.md`
- HTML files
- CSS files
- JavaScript files
- Asset directories
- Existing component structures
- Existing class names
- Existing DOM structures
- Existing animation logic
- Existing responsive behavior

Do not create a new implementation based on assumptions if an existing solution already exists.

Prefer reusing existing:

- Classes
- Functions
- DOM structures
- Components
- Utilities
- Data structures
- Layout systems
- Animation systems

---

## 4. ROADMAP.md Is the Main Development Direction

The long-term project plan is defined in:

```text
ROADMAP.md
```

When the current task relates to the roadmap:

1. Read `ROADMAP.md`.
2. Identify the current development stage.
3. Implement only what is appropriate for the current stage.
4. Do not prematurely implement future features.

Follow:

> Build what the current stage needs.

Do not add infrastructure only because it may be useful later.

---

## 5. Current Technology Stack

Unless the current task or `ROADMAP.md` explicitly requires otherwise, keep the project based on:

```text
HTML
CSS
JavaScript
```

Prefer native browser APIs.

Do not introduce the following without a clear task requirement:

- React
- Vue
- Angular
- Next.js
- Nuxt
- Svelte
- Tailwind CSS
- Bootstrap
- jQuery
- UI frameworks
- State management libraries
- Animation frameworks
- Backend frameworks
- Build systems
- Large third-party dependencies

Before adding a dependency, ask:

> Can this be implemented cleanly with the existing stack?

If yes, prefer the existing stack.

---

## 6. Avoid Unrelated Refactors

Do not perform unrelated cleanup while completing a task.

Avoid unnecessary:

- File renaming
- File moving
- Directory restructuring
- Full CSS rewrites
- Full HTML rewrites
- Full JavaScript rewrites
- Large-scale class renaming
- Repository-wide formatting
- Removal of code that only appears unused
- Replacement of existing implementation patterns

If an unrelated issue is discovered, leave it unchanged unless it blocks the current task.

Mention it in the final summary instead.

---

## 7. File and Directory Rules

Do not change the existing project structure without a clear reason.

Before creating a file:

1. Check whether a similar file already exists.
2. Use a predictable and descriptive filename.
3. Place it in the correct semantic directory.
4. Avoid creating unnecessary files for very small features.

Prefer lowercase filenames.

For multi-word filenames, prefer:

```text
kebab-case
```

Examples:

```text
gallery-item.js
work-detail.js
image-viewer.js
```

Do not mix naming styles unless the repository already uses another convention consistently.

---

## 8. HTML Guidelines

HTML should remain:

- Semantic
- Clear
- Simple
- Accessible
- Structurally consistent

Prefer semantic elements where appropriate:

```html
<header>
<nav>
<main>
<section>
<article>
<footer>
<button>
<a>
```

Avoid unnecessary wrapper elements.

However, do not rewrite stable markup only for theoretical semantic improvements.

---

## 9. Preserve Existing DOM Contracts

Existing CSS and JavaScript may depend on the current DOM structure.

Before changing markup, inspect dependencies such as:

- CSS selectors
- JavaScript selectors
- Animation selectors
- Responsive selectors
- Hover states
- Active states
- Event listeners

Do not assume a structural change is harmless.

Preserve existing DOM contracts whenever possible.

---

## 10. Visual Design Direction

The website design direction is:

> Minimal, restrained, modern, and photography-first.

The visual language should favor:

- Generous whitespace
- Clear hierarchy
- Simple typography
- Restrained motion
- Image-first presentation
- Subtle interactions
- Clean composition

The overall feel may reference Apple-style minimal product presentation, without copying specific layouts.

Do not introduce unnecessary:

- Heavy gradients
- Strong drop shadows
- Highly saturated colors
- Decorative UI
- Excessive glassmorphism
- Visually noisy controls
- Inconsistent design languages

Photography should remain the visual focus.

---

## 11. Reuse Existing CSS

Before adding new CSS, inspect whether the project already has reusable rules for:

- Containers
- Grids
- Typography
- Spacing
- Buttons
- Cards
- Animations
- Breakpoints
- Layout utilities

Avoid creating parallel style systems such as:

```css
.work-card {}
.work-card-new {}
.work-card-v2 {}
.work-card-final {}
```

Prefer extending or reusing the existing design system.

---

## 12. Preserve Existing Visual Behavior

Unless the task explicitly requires visual changes, preserve:

- Typography
- Spacing
- Layout
- Grid behavior
- Hover states
- Transitions
- Reveal animations
- Scroll interactions
- Navigation behavior
- Image presentation

Do not redesign pages while implementing functional changes.

---

## 13. Responsive Design

All new UI and behavior must account for:

```text
Desktop
Tablet
Mobile
```

Check for:

- Overflow
- Distorted images
- Broken text wrapping
- Grid behavior
- Navigation usability
- Click and tap target size
- Accidental horizontal scrolling

Do not create separate duplicated pages for mobile unless explicitly required.

Prefer responsive CSS.

---

## 14. JavaScript Guidelines

JavaScript should be:

- Clear
- Readable
- Modular
- Focused
- Easy to debug
- Free from unnecessary global state

Functions should preferably have a single clear responsibility.

Prefer:

```js
function renderWorks() {}

function createWorkCard() {}

function initReveal() {}
```

over one large function containing unrelated logic.

---

## 15. JavaScript Naming

Use descriptive names.

Prefer:

```js
workGrid
galleryItems
renderGallery
createWorkCard
openLightbox
closeLightbox
```

Avoid vague names such as:

```js
a
x
temp2
data1
thing
foo
test123
```

Short local loop variables are acceptable only when their meaning is obvious.

---

## 16. Avoid Unnecessary Duplication

If meaningful logic is repeated multiple times, consider extracting:

- A function
- A helper
- A shared class
- A shared data structure

Do not abstract aggressively for minor repetition.

Follow:

> Abstract when repetition becomes meaningful.

Do not build abstractions for hypothetical future needs.

---

## 17. Safe DOM Access

DOM queries must tolerate elements that may not exist on every page.

Prefer:

```js
const element = document.querySelector(".example");

if (element) {
  // logic
}
```

Do not allow a missing optional element to break the entire script with errors such as:

```text
Cannot read properties of null
```

---

## 18. ES Modules

If JavaScript uses:

```js
import
export
```

the corresponding HTML must use:

```html
<script type="module" src="..."></script>
```

Verify module paths carefully.

Avoid mixing module and non-module code in ways that create incorrect execution order.

---

## 19. Dynamic DOM and Initialization Order

When JavaScript dynamically creates DOM elements, inspect whether existing functionality depends on initialization such as:

```js
document.querySelectorAll(...)
```

This is especially important for:

- Reveal animations
- `IntersectionObserver`
- Click handlers
- Image viewers
- Hover logic
- Lightboxes
- Lazy initialization

Dynamic content must either:

- Be created before dependent initialization runs, or
- Be handled by logic that supports dynamically created elements

Do not allow dynamically rendered content to lose existing interactions.

---

## 20. Photography Asset Safety

Photography assets are important project content.

Do not:

- Reference nonexistent files
- Invent file paths
- Delete real photos
- Delete videos
- Delete RAW files
- Move large groups of images without explicit need
- Rename assets unnecessarily

Always verify real paths before modifying references.

Pay attention to filename case.

For example:

```text
Photo.jpg
```

and:

```text
photo.jpg
```

may behave differently in deployment environments.

---

## 21. Asset Path Rules

When changing paths, consider:

- Local development
- Deployment
- GitHub Pages
- Relative directory depth

Do not introduce machine-specific absolute paths such as:

```text
/Users/username/...
C:\Users\...
```

All project resource paths must be portable.

---

## 22. Image Alt Text

Important images should have meaningful `alt` text.

Avoid generic values such as:

```html
alt="image"
alt="photo"
```

Describe the visual content when appropriate.

Decorative images may use:

```html
alt=""
```

---

## 23. Performance

This is a photography website and may contain many large images.

Consider:

- Image count
- Image dimensions
- Initial page load
- Lazy loading
- DOM size
- Duplicate network requests

Use:

```html
loading="lazy"
```

when appropriate for non-critical images.

Do not unnecessarily lazy-load important above-the-fold images if it harms the experience.

Avoid loading large numbers of full-resolution originals directly into the DOM without a clear need.

---

## 24. Animation Principles

Animations should be:

- Subtle
- Consistent
- Smooth
- Content-supporting
- Secondary to the photography

Prefer performant properties such as:

```text
opacity
transform
```

Avoid unnecessary animation of layout-heavy properties such as:

```text
width
height
top
left
```

Do not give every element a different animation style.

Keep motion language consistent across the site.

---

## 25. Preserve Animation Compatibility

After structural changes, verify that existing:

- Reveal animations
- Scroll animations
- Hover transitions
- Initial states
- Observers
- Interaction handlers

still work.

If the project already has an animation system, reuse it rather than creating another one.

---

## 26. Accessibility

Use native interactive elements whenever possible.

Prefer:

```html
<button>
```

instead of:

```html
<div onclick="...">
```

Use:

```html
<a>
```

for navigation links.

Consider:

- Keyboard navigation
- Focus states
- `aria-label`
- Alt text
- Semantic markup

Do not perform large accessibility rewrites outside the current task, but new code should follow good accessibility practices.

---

## 27. Error Handling

Normal edge cases should not crash the page.

Examples:

- Empty data
- Missing optional DOM elements
- Missing optional fields
- Image loading failures

Handle errors proportionally.

Do not introduce a complex error-handling framework for simple cases.

---

## 28. Never Invent Project Data

Do not fabricate:

- Photography locations
- Dates
- Camera models
- Lenses
- EXIF metadata
- Image dimensions
- Collection descriptions
- File paths
- Personal information

When test data is needed:

1. Prefer existing project content.
2. Clearly mark temporary data.
3. Never reference assets that do not exist.

---

## 29. GitHub Pages and Deployment Compatibility

Changes must remain compatible with deployment.

Pay special attention to:

- Filename case
- Relative paths
- Module paths
- Image paths
- Favicon paths
- CSS paths
- JavaScript paths

Avoid situations where:

```text
Local works
GitHub Pages fails
```

---

## 30. Keep the Browser Console Clean

After implementation, check for newly introduced errors such as:

```text
Uncaught TypeError
ReferenceError
SyntaxError
404
Failed to load resource
Failed to load module script
```

Do not introduce new runtime or loading errors.

If an unrelated pre-existing error exists, mention it in the final summary.

Do not hide it.

---

## 31. Do Not Install Dependencies Without Need

Do not run commands such as:

```bash
npm install ...
```

or add third-party CDNs unless the current task explicitly requires them.

If a dependency seems genuinely necessary but has not been authorized, explain why before introducing it.

Prefer the current stack whenever practical.

---

## 32. Avoid Unnecessary Configuration Changes

Do not modify unrelated configuration such as:

- Git settings
- GitHub Actions
- Deployment configuration
- Build configuration
- Repository settings
- `.gitignore`
- Package configuration
- Hosting configuration

unless the current task requires it.

---

## 33. `.gitignore`

If new generated or local-only files are introduced, inspect `.gitignore` first.

Do not commit obvious temporary or local files such as:

- OS files
- IDE cache
- Temporary files
- Local secrets
- Generated caches
- Unnecessary build artifacts

Do not add important active project directories to `.gitignore` without a clear reason.

---

## 34. Secrets and Sensitive Data

Never hardcode:

- API keys
- Passwords
- Private tokens
- Database passwords
- Authentication secrets

into:

- HTML
- JavaScript
- CSS
- README files
- Git repositories

When secrets are eventually needed, use the appropriate environment variable or hosting secret mechanism.

---

## 35. Do Not Delete User Content

Be especially cautious with deletion.

Never automatically delete:

- Photos
- Videos
- RAW files
- Collections
- Gallery content
- User data

If deletion functionality is implemented later, require explicit user action and appropriate confirmation.

Do not remove real content merely to clean up the codebase.

---

## 36. Backward Compatibility

New features should preserve existing:

- Pages
- Links
- Styles
- Interactions
- Navigation
- Content behavior

whenever possible.

If a breaking change is necessary, explain:

1. Why it is necessary
2. What is affected
3. Which files or features require coordinated updates

---

## 37. Comments

Prefer self-explanatory code.

Add comments only when they provide useful context.

Good:

```js
// Re-initialize reveal observers after dynamic cards are rendered.
```

Unnecessary:

```js
// Create a variable
const workGrid = ...
```

Do not use comments to explain obvious syntax.

---

## 38. Remove Temporary Debugging Code

Before finishing a task, remove temporary debugging code such as:

```js
console.log("test");
console.log("123");
alert("hello");
```

Also remove temporary:

- Debug borders
- Test backgrounds
- Placeholder controls
- Experimental DOM
- Temporary buttons

unless they were explicitly requested.

---

## 39. Avoid Meaningless Magic Values

When a value has clear design meaning and is reused, consider a shared constant or CSS custom property.

Example:

```css
:root {
  --header-height: 72px;
}
```

Do not create variables for every numeric value.

Use judgment.

---

## 40. CSS Custom Properties

If the project already uses:

```css
:root
```

and CSS custom properties, add new global design values to the existing system when appropriate.

Examples:

```css
--page-padding
--text-primary
--text-secondary
--section-gap
```

Do not create duplicate variables representing the same concept.

---

## 41. Keep Design Tokens Consistent

When working with:

- Spacing
- Font sizes
- Border radius
- Transitions
- Container width
- Colors

inspect existing values first.

Avoid arbitrary one-off values unless the design clearly requires them.

The site should feel like one visual system.

---

## 42. Avoid Over-Engineering

The goal is not to demonstrate architectural complexity.

The goal is to build a:

> Stable, elegant, understandable, and maintainable photography website.

Avoid:

- Complex class hierarchies for simple data
- Large abstraction layers for small DOM tasks
- Premature API design
- Dependency injection for simple modules
- Design patterns used only for their own sake

Choose the simplest architecture that clearly solves the current problem.

---

## 43. Code Should Remain Learnable

The project owner is learning Web development through this project.

When multiple solutions are equally valid, prefer the one that is easier to understand.

For example:

```text
Option A:
20 lines of clear JavaScript

Option B:
Advanced abstraction with multiple helpers and indirection
```

Prefer Option A unless Option B solves a real, current problem.

Clarity is a feature.

---

## 44. Post-Implementation Checks

After completing a task, verify at minimum:

### Page behavior

- Page opens correctly
- Layout is intact
- Desktop works
- Mobile works

### CSS

- Existing styles remain intact
- No unexpected overflow
- Hover states work
- Animations work

### JavaScript

- No new console errors
- DOM selectors are correct
- Events are not unintentionally bound multiple times
- Modules load correctly

### Assets

- Images load correctly
- Paths are correct
- Filename case is correct

### Deployment

If the task affects entry points or asset paths:

- Verify GitHub Pages compatibility

---

## 45. Final Response Requirements

After completing a coding task, do not respond only with:

```text
Done.
```

Provide a concise implementation summary.

At minimum include:

### 1. What changed

Summarize the main implementation.

### 2. Files changed

Example:

```text
Modified:
- work.html
- css/style.css
- js/work.js

Added:
- data/works.js
```

### 3. Why the changes were made

Explain the architecture change in beginner-friendly language.

### 4. How to verify

Tell the user:

- Which page to open
- What interaction to test
- What result to expect

### 5. Anything incomplete

If something is not finished, state it clearly.

Do not claim completion when work remains.

---

## 46. Explain Important New Concepts

If a task introduces an important concept such as:

- ES modules
- APIs
- Databases
- `async/await`
- Routing
- Authentication
- CRUD
- `localStorage`
- Servers
- Deployment

briefly explain:

```text
What it is
Why the project needs it now
How it relates to the existing architecture
```

Keep explanations concise but sufficient for learning.

---

## 47. Do Not Hide Problems

If implementation reveals:

- Existing bugs
- Missing files
- Broken image paths
- ROADMAP inconsistencies
- Architecture limitations
- Deployment conflicts

do not pretend the project is healthy.

Use:

> Minimum safe change + clear explanation.

If the issue can be safely fixed within the task scope, fix it.

If it belongs to another task, report it without expanding the current scope.

---

## 48. Instruction Priority

When interpreting project requirements, use this priority:

```text
Current explicit user request
        ↓
Current task prompt
        ↓
AGENTS.md
        ↓
ROADMAP.md
        ↓
Existing project implementation
```

However, if the current task only describes what to build and does not explicitly request a redesign, continue following the preservation rules in this file.

---

## 49. Respect the Current Task Scope

Implement only what the current task requires.

Do not read future roadmap items such as:

```text
database
admin
authentication
upload
CMS
```

and implement them early.

Each development stage should remain:

- Understandable
- Testable
- Reviewable
- Reversible

---

## 50. Final Standard

Every change should aim to satisfy:

```text
Correct functionality
+
Consistent visual design
+
Readable code
+
No regression of existing features
+
Easy continuation into the next development stage
```

If a solution is more technically sophisticated but adds unnecessary complexity, do not prefer it by default.

If a simpler solution is stable, clear, maintainable, and sufficient for the current project stage, prefer the simpler solution.