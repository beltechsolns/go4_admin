# G4 Delivery — Customer App API Reference

## Base URL & Auth
- **Base URL:** `https://go4-admin.onrender.com/api/v1`
- **Auth:** `Authorization: Bearer <token>` for all endpoints EXCEPT auth, restaurants, categories, and product list/detail.
- **Images:** every image URL in responses is already a full URL (`https://go4-admin.onrender.com/uploads/...` or a Supabase storage URL) — do NOT prefix it on the app side.
- **Cold start:** Render free tier sleeps after ~15 min idle. First request after sleep can take ~30s. The app must show a loader and retry.

## NEW / CHANGED fields

### Restaurants — `GET /restaurants`, `GET /restaurants/:id`
```json
{
  "id": 1,
  "name": "Pizza Palace",
  "type": "Restaurant",
  "description": "Fresh pizza made with local ingredients",
  "location": "Main Street, Shakiso",
  "phone": "+251 911 111 111",
  "image_url": "https://go4-admin.onrender.com/uploads/...",
  "rating": 4.5,
  "reviews_count": 12,
  "is_active": true
}
```

### Products — `GET /products`, `GET /products/:id`, `GET /special-offers`, `GET /restaurants/:id/products`
```json
{
  "id": 1,
  "name": "Margherita Pizza",
  "description": "Admin-set product description",
  "price": 250.00,
  "discount_price": null,
  "image": "https://go4-admin.onrender.com/uploads/...",
  "rating": 4.3,
  "reviews_count": 5,
  "available": true,
  "category_id": 1,
  "store_id": 1
}
```
> `image` and `description` are set from the admin panel and must be rendered by the app.

### Categories — `GET /categories`
Categories are now a **single global list** shared by all restaurants (no per-restaurant categories).
```json
{
  "id": 1,
  "name": "Pizza",
  "icon": "🍕",
  "product_count": 2
}
```
When creating a product, `category_id` refers to this global list.

### Profile avatar
- `POST /profile/avatar` — multipart form, field name `avatar` (jpeg/png/gif, max 10MB). Returns the user object with the new `avatar` URL.
- `PUT /profile/avatar-url` — body `{ "avatar_url": "https://..." }`.

## Full endpoint list (customer app)

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | /auth/register | — | body: name, email, password, phone |
| POST | /auth/login | — | body: email, password |
| GET | /auth/me | ✔ | current user incl. avatar |
| POST | /auth/refresh | ✔ | refresh token |
| POST | /auth/logout | ✔ | |
| POST | /auth/forgot-password | — | sends real email reset link |
| POST | /auth/reset-password | — | body: token, new password |
| POST | /auth/google | — | Google social login |
| POST | /auth/facebook | — | Facebook social login |
| GET | /categories | — | global categories + product_count |
| GET | /products | — | filters: ?category_id, ?store_id, ?search, ?page |
| GET | /products/:id | — | |
| GET | /products/:id/ratings | — | |
| POST | /products/:id/rate | ✔ | body: rating 1–5 |
| GET | /special-offers | — | |
| GET | /cart | ✔ | |
| POST | /cart, /cart/items | ✔ | body: product_id, quantity |
| PUT | /cart/:id, /cart/items/:id | ✔ | update quantity |
| DELETE | /cart/:id, /cart/items/:id | ✔ | |
| DELETE | /cart | ✔ | clear cart |
| POST | /orders | ✔ | items, delivery_address, delivery lat/lng |
| GET | /orders | ✔ | user's orders |
| GET | /orders/delivered | ✔ | |
| GET | /orders/:id | ✔ | |
| GET | /orders/:id/tracking | ✔ | rider live location, distance_km, eta_minutes, arrived |
| PUT | /orders/:id/status | ✔ | |
| PUT | /orders/:id/cancel | ✔ | |
| POST | /orders/:id/rate-driver | ✔ | delivered only; body: rating |
| GET | /profile | ✔ | |
| PUT | /profile | ✔ | body: name, phone |
| POST | /profile/avatar | ✔ | multipart `avatar` |
| PUT | /profile/avatar-url | ✔ | body: avatar_url |
| DELETE | /profile/avatar | ✔ | removes the profile picture |
| GET | /favorites | ✔ | |
| POST | /favorites | ✔ | |
| POST | /favorites/:product_id | ✔ | |
| DELETE | /favorites/:id | ✔ | |
| GET | /locations | ✔ | **customer's saved delivery addresses** |
| POST | /locations | ✔ | body: latitude, longitude, label, address, is_default |
| PUT | /locations/:id | ✔ | |
| DELETE | /locations/:id | ✔ | |
| POST | /location | ✔ | alias of POST /locations |
| PUT | /location/:id | ✔ | alias |
| GET | /address/current | ✔ | default address |
| PUT | /address/current | ✔ | set default; body: latitude, longitude, address |
| GET | /notifications | ✔ | response: { data, unread_count, total } |
| PUT | /notifications/:id/read | ✔ | |
| PUT | /notifications/read-all | ✔ | |
| GET | /restaurants | — | incl. description, image_url |
| GET | /restaurants/:id | — | |
| GET | /restaurants/:id/products | — | |
| PUT | /restaurants/:id/image | ✔ | admin helper |
| POST | /restaurants/:id/rate | ✔ | body: rating 1–5 |
| GET | /rider/dashboard | ✔ rider | |
| GET | /rider/earnings | ✔ rider | |
| PUT | /rider/status | ✔ rider | body: status (online/offline) |
| GET | /rider/orders/available | ✔ rider | |
| GET | /rider/orders/active | ✔ rider | |
| GET | /rider/orders/completed | ✔ rider | |
| GET | /rider/orders/:id | ✔ rider | |
| PUT | /rider/orders/:id/accept | ✔ rider | |
| PUT | /rider/orders/:id/start | ✔ rider | |
| PUT | /rider/orders/:id/complete | ✔ rider | |
| POST | /rider/location | ✔ rider | body: latitude, longitude — **driver live GPS** |
| PUT | /rider/location | ✔ rider | same |

## Important reminders
- **`/locations` = customer saved addresses; `/rider/location` = driver live GPS** — do not confuse.
- Driver status flips via `GET /orders/:id` after the rider accepts; tracking (`GET /orders/:id/tracking`) only returns the rider object after accept and requires the rider app to poll `POST /rider/location`.
- Admin-set product `image` + `description` flow into every product response — the app must render them.
