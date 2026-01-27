# History Articles Feature Design

## Overview

Add a "History" section to PUPPED for articles about sneaker history. Articles can be linked to products, showing a preview on the product page to add context and depth to the shopping experience.

## Database Schema

### New `articles` table

```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_image_id UUID REFERENCES images(id),
  body TEXT NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Modification to `products` table

```sql
ALTER TABLE products ADD COLUMN article_id UUID REFERENCES articles(id);
```

### Relationship

- Each product can optionally link to one article (`article_id` nullable)
- One article can be referenced by many products (many-to-one)

## Navigation

### Header changes

Below the PUPPED logo, add a nav bar with two links:

- **Store** → `/` (current catalog)
- **History** → `/history` (article listing)

Active link highlighted based on current route.

### New public routes

| Route | Purpose |
|-------|---------|
| `/history` | Grid of published articles |
| `/history/[slug]` | Individual article page |

### New admin routes

| Route | Purpose |
|-------|---------|
| `/admin/articles` | List all articles |
| `/admin/articles/new` | Create new article |
| `/admin/articles/[id]` | Edit existing article |

## Page Layouts

### History page (`/history`)

- Grid layout matching the product catalog style
- Cards with cover image and title
- Responsive: 2 columns mobile, 3-4 columns desktop
- Clicking card navigates to `/history/[slug]`

### Article page (`/history/[slug]`)

- Full-width cover image at top
- Large title heading below image
- Body content rendered as HTML
- Back link to `/history`

### Product page update (`/product/[id]`)

When a product has a linked article, show a compact preview above the description:

- Thumbnail image on the left
- Article title on the right
- Entire row clickable, links to full article
- Hidden when no article is linked

## Admin Interface

### Articles list (`/admin/articles`)

Table displaying:
- Cover image thumbnail
- Title
- Published status badge ("Draft" / "Published")
- Edit and Delete actions
- "New Article" button at top

### Article form

Fields:
- **Title** — text input (required)
- **Slug** — text input, auto-generated from title, editable
- **Cover Image** — image upload (reuse existing upload component)
- **Body** — rich text editor (WYSIWYG)
- **Published** — checkbox toggle

### Rich text editor

Use **Tiptap** library:
- Lightweight and React-friendly
- Clean HTML output
- Built-in formatting: headings, bold, italic, lists, links

### Product form update

Add optional field:
- **Related Article** — dropdown select with all published articles + "None" option

## Files to Create

- `src/lib/db/schema.ts` — add articles table definition
- `src/app/history/page.tsx` — history listing page
- `src/app/history/[slug]/page.tsx` — individual article page
- `src/app/admin/(authenticated)/articles/page.tsx` — admin articles list
- `src/app/admin/(authenticated)/articles/new/page.tsx` — create article
- `src/app/admin/(authenticated)/articles/[id]/page.tsx` — edit article
- `src/components/admin/ArticleForm.tsx` — article create/edit form
- `src/components/catalog/ArticleCard.tsx` — card for history grid
- `src/components/catalog/ArticlePreview.tsx` — compact preview for product page
- `src/app/api/articles/route.ts` — GET all, POST create
- `src/app/api/articles/[id]/route.ts` — GET one, PUT update, DELETE

## Files to Modify

- `src/components/catalog/Header.tsx` — add nav links
- `src/components/admin/AdminNav.tsx` — add Articles link
- `src/components/admin/ProductForm.tsx` — add article dropdown
- `src/app/product/[id]/page.tsx` — add article preview section
- `src/lib/db/schema.ts` — add article_id to products

## Dependencies

Add to `package.json`:
- `@tiptap/react` — React integration
- `@tiptap/starter-kit` — basic extensions (bold, italic, headings, etc.)
- `@tiptap/extension-link` — link support
