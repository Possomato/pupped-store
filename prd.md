# Product Description
A single-catalog ecommerce site for selling exclusive sneakers. The brand name is "PUPPED" and the logo is this name in Cambria italic font. Hosted on Vercel with Neon (Postgres) as the data store. No user accounts or checkout: product pages show images, descriptions, available sizes and a contact form (Instagram handle or WhatsApp) that saves to Neon and notifies the owner by email. Admin area (protected by a single password stored in an environment variable) allows CRUD for listings and image uploads. Images are stored in Cloudflare R2 with metadata in Neon.  Emphasis on responsive Apple-like design and security/maintenance best practices.

# Key features
Users should be able to…
1. Deploy site on Vercel with Neon Postgres backend
2. Access admin area via single env-configured password
3. Admin create, read, update, delete product listings
4. Upload and store product images in Neon with metadata
5. Browse public single catalog and view product pages
6. Filter catalog by available size
7. Submit contact form (Instagram or WhatsApp) on product pages
8. Receive email notifications for form submissions
9. Owner access to backups, logs, and security settings

# User Stories

## 1. Deploy site on Vercel with Neon Postgres backend
- As an owner, I want the app deployable to Vercel so it is serverless.
- As a dev, I want Neon Postgres as DB so data is persisted.
- As a dev, I want env var configuration so secrets stay out of repo.

## 2. Access admin area via single env-configured password
- As the owner, I want admin login by password so access is simple.
- As a developer, I want password read from env so it cannot be changed via UI.
- As an owner, I want login attempt limits so brute force is reduced.

## 3. Admin create, read, update, delete product listings
- As the owner, I want to create product listings so I can sell sneakers.
- As the owner, I want to edit listings so I can update descriptions and prices.
- As the owner, I want to delete listings so I can remove sold items.

## 4. Upload and store product images in Neon with metadata
- As the owner, I want to upload images so products show photos.
- As a developer, I want to save images to R2 with unique filenames and metadata in Neon so retrieval is deterministic.
- As a dev, I want image validation so uploads are safe and small.

## 5. Browse public single catalog and view product pages
- As a visitor, I want to see all products in the catalog so I can browse.
- As a visitor, I want to open a product page so I can view details and photos.
- As a visitor, I want responsive layout so site works on mobile.

## 6. Filter catalog by available size
- As a visitor, I want to filter by size so I see only available options.
- As a visitor, I want clear filter state so I know which size is active.

## 7. Submit contact form (Instagram or WhatsApp) on product pages
- As a visitor, I want to submit my Instagram so the owner can contact me.
- As a visitor, I want to submit my WhatsApp so the owner can contact me.
- As a dev, I want form input validated so saved data is clean.

## 8. Receive email notifications for form submissions
- As the owner, I want immediate email notifications so I can follow up quickly.
- As the owner, I want submission records in DB so I can view history.

## 9. Owner access to backups, logs, and security settings
- As the owner, I want automated DB backups so data can be restored.
- As the owner, I want access logs so I can monitor suspicious activity.
- As a dev, I want environment and deployment docs so maintenance is straightforward.

# User Journeys

## Feature 1 — Deploy site on Vercel with Neon Postgres backend

### As an owner, I want the app deployable to Vercel so it is serverless.
GIVEN a project repository with Next.js app
AND Vercel account linked
WHEN the repo is pushed to main
THEN Vercel builds and deploys the site
AND the site is reachable at the Vercel URL

### As a dev, I want Neon Postgres as DB so data is persisted.
GIVEN Neon Postgres database provisioned
AND DATABASE_URL is set in Vercel env vars
WHEN the app runs migrations on startup
THEN tables are created in Neon and the app connects successfully

### As a dev, I want env var configuration so secrets stay out of repo.
GIVEN required secrets (ADMIN_PASS, DATABASE_URL, SMTP_* ) exist in Vercel env
WHEN the app starts on Vercel
THEN the app reads secrets from process.env
AND no secrets are present in the git repository

### As a dev, I want Cloudflare R2 configured so images are stored externally.
GIVEN R2 bucket is provisioned
AND R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT are set in Vercel env vars
WHEN the app uploads an image
THEN the image is stored in R2 and a public URL is returned

## Feature 2 — Access admin area via single env-configured password

### As the owner, I want admin login by password so access is simple.
GIVEN the owner opens /admin
AND ADMIN_PASS is configured as env var
WHEN the owner submits the correct password
THEN the owner is authenticated for the admin session
AND admin UI is displayed

