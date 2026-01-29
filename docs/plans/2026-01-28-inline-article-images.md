# Inline Article Images Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add drag-and-drop inline image insertion to the article Tiptap editor, with images uploaded to R2 and displayed at 80% width, centered, 16:9 aspect ratio.

**Architecture:** A new API endpoint handles image uploads. A custom Tiptap plugin intercepts drop/paste events, uploads images via the endpoint, and inserts `<img>` tags into the editor content. CSS on both admin editor and public article page enforces consistent 80%-width centered 16:9 display.

**Tech Stack:** Next.js 16, Tiptap v3 (@tiptap/extension-image), Cloudflare R2, Drizzle ORM, Zod

**Design doc:** `docs/plans/2026-01-28-inline-article-images-design.md`

---

### Task 1: Install @tiptap/extension-image

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run:
```bash
npm install @tiptap/extension-image
```

**Step 2: Verify installation**

Run:
```bash
npm ls @tiptap/extension-image
```
Expected: Shows `@tiptap/extension-image@3.x.x`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add @tiptap/extension-image dependency"
```

---

### Task 2: Create image upload API endpoint

**Files:**
- Create: `src/app/api/articles/images/route.ts`

This endpoint follows the same patterns as `src/app/api/articles/route.ts` (POST handler with FormData, auth check, R2 upload, image table insert).

**Step 1: Create the endpoint**

Create `src/app/api/articles/images/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/auth/session";
import { uploadImage } from "@/lib/r2/client";

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { key, url } = await uploadImage(
      buffer,
      file.name,
      file.type,
      "articles"
    );

    await db.insert(images).values({
      r2Key: key,
      originalName: file.name,
      mimeType: file.type,
      size: buffer.length,
    });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid file type")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("File too large")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error uploading article image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
