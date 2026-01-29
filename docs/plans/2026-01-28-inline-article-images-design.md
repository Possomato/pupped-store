# Inline Article Images

## Overview

Add drag-and-drop image insertion to the article Tiptap editor. Images are uploaded to R2 and displayed inline within the article body at 80% content width, centered, with a 16:9 aspect ratio for a classic blog look.

## Upload Flow

1. Author drags an image file into the Tiptap editor
2. Editor intercepts the drop event
3. A loading placeholder appears at the drop position
4. File is uploaded to `POST /api/articles/images` (FormData)
5. Endpoint validates auth, validates file type (jpeg/png/webp/gif), uploads to R2 with `"articles"` prefix, inserts into `images` table
6. On success: placeholder is replaced with the image node at its R2 public URL
7. On failure: placeholder shows error text briefly, then is removed

Paste events with image data are also intercepted using the same flow.

## Image Display

- **Width:** 80% of the content container
- **Alignment:** Always centered
- **Aspect ratio:** 16:9 with `object-cover` cropping
- **Corners:** Rounded (`rounded-lg`)
- **No size presets or alignment options** -- every inline image gets the same treatment

These styles apply both in the admin editor and on the public article page.

## Technical Implementation

### New dependency

- `@tiptap/extension-image`

### New file: `src/app/api/articles/images/route.ts`

`POST` endpoint:
- Accepts FormData with a single `image` file field
- Validates auth via `isAuthenticated()`
- Validates file type (jpeg, png, webp, gif)
- Uploads to R2 using existing `uploadImage()` with `"articles"` prefix
- Inserts record into `images` table
- Returns `{ url: string }` with the R2 public URL

### Modified: `src/components/admin/ArticleForm.tsx`

- Add `@tiptap/extension-image` to editor extensions
- Add custom Tiptap plugin (`Extension.create`) that intercepts `drop` and `paste` events for image files
- Plugin handles: placeholder insertion, upload call, placeholder replacement on success/failure
- Add CSS for editor area: `img` elements styled at 80% width, centered, 16:9 aspect ratio, `object-cover`, `rounded-lg`

### Modified: `src/app/history/[slug]/page.tsx`

- Add CSS targeting `article img` to enforce 80% width, centered, 16:9 aspect ratio, `object-cover`, rounded corners on the public article page

### No schema changes

The existing `images` table is already suitable for storing inline image records.

### No orphan cleanup

Images uploaded then removed from the article body remain in R2 and the `images` table. Cleanup can be added later if needed.