### As a developer, I want password read from env so it cannot be changed via UI.
GIVEN ADMIN_PASS is set in Vercel env
WHEN login attempt compares submitted password with env value
THEN only matches succeed and no UI exists to change it

### As an owner, I want login attempt limits so brute force is reduced.
GIVEN multiple failed login attempts from same IP
WHEN attempts exceed the configured threshold
THEN further attempts are temporarily blocked and logged

## Feature 3 — Admin create, read, update, delete product listings

### As the owner, I want to create product listings so I can sell sneakers.
GIVEN owner is authenticated in admin
WHEN they fill title, description, sizes, price and upload images and submit
THEN a product record is created in Neon with associated image metadata

### As the owner, I want to edit listings so I can update descriptions and prices.
GIVEN owner opens an existing product in admin
WHEN they change fields and save
THEN the product record updates and the public page shows changes

### As the owner, I want to delete listings so I can remove sold items.
GIVEN owner views a product in admin
WHEN they click "Delete" and confirm
THEN the product record is removed (or flagged archived) and images are retained or removed per retention policy

## Feature 4 — Upload and store product images in Neon with metadata

### As the owner, I want to upload images so products show photos.
GIVEN owner is on product create/edit page
WHEN they choose image files and submit
THEN images are validated and saved into Neon (bytea) with metadata rows

### As a developer, I want to save images with unique filenames and metadata so retrieval is deterministic.
GIVEN an uploaded file has been accepted
WHEN the server stores it
THEN it generates a unique ID/hash, uploads binary to R2, and writes metadata (original name, mime, size, product_id, R2 key) to Neon

### As a dev, I want image validation so uploads are safe and small.
GIVEN an image upload request
WHEN the server checks file type and size
THEN it rejects files not matching allowed types or exceeding max size and returns validation errors

## Feature 5 — Browse public single catalog and view product pages

### As a visitor, I want to see all products in the catalog so I can browse.
GIVEN the visitor opens the home/catalog page
WHEN the page loads
THEN all active products are listed with thumbnail, title, price, and sizes

### As a visitor, I want to open a product page so I can view details and photos.
GIVEN visitor clicks a product card
WHEN the product page loads
THEN full images, description, sizes, and contact form are shown

### As a visitor, I want responsive layout so site works on mobile.
GIVEN visitor opens the site on any viewport
WHEN they navigate pages
THEN layout adapts and remains usable on mobile and desktop

## Feature 6 — Filter catalog by available size

### As a visitor, I want to filter by size so I see only available options.
GIVEN catalog contains products with size arrays
WHEN visitor selects size filter (e.g., 42)
THEN the catalog updates showing only products with size 42 available

### As a visitor, I want clear filter state so I know which size is active.
GIVEN a filter is applied
WHEN the page displays filtered results
THEN the active filter is visually highlighted and removable

## Feature 7 — Submit contact form (Instagram or WhatsApp) on product pages

### As a visitor, I want to submit my Instagram so the owner can contact me.
GIVEN visitor is on a product page
WHEN they enter @instagram and optional message and submit
THEN the submission is saved to Neon and an email notification is queued

### As a visitor, I want to submit my WhatsApp so the owner can contact me.
GIVEN visitor provides WhatsApp number and message
WHEN they submit the form
THEN data is validated (format) and saved to Neon; visitor sees a success confirmation

### As a dev, I want form input validated so saved data is clean.
GIVEN a form submission
WHEN server-side validation runs
THEN invalid inputs are rejected and errors returned to the visitor

## Feature 8 — Receive email notifications for form submissions

### As the owner, I want immediate email notifications so I can follow up quickly.
GIVEN a form submission is saved
WHEN the server triggers notification
THEN an email is sent to OWNER_EMAIL with submission details

### As the owner, I want submission records in DB so I can view history.
GIVEN submissions exist in Neon
WHEN owner opens admin "Submissions" list
THEN they see sortable records with contact, product reference, timestamp, and status

## Feature 9 — Owner access to backups, logs, and security settings

### As the owner, I want automated DB backups so data can be restored.
GIVEN Neon automated backups are configured
WHEN backups run per schedule
THEN backups are stored and recovery procedures documented

### As the owner, I want access logs so I can monitor suspicious activity.
GIVEN logging is enabled
WHEN admin views logs or alerts
THEN recent auth attempts and errors are visible for review

### As a dev, I want environment and deployment docs so maintenance is straightforward.
GIVEN project repo
WHEN a developer reads the README and docs
THEN they find setup, env var list, migration commands, and deployment steps