```

Notes:
- Auth check uses `isAuthenticated()` from `@/lib/auth/session` (same as other article routes)
- File type/size validation is handled by `uploadImage()` in `@/lib/r2/client` which allows jpeg/png/webp and max 5MB
- The design mentions gif support but the existing R2 client only allows jpeg/png/webp. Keep consistent with existing validation -- no gif.
- Returns `{ url }` which is the full public R2 URL the editor will use in the `<img>` src

**Step 2: Verify build**

Run:
```bash
npm run build
```
Expected: Build succeeds with no type errors

**Step 3: Commit**

```bash
git add src/app/api/articles/images/route.ts
git commit -m "feat: add article inline image upload endpoint"
```

---

### Task 3: Add image extension and drag-and-drop upload to ArticleForm

**Files:**
- Modify: `src/components/admin/ArticleForm.tsx`

This is the main task. We need to:
1. Add `@tiptap/extension-image` to the editor's extensions list
2. Create a custom Tiptap plugin that intercepts `drop` and `paste` events containing image files
3. The plugin uploads the file to `/api/articles/images` and inserts an image node on success
4. Add CSS to style images in the editor at 80% width, centered, 16:9, rounded

**Step 1: Add imports and Image extension**

At the top of `src/components/admin/ArticleForm.tsx`, add the import:

```typescript
import Image from "@tiptap/extension-image";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Extension } from "@tiptap/core";
```

**Step 2: Create the image upload drop plugin**

Add this function before the `ArticleForm` component (after `MenuBar`):

```typescript
function createImageUploadPlugin() {
  return Extension.create({
    name: "imageUpload",

    addProseMirrorPlugins() {
      const uploadAndInsert = async (
        file: File,
        view: import("@tiptap/pm/view").EditorView,
        pos: number
      ) => {
        // Insert placeholder
        const placeholderText = "Uploading image...";
        const { schema } = view.state;
        const placeholder = schema.nodes.paragraph.create(
          null,
          schema.text(placeholderText)
        );
        const tr = view.state.tr.insert(pos, placeholder);
        view.dispatch(tr);

        try {
          const formData = new FormData();
          formData.append("image", file);
          const res = await fetch("/api/articles/images", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Upload failed");
          }

          const { url } = await res.json();

          // Find and replace the placeholder
          let placeholderPos: number | null = null;
          view.state.doc.descendants((node, nodePos) => {
            if (
              placeholderPos === null &&
              node.isText &&
              node.text === placeholderText
            ) {
              placeholderPos = nodePos;
            }
          });

          if (placeholderPos !== null) {
            const parentPos = view.state.doc.resolve(placeholderPos).before(1);
            const imageNode = schema.nodes.image.create({ src: url });
            const replaceTr = view.state.tr.replaceWith(
              parentPos,
              parentPos + placeholder.nodeSize,
              imageNode
            );
            view.dispatch(replaceTr);
          }
        } catch {
          // Remove placeholder on failure
          let placeholderPos: number | null = null;
          view.state.doc.descendants((node, nodePos) => {
            if (
              placeholderPos === null &&
              node.isText &&
              node.text === placeholderText
            ) {
              placeholderPos = nodePos;
            }
          });

          if (placeholderPos !== null) {
            const parentPos = view.state.doc.resolve(placeholderPos).before(1);
            const deleteTr = view.state.tr.delete(
              parentPos,
              parentPos + placeholder.nodeSize
            );
            view.dispatch(deleteTr);
          }
        }
      };

      return [
        new Plugin({
          key: new PluginKey("imageUpload"),
          props: {
            handleDrop(view, event) {
              const files = event.dataTransfer?.files;
              if (!files || files.length === 0) return false;

              const imageFile = Array.from(files).find((f) =>
                f.type.startsWith("image/")
              );
              if (!imageFile) return false;

              event.preventDefault();
              const pos = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              uploadAndInsert(imageFile, view, pos?.pos ?? view.state.selection.from);
              return true;
            },
            handlePaste(view, event) {
              const files = event.clipboardData?.files;
              if (!files || files.length === 0) return false;

              const imageFile = Array.from(files).find((f) =>
                f.type.startsWith("image/")
              );
              if (!imageFile) return false;

              event.preventDefault();
              uploadAndInsert(imageFile, view, view.state.selection.from);
              return true;
            },
          },
        }),
      ];
    },
  });
}
```

**Step 3: Add Image and the upload plugin to editor extensions**

In the `useEditor` call inside `ArticleForm`, update the extensions array:

```typescript
const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
    }),
    Image,
    createImageUploadPlugin(),
  ],
  content: article?.body || "",
  editorProps: {
    attributes: {
      class:
        "prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none",
    },
  },
});
```

**Step 4: Add CSS for inline image styling in the editor**

Add a `<style>` tag inside the ArticleForm return JSX (before the `<form>` element) to style images within the Tiptap editor:

```tsx
return (
  <>
    <style>{`
      .ProseMirror img {
        display: block;
        width: 80%;
        max-width: 80%;
        margin: 1.5rem auto;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: 0.5rem;
      }
    `}</style>
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ... rest of form ... */}
    </form>
  </>
);
```

**Step 5: Verify build**

Run:
```bash
npm run build
```
Expected: Build succeeds with no type errors

**Step 6: Commit**

```bash
git add src/components/admin/ArticleForm.tsx
git commit -m "feat: add drag-and-drop inline image upload to article editor"
```

---

### Task 4: Style inline images on public article page

**Files:**
- Modify: `src/app/history/[slug]/page.tsx`

The article body is rendered via `dangerouslySetInnerHTML` with Tailwind's `prose` classes at line 98-101. We need to add CSS to style `<img>` tags within the article body identically to the editor.

**Step 1: Add inline image styles**

In `src/app/history/[slug]/page.tsx`, add a `<style>` tag before the `<main>` element (inside the root `<div>`):

```tsx
return (
  <div className="min-h-screen bg-white">
    <style>{`
      .article-body img {
        display: block;
        width: 80%;
        max-width: 80%;
        margin: 1.5rem auto;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: 0.5rem;
      }
    `}</style>
    <Header />
    {/* ... rest of page ... */}
```

Then add the `article-body` class to the `<article>` element:

Change line 98-101 from:
```tsx
<article
  className="prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-gray-900 prose-a:underline"
  dangerouslySetInnerHTML={{ __html: article.body }}
/>
```

To:
```tsx
<article
  className="article-body prose prose-lg max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-gray-900 prose-a:underline"
  dangerouslySetInnerHTML={{ __html: article.body }}
/>
```

**Step 2: Verify build**

Run:
```bash
npm run build
```
Expected: Build succeeds with no type errors

**Step 3: Commit**

```bash
git add src/app/history/\\[slug\\]/page.tsx
git commit -m "feat: style inline images on public article page"
```

---

### Task 5: Final verification

**Step 1: Run full build**

Run:
```bash
npm run build
```
Expected: Build succeeds with no errors or warnings

**Step 2: Run lint**

Run:
```bash
npm run lint
```
Expected: No lint errors

**Step 3: Final commit (if any lint fixes needed)**

Only if lint fixes were required.
