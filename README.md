# Bob Baker's Bakery

An e-commerce website for a bakery business in Accra, Ghana. Customers can browse artisan bread products, add items to their cart, and place orders online. Includes a full admin dashboard for order management, inventory tracking, and sales reporting.

## Live Features

**Storefront**
- Product catalog with 6 artisan bread varieties (GHC 20 each)
- Shopping cart with add/remove, quantity display, and checkout
- Real-time stock availability — low stock warnings and sold-out blocking
- Email field at checkout for pickup notifications
- Contact form
- Mobile-responsive design

**Admin Dashboard** (`/login.html`)
- Order management with status updates (Pending → Ready → Cancelled)
- Product inventory with stock levels, low stock alerts, and inline editing
- Sales reports with daily/weekly/monthly/yearly charts
- Search and filter across orders

**Backend (n8n)**
- Order submission → Google Sheets + admin email notification
- Status update → customer email notification when order is ready
- Inventory auto-decrement on confirmed orders
- Inventory auto-restore on cancelled orders

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, Tailwind CSS (CDN), vanilla JavaScript |
| Icons | Font Awesome 6 |
| Backend | n8n workflow automation (webhooks) |
| Database | Google Sheets |
| Email | Gmail (via n8n) |
| Hosting | Vercel (static + serverless functions) |
| Auth | Server-side credential check via `/api/auth` |

## Project Structure

```
├── Page Files/              # All frontend pages
│   ├── index.html           # Storefront (home + menu + contact)
│   ├── login.html           # Admin login
│   ├── admin.html           # Dashboard overview
│   ├── admin-orders.html    # Order management
│   ├── admin-inventory.html # Inventory management
│   ├── admin-reports.html   # Sales reports & charts
│   └── script.js            # All frontend logic
├── api/                     # Vercel serverless functions
│   ├── auth.js              # Login verification
│   ├── order.js             # Proxy → n8n order webhook
│   ├── admin-data.js        # Proxy → n8n admin data webhook
│   ├── update-status.js     # Proxy → n8n status update webhook
│   ├── contact.js           # Proxy → n8n contact webhook
│   ├── inventory.js         # Proxy → n8n inventory read webhook
│   └── inventory-update.js  # Proxy → n8n inventory update webhook
├── brand_assets/            # Logo and flyer
│   ├── Logo.jpeg            # Bakery logo (also used as favicon)
│   └── Flyer.jpeg
├── vercel.json              # Vercel routing config
├── .env.example             # Required environment variables template
├── .gitignore
└── serve.mjs                # Local dev server (port 3001)
```

## Setup

### Local Development

```bash
npm install
node serve.mjs
# Open http://localhost:3001/Page Files/index.html
```

### Deploy to Vercel

1. Push this repo to GitHub
2. Import into Vercel
3. Add these **Environment Variables** in Vercel project settings:

| Variable | Description |
|----------|-------------|
| `N8N_ORDER_WEBHOOK` | n8n webhook URL for order submissions |
| `N8N_ADMIN_DATA_WEBHOOK` | n8n webhook URL for fetching admin/order data |
| `N8N_UPDATE_STATUS_WEBHOOK` | n8n webhook URL for updating order status |
| `N8N_CONTACT_WEBHOOK` | n8n webhook URL for contact form |
| `N8N_INVENTORY_WEBHOOK` | n8n webhook URL for reading inventory |
| `N8N_INVENTORY_UPDATE_WEBHOOK` | n8n webhook URL for updating inventory |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |

4. Deploy

All webhook URLs and credentials are kept server-side in Vercel environment variables — nothing is exposed in the frontend code.

## Security

- All n8n webhook URLs are proxied through `/api/` serverless functions — never exposed to the browser
- Admin credentials are verified server-side via `/api/auth` — not stored in frontend JavaScript
- Session-based admin access using `sessionStorage` (clears on browser close)
- `.gitignore` excludes `.env`, `node_modules`, and temporary files

## Brand

- **Colors**: Maroon `#6B1D2A`, Gold `#D4A017`, Cream `#FFFDF7`
- **Location**: GCTU, Tesano, Accra, Ghana
- **Phone**: +233 54 812 6480
- **Email**: bobbakersbakery@gmail.com
