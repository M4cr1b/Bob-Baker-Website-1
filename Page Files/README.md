# Bob Baker's Bakery Website - Operation Guide

## Overview
Bob Baker's Bakery is a full-featured e-commerce website for a bakery business located in Accra, Ghana. The website allows customers to browse products, add items to cart, and place orders online. It also includes an admin dashboard for managing orders and viewing sales data.

## Table of Contents
- [Getting Started](#getting-started)
- [Website Structure](#website-structure)
- [Customer Features](#customer-features)
- [Admin Features](#admin-features)
- [Configuration](#configuration)
- [File Structure](#file-structure)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A web server (optional - can run locally by opening HTML files directly)
- Internet connection (for Font Awesome icons and Unsplash images)
- n8n webhook URLs configured (for order processing and admin data)

### Running the Website

#### Option 1: Direct File Opening
1. Navigate to the project folder
2. Open `landing.html` in your web browser
3. The website will function, but some features may be limited without a web server

#### Option 2: Using a Local Web Server (Recommended)
1. **Using Python:**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

2. **Using Node.js (http-server):**
   ```bash
   npx http-server -p 8000
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000/landing.html
   ```

---

## Website Structure

### Entry Point
The website starts at **`landing.html`**, which presents a split-screen interface:
- **Left Side (Customer)**: Click to access the customer-facing website
- **Right Side (Admin)**: Click to access the admin login page

### Customer Pages
1. **index.html** - Home page with hero section and navigation
2. **menu.html** - Product catalog showing all available bakery items
3. **contact.html** - Contact form page

### Admin Pages
1. **login.html** - Admin authentication page
2. **admin.html** - Admin dashboard (requires login)

---

## Customer Features

### Browsing Products
1. From the landing page, click **"I am a Customer"**
2. You'll be taken to the home page (`index.html`)
3. Click **"View Menu"** or navigate to **Menu** in the navigation bar
4. Browse available products:
   - Banana Bread (GH₵ 20.00)
   - Coconut Bread (GH₵ 20.00)
   - Pawpaw Bread (GH₵ 20.00)
   - Banapaw Bread (GH₵ 20.00)

### Shopping Cart
1. Click **"Add to Cart"** on any product
2. View your cart by clicking the cart icon in the top-right corner
3. The cart icon shows the total number of items
4. In the cart modal, you can:
   - View all items and quantities
   - Remove items using the trash icon
   - See the total price

### Placing an Order
1. Open your cart (click the cart icon)
2. Fill in the required information:
   - **Your Name**: Enter your full name
   - **Phone Number**: Enter your contact number
   - **Payment Method**: Select either:
     - Cash on Delivery
     - Mobile Money
3. Click **"Checkout"** button
4. Wait for the order to process (you'll see a loading indicator)
5. Upon success, you'll see a confirmation message:
   - "Order Received! You will be called by our staff within 15 mins to confirm and make payment!"
6. Click **"OK, Got it!"** to close the confirmation

### Navigation
- **Home**: Returns to the main page
- **Menu**: View all products
- **Contact**: Access the contact form
- **Cart Icon**: Opens the shopping cart

---

## Admin Features

### Logging In
1. From the landing page, click **"I am an Admin"**
2. You'll be redirected to the login page (`login.html`)
3. Enter your admin credentials (set in Vercel environment variables)
4. Click **"Sign In"**
5. Wait for authentication (loading animation will appear)
6. You'll be redirected to the admin dashboard

### Admin Dashboard
The dashboard (`admin.html`) provides:

#### Statistics Overview
- **Total Orders Today**: Number of orders received
- **Total Revenue**: Total sales amount in GH₵
- **Low Stock Alerts**: Items that need restocking

#### Order Management
1. Click **"Refresh Data"** button to load orders from the n8n system
2. View the orders table with:
   - Order ID
   - Customer Name
   - Items Ordered
   - Status (Pending, Baked, Delivered)
   - Action icons (View/Edit)

#### Logging Out
- Click the logout icon (door icon) in the top-right corner
- You'll be redirected back to the login page

### Security
- Admin pages are protected - unauthorized access redirects to login
- Session-based authentication (stored in browser sessionStorage)
- Login status persists until browser is closed or logout is clicked

---

## Configuration

### n8n Webhook URLs
The website integrates with n8n for order processing. All webhook URLs are stored securely as **Vercel Environment Variables** and proxied through serverless API routes in the `/api/` directory.

**To configure:**
1. Go to your Vercel project settings → Environment Variables
2. Add all variables listed in `.env.example`
3. Redeploy

### Admin Credentials
Admin credentials are stored as Vercel environment variables (`ADMIN_USERNAME` and `ADMIN_PASSWORD`). They are never exposed in frontend code.

### Products
Products are defined in `script.js`. To add or modify products:

1. Open `script.js`
2. Find the `products` array
3. Add/modify product objects:
```javascript
{
    id: 5,
    name: "New Product Name",
    price: 25.00,
    image: "https://image-url-here"
}
```

---

## File Structure

```
Bob_Baker_Website/
│
├── landing.html          # Entry point - role selection page
├── index.html            # Customer home page
├── menu.html             # Product catalog page
├── contact.html          # Contact form page
├── login.html            # Admin login page
├── admin.html            # Admin dashboard
├── style.css             # Main stylesheet
├── script.js             # JavaScript functionality
├── README.md             # This file
└── .gitattributes        # Git configuration
```

### Key Files Explained

- **landing.html**: Entry point with split-screen customer/admin selection
- **index.html**: Main customer-facing homepage
- **menu.html**: Product listing page (uses same cart functionality)
- **contact.html**: Contact form (currently display-only)
- **login.html**: Admin authentication interface
- **admin.html**: Admin dashboard with order management
- **script.js**: Contains all JavaScript logic:
  - Cart management
  - Order submission
  - Admin authentication
  - n8n integration
- **style.css**: All styling and responsive design

---

## Troubleshooting

### Orders Not Submitting
- **Check n8n webhook URL**: Verify the `N8N_ORDER_WEBHOOK` in `script.js` is correct
- **Check browser console**: Open Developer Tools (F12) and look for error messages
- **Verify internet connection**: Orders require connection to n8n server
- **Check required fields**: Ensure name, phone, and payment method are filled

### Admin Dashboard Not Loading Orders
- **Click "Refresh Data"**: Orders don't auto-load on first visit
- **Check n8n webhook**: Verify `N8N_ADMIN_DATA_WEBHOOK` is correct
- **Check browser console**: Look for fetch errors
- **Verify n8n workflow**: Ensure your n8n workflow returns JSON array format

### Cart Not Persisting
- Cart data is stored in browser's localStorage
- Clearing browser data will reset the cart
- Cart persists across page navigation within the same browser session

### Login Not Working
- Verify credentials match the values set in your Vercel environment variables (`ADMIN_USERNAME` and `ADMIN_PASSWORD`)
- Check browser console for JavaScript errors
- Ensure `script.js` is loaded properly
- Ensure the `/api/auth` serverless function is deployed

### Images Not Loading
- Images are loaded from Unsplash (external CDN)
- Requires internet connection
- If images fail, check internet connectivity

### Styling Issues
- Ensure `style.css` is in the same directory
- Check that Font Awesome CDN is accessible
- Clear browser cache and reload

---

## Technical Details

### Data Storage
- **Cart**: Stored in browser `localStorage` as `bakeryCart`
- **Login Status**: Stored in `sessionStorage` as `isLoggedIn`
- **Orders**: Sent to n8n webhook (server-side storage)

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design works on mobile and desktop

### Dependencies
- **Font Awesome 6.0.0**: Icons (loaded from CDN)
- **Unsplash Images**: Product images (loaded from CDN)
- **n8n**: Backend automation (webhook integration)

---

## Support

For issues or questions:
- **Location**: Next to GCTU, Tesano branch, Accra, Ghana
- **Phone**: +233 54 812 6480
- **Contact Page**: Use the contact form on the website

---

## Notes

- The contact form on `contact.html` is currently display-only (no backend submission)
- Product images are loaded from external sources (Unsplash)
- Admin credentials are hardcoded - change before production deployment
- The website uses sessionStorage for admin authentication (clears on browser close)

---

**Last Updated**: 2025
**Version**: 1.0
