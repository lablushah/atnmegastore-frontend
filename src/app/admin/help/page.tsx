'use client';

import { useState, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronUp,
  Share2, Mail, ShoppingBag, Package, Settings, BookOpen, ClipboardList,
} from 'lucide-react';

type Article = {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  body: React.ReactNode;
};

const CATEGORIES = [
  { key: 'all',          label: 'All Topics' },
  { key: 'social',       label: 'Social Media' },
  { key: 'email',        label: 'Email & Campaigns' },
  { key: 'products',     label: 'Products' },
  { key: 'orders',       label: 'Orders & Sales' },
  { key: 'tasks',        label: 'Task Board' },
  { key: 'settings',     label: 'Settings' },
];

const CAT_ICONS: Record<string, React.ElementType> = {
  social:   Share2,
  email:    Mail,
  products: ShoppingBag,
  orders:   Package,
  tasks:    ClipboardList,
  settings: Settings,
};

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3 mb-2">
      <span className="shrink-0 w-6 h-6 rounded-full bg-[#213885] text-white text-xs font-bold flex items-center justify-center mt-0.5">{n}</span>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return (
    <div className="mt-3 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs text-amber-800 leading-relaxed">
      <strong>Note:</strong> {text}
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="mt-3 bg-blue-50 border border-blue-200 rounded px-3 py-2 text-xs text-blue-800 leading-relaxed">
      <strong>Tip:</strong> {text}
    </div>
  );
}

function H({ text }: { text: string }) {
  return <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mt-4 mb-2">{text}</p>;
}

const ARTICLES: Article[] = [
  // ─── SOCIAL MEDIA ───────────────────────────────────────────────────────────
  {
    id: 'facebook-page-id',
    category: 'social',
    title: 'How to find your Facebook Page ID',
    keywords: ['facebook', 'page id', 'social', 'meta'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Your Facebook Page ID is required to post updates directly to your Facebook page from the admin dashboard.</p>
        <H text="Method 1 — From your Page's About section" />
        <Step n={1} text='Go to facebook.com and open your ATN Book & Crafts Facebook Page.' />
        <Step n={2} text='Click "About" in the left menu.' />
        <Step n={3} text='Scroll down to the "Page transparency" section.' />
        <Step n={4} text='Your Page ID is the long number displayed there (e.g. 123456789012345).' />
        <H text="Method 2 — From the Page URL" />
        <Step n={1} text='Open your Facebook Page in a browser.' />
        <Step n={2} text='Look at the URL. If it shows a number (e.g. facebook.com/123456789), that number is your Page ID.' />
        <Step n={3} text='If the URL shows a name (e.g. facebook.com/atnmegastore), go to About → Page transparency to find the numeric ID.' />
        <H text="Where to enter it in the admin" />
        <Step n={1} text='Go to Admin → Site Settings → Social API tab.' />
        <Step n={2} text='Paste your Page ID into the "Facebook Page ID" field.' />
        <Step n={3} text='Also paste your Facebook Access Token (see the next article for how to get this).' />
        <Note text="The Page ID is different from your personal profile ID. Make sure you are looking at the Page, not your personal account." />
      </div>
    ),
  },
  {
    id: 'facebook-access-token',
    category: 'social',
    title: 'How to get a Facebook Page Access Token',
    keywords: ['facebook', 'access token', 'api', 'meta', 'graph'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">A Page Access Token allows the dashboard to post on behalf of your Facebook Page using Meta's Graph API.</p>
        <H text="Step 1 — Create a Meta App" />
        <Step n={1} text='Go to developers.facebook.com and log in with the account that manages your Page.' />
        <Step n={2} text='Click "My Apps" → "Create App".' />
        <Step n={3} text='Select "Business" as the app type and follow the setup wizard.' />
        <H text="Step 2 — Add the Pages API product" />
        <Step n={1} text='Inside your new app, click "Add Product" and choose "Facebook Login" or "Pages API".' />
        <Step n={2} text='Under "Facebook Login" settings, add your site URL to the Valid OAuth Redirect URIs.' />
        <H text="Step 3 — Generate a Page Access Token" />
        <Step n={1} text='Go to the Graph API Explorer at developers.facebook.com/tools/explorer.' />
        <Step n={2} text='Select your app from the dropdown at the top right.' />
        <Step n={3} text='Click "Generate Access Token" and grant the permissions: pages_manage_posts, pages_read_engagement.' />
        <Step n={4} text='Click the "Get Page Access Token" option and select your ATN Book & Crafts page.' />
        <Step n={5} text='Copy the generated token.' />
        <H text="Step 4 — Save in admin" />
        <Step n={1} text='Go to Admin → Site Settings → Social API tab.' />
        <Step n={2} text='Paste the token into "Facebook Access Token" and save.' />
        <Note text="Free access tokens expire after 60 days. For a permanent token, use the Token Debugger at developers.facebook.com/tools/debug/accesstoken to extend it to a long-lived token." />
      </div>
    ),
  },
  {
    id: 'instagram-business',
    category: 'social',
    title: 'How to connect Instagram Business Account',
    keywords: ['instagram', 'business', 'account', 'social', 'meta', 'account id'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Instagram posting requires an Instagram Business or Creator account linked to your Facebook Page.</p>
        <H text="Step 1 — Convert Instagram to a Business Account" />
        <Step n={1} text='Open the Instagram app and go to your profile.' />
        <Step n={2} text='Tap the hamburger menu (☰) → Settings → Account.' />
        <Step n={3} text='Tap "Switch to Professional Account" → choose "Business".' />
        <Step n={4} text='Follow the prompts and connect it to your ATN Book & Crafts Facebook Page.' />
        <H text="Step 2 — Find your Instagram Account ID" />
        <Step n={1} text='Go to the Graph API Explorer at developers.facebook.com/tools/explorer.' />
        <Step n={2} text='Using your Facebook Page Access Token, make a GET request to: /me/accounts' />
        <Step n={3} text='In the result, find your page, then make another request to: /{page-id}?fields=instagram_business_account' />
        <Step n={4} text='The "id" field inside "instagram_business_account" is your Instagram Account ID.' />
        <H text="Step 3 — Save in admin" />
        <Step n={1} text='Go to Admin → Site Settings → Social API tab.' />
        <Step n={2} text='Enter your Instagram Account ID and save.' />
        <Tip text="Instagram posts with images get significantly higher engagement. When creating a social post in the dashboard, always attach an image for Instagram." />
        <Note text="Instagram only allows posting with an image (photo posts). Text-only posts will not be sent to Instagram even if Instagram is selected." />
      </div>
    ),
  },
  {
    id: 'twitter-api',
    category: 'social',
    title: 'How to create Twitter / X API credentials',
    keywords: ['twitter', 'x', 'api', 'key', 'secret', 'access token', 'social'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Four credentials are needed: API Key, API Secret, Access Token, and Access Token Secret.</p>
        <H text="Step 1 — Apply for a Developer Account" />
        <Step n={1} text='Go to developer.twitter.com (or developer.x.com) and sign in.' />
        <Step n={2} text='Click "Sign up" to apply for a developer account. You will need to describe your use case (e.g. "posting product updates and promotions for a retail store").' />
        <Step n={3} text='Wait for approval — this usually takes a few minutes to a few hours.' />
        <H text="Step 2 — Create a Project and App" />
        <Step n={1} text='Once approved, go to the Developer Portal Dashboard.' />
        <Step n={2} text='Click "New Project", give it a name (e.g. ATN Book & Crafts), and select a use case.' />
        <Step n={3} text='Inside the project, click "New App" and give it a name.' />
        <H text="Step 3 — Get your API Keys" />
        <Step n={1} text='Inside your app, go to the "Keys and Tokens" tab.' />
        <Step n={2} text='Copy the "API Key" and "API Key Secret" (also called Consumer Key/Secret).' />
        <Step n={3} text='Under "Access Token and Secret", click "Generate" — copy both values immediately as they are only shown once.' />
        <H text="Step 4 — Set App Permissions" />
        <Step n={1} text='Go to your App settings → "User authentication settings".' />
        <Step n={2} text='Set App permissions to "Read and Write".' />
        <Step n={3} text='Regenerate your Access Token after changing permissions.' />
        <H text="Step 5 — Save in admin" />
        <Step n={1} text='Go to Admin → Site Settings → Social API tab.' />
        <Step n={2} text='Enter all four values: API Key, API Secret, Access Token, Access Token Secret.' />
        <Note text="Twitter/X free tier allows up to 1,500 tweets per month. The dashboard stays well within this limit for normal store activity." />
      </div>
    ),
  },
  {
    id: 'social-test-mode',
    category: 'social',
    title: 'Understanding Social Media Test Mode',
    keywords: ['test mode', 'social', 'simulate', 'facebook', 'instagram', 'twitter'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Test Mode lets you practise creating and "publishing" social posts without sending anything to real platforms.</p>
        <H text="How Test Mode works" />
        <p className="text-sm text-gray-700 mb-3">When Test Mode is ON, clicking "Publish" in the Social Posts page shows a success message and saves the post as published — but no actual API call is made to Facebook, Instagram, or Twitter/X. This is safe for training employees.</p>
        <H text="Enabling / disabling Test Mode" />
        <Step n={1} text='Go to Admin → Site Settings → Social API tab.' />
        <Step n={2} text='Toggle the "Social Test Mode" switch.' />
        <Step n={3} text='Save settings.' />
        <H text="When to use Test Mode" />
        <p className="text-sm text-gray-700">Keep Test Mode ON while you are setting up credentials or training staff. Turn it OFF when you are ready to post to your live social media accounts.</p>
        <Tip text="A yellow banner on the Social Posts page reminds you when Test Mode is active so you never accidentally leave it on." />
      </div>
    ),
  },

  // ─── EMAIL & CAMPAIGNS ───────────────────────────────────────────────────────
  {
    id: 'send-campaign',
    category: 'email',
    title: 'How to create and send an email campaign',
    keywords: ['campaign', 'email', 'newsletter', 'send', 'broadcast'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Email campaigns are sent to all newsletter subscribers. Use them for promotions, new arrivals, and events.</p>
        <H text="Creating a campaign" />
        <Step n={1} text='Go to Admin → Email Campaigns → New Campaign.' />
        <Step n={2} text='Enter a subject line (this is what subscribers see in their inbox).' />
        <Step n={3} text='Use the block builder to add content: headings, text, images, product cards, buttons, and dividers.' />
        <Step n={4} text='To add a product, drag a "Products" block and use the search to pick a product — its image, name, and price fill in automatically.' />
        <Step n={5} text='Preview your email before sending.' />
        <H text="Sending the campaign" />
        <Step n={1} text='Click "Send Campaign" — you will be asked to confirm.' />
        <Step n={2} text='The email is sent to all active subscribers via Brevo.' />
        <Step n={3} text='After sending, check Brevo dashboard → Transactional → Email Logs to confirm delivery.' />
        <Note text="There is no undo after sending. Always preview carefully and double-check the subject line before confirming." />
        <Tip text="Best days to send: Tuesday, Wednesday, or Thursday mornings get the highest open rates for retail stores." />
      </div>
    ),
  },
  {
    id: 'manage-subscribers',
    category: 'email',
    title: 'Managing newsletter subscribers',
    keywords: ['subscriber', 'newsletter', 'unsubscribe', 'email list'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Subscribers are customers who signed up via the newsletter form on the storefront or popup.</p>
        <H text="Viewing subscribers" />
        <Step n={1} text='Go to Admin → Subscribers.' />
        <Step n={2} text='The list shows all active subscribers with their email and signup date.' />
        <H text="Removing a subscriber" />
        <Step n={1} text='Find the subscriber in the list.' />
        <Step n={2} text='Click the delete icon next to their email.' />
        <Step n={3} text='Confirm deletion.' />
        <H text="How customers unsubscribe" />
        <p className="text-sm text-gray-700">Every campaign email contains an unsubscribe link at the bottom. Clicking it removes the subscriber automatically — no action needed from you.</p>
        <Note text="Never manually add emails to this list without consent. Only import emails from people who have explicitly opted in." />
      </div>
    ),
  },

  // ─── PRODUCTS ────────────────────────────────────────────────────────────────
  {
    id: 'add-product',
    category: 'products',
    title: 'How to add a new product',
    keywords: ['product', 'add', 'new', 'create', 'upload', 'image'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Products can be books, gift items, or any other item sold in the store.</p>
        <Step n={1} text='Go to Admin → Products → Add Product (top right button).' />
        <Step n={2} text='Fill in the product name (English). Optionally add a secondary name in Bengali or Arabic.' />
        <Step n={3} text='Select a category. For books, choose the appropriate genre under Bengali or English.' />
        <Step n={4} text='Enter the price in CAD and the stock quantity.' />
        <Step n={5} text='Upload a product image (JPEG or PNG, square images look best).' />
        <Step n={6} text='Optionally add a description and author name.' />
        <Step n={7} text='Toggle "Active" to make it visible on the storefront.' />
        <Step n={8} text='Toggle "Featured" to show it in the homepage featured section.' />
        <Step n={9} text='Click Save.' />
        <Tip text="Images are automatically resized. For best quality, upload images at least 600×600 pixels." />
        <Note text="The product slug is auto-generated from the name. If you change the name later, the slug does not change automatically — customers with saved links won't get a broken page." />
      </div>
    ),
  },
  {
    id: 'stock-management',
    category: 'products',
    title: 'Managing stock and low-stock alerts',
    keywords: ['stock', 'inventory', 'low stock', 'out of stock', 'quantity'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Stock is tracked automatically. When an order is placed, the stock count decreases.</p>
        <H text="Updating stock" />
        <Step n={1} text='Go to Admin → Products and find the product.' />
        <Step n={2} text='Click Edit and update the Stock field.' />
        <Step n={3} text='Save.' />
        <H text="Low-stock alerts" />
        <p className="text-sm text-gray-700 mb-2">The dashboard shows a "Low Stock" count for products with 5 or fewer units remaining. Click it to see the full list.</p>
        <H text="Out-of-stock products" />
        <p className="text-sm text-gray-700">When stock reaches 0, the product's "Add to Cart" button is automatically disabled on the storefront. The product remains visible but cannot be purchased until you restock it.</p>
        <Tip text="Set stock to a high number (e.g. 9999) for print-on-demand or always-available items." />
      </div>
    ),
  },

  // ─── ORDERS ──────────────────────────────────────────────────────────────────
  {
    id: 'process-orders',
    category: 'orders',
    title: 'Processing and updating orders',
    keywords: ['order', 'status', 'process', 'ship', 'deliver', 'pending'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Orders flow through statuses: Awaiting Payment → Pending → Paid → Shipped → Delivered.</p>
        <H text="Viewing new orders" />
        <Step n={1} text='Go to Admin → Orders. New orders appear at the top.' />
        <Step n={2} text='Click an order to see full details: items, customer info, delivery address, payment method.' />
        <H text="Updating order status" />
        <Step n={1} text='Open the order and find the Status dropdown.' />
        <Step n={2} text='Select the new status (e.g. "Shipped") and click Update.' />
        <Step n={3} text='The customer automatically receives an email notification with the new status.' />
        <H text="Order status meanings" />
        <div className="space-y-1 text-sm text-gray-700">
          <p><strong>Awaiting Payment</strong> — e-Transfer or Pay at Store orders waiting for payment confirmation.</p>
          <p><strong>Pending</strong> — Payment received, order not yet processed.</p>
          <p><strong>Paid</strong> — Confirmed paid, being prepared.</p>
          <p><strong>Shipped</strong> — Dispatched to customer.</p>
          <p><strong>Delivered</strong> — Customer has received the order.</p>
          <p><strong>Cancelled</strong> — Order was cancelled.</p>
        </div>
        <Note text="For e-Transfer orders, verify the payment in your bank account before changing status from Awaiting Payment to Pending or Paid." />
      </div>
    ),
  },
  {
    id: 'discount-codes',
    category: 'orders',
    title: 'Creating and managing discount codes',
    keywords: ['discount', 'promo', 'coupon', 'code', 'percentage', 'fixed'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Discount codes can be a percentage off or a fixed dollar amount, with optional expiry and usage limits.</p>
        <Step n={1} text='Go to Admin → Discount Codes → Add Code.' />
        <Step n={2} text='Enter a code (e.g. SUMMER20). Codes are case-insensitive for customers.' />
        <Step n={3} text='Choose type: "Percentage" (e.g. 20% off) or "Fixed" (e.g. $10 off).' />
        <Step n={4} text='Enter the discount value.' />
        <Step n={5} text='Optionally set: Minimum order amount, Expiry date, Maximum uses.' />
        <Step n={6} text='Toggle Active and save.' />
        <H text="How customers use it" />
        <p className="text-sm text-gray-700">At checkout, customers enter the code in the "Discount Code" field. The discount is applied to the order total before shipping.</p>
        <Tip text="For a grand opening or event, create a short, memorable code and share it on social media. Set an expiry date so it doesn't run indefinitely." />
      </div>
    ),
  },
  {
    id: 'gift-cards',
    category: 'orders',
    title: 'Activating and managing gift cards',
    keywords: ['gift card', 'activate', 'void', 'balance', 'code'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Gift cards purchased via Interac e-Transfer or Pay at Store need manual activation after payment is confirmed.</p>
        <H text="Activating a pending gift card" />
        <Step n={1} text='Go to Admin → Gift Cards.' />
        <Step n={2} text='Find the card with status "Pending" — it shows a reference number (e.g. GC-12).' />
        <Step n={3} text='Verify you have received the payment (check your bank for the e-Transfer).' />
        <Step n={4} text='Click the ⚡ Activate button next to the card.' />
        <Step n={5} text='The card status changes to "Active" and the gift card email is automatically sent to the recipient.' />
        <H text="Voiding a gift card" />
        <Step n={1} text='Find the card and click the 🚫 Void button.' />
        <Step n={2} text='Voided cards cannot be used at checkout. Use this for fraud or refund situations.' />
        <Note text="Once a gift card is activated, the email is sent immediately. Double-check the recipient's email address before activating." />
      </div>
    ),
  },

  // ─── SETTINGS ────────────────────────────────────────────────────────────────
  {
    id: 'maintenance-mode',
    category: 'settings',
    title: 'Turning maintenance mode on and off',
    keywords: ['maintenance', 'mode', 'offline', 'coming soon', 'live'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Maintenance mode shows a "We'll be right back" page to storefront visitors while admins can still access the dashboard.</p>
        <H text="Toggle from the dashboard" />
        <Step n={1} text='Go to Admin → Dashboard.' />
        <Step n={2} text='Click the "Maintenance: ON/OFF" button in the top-right of the page header.' />
        <Step n={3} text='The change takes effect immediately.' />
        <H text="Toggle from Site Settings" />
        <Step n={1} text='Go to Admin → Site Settings → General tab.' />
        <Step n={2} text='Find "Maintenance Mode" and toggle it.' />
        <Step n={3} text='You can also set a custom message and an estimated return time shown on the maintenance page.' />
        <Note text="Admin panel (/admin) is always accessible regardless of maintenance mode. Only the public storefront is hidden." />
      </div>
    ),
  },
  {
    id: 'payment-methods',
    category: 'settings',
    title: 'Configuring payment methods',
    keywords: ['payment', 'stripe', 'interac', 'e-transfer', 'cash', 'cod', 'pay at store'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Three payment methods are available: Stripe (credit/debit card), Interac e-Transfer, and Pay at Store.</p>
        <H text="Enabling / disabling payment methods" />
        <Step n={1} text='Go to Admin → Payment Methods.' />
        <Step n={2} text='Toggle each method on or off.' />
        <Step n={3} text='Save changes.' />
        <H text="Setting up Stripe (live payments)" />
        <Step n={1} text='Go to stripe.com and create or log into your account.' />
        <Step n={2} text='In the Stripe dashboard, go to Developers → API Keys.' />
        <Step n={3} text='Copy the Publishable Key (starts with pk_live_) and Secret Key (starts with sk_live_).' />
        <Step n={4} text='Give these keys to your system administrator to add to the server configuration.' />
        <Step n={5} text='Also register a webhook endpoint: https://api.atnmegastore.ca/api/webhook/stripe' />
        <H text="Interac e-Transfer setup" />
        <p className="text-sm text-gray-700">Go to Admin → Site Settings → General tab and enter your Interac e-Transfer email. Customers see this at checkout and send payment manually. You then activate their order after confirming receipt.</p>
        <Note text="Keep Stripe disabled until live keys are configured. Attempting a Stripe payment with test keys in production will fail." />
      </div>
    ),
  },
  {
    id: 'employee-roles',
    category: 'settings',
    title: 'Managing employees and roles',
    keywords: ['employee', 'staff', 'role', 'owner', 'sales', 'product manager', 'marketing', 'permissions'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Each staff member can hold one or more roles. Roles control which sections they can see and what actions they can take.</p>
        <H text="Role permissions" />
        <div className="space-y-2 text-sm text-gray-700 mb-3">
          <p><strong>Store Owner</strong> — Full access to all store sections, settings, employees, and site tools.</p>
          <p><strong>Product Manager</strong> — Manages products, categories, and content (slides, pages, events, blog). Cannot access orders, campaigns, or settings.</p>
          <p><strong>Sales</strong> — Manages orders, customers, discount codes, shipping, and gift cards.</p>
          <p><strong>Marketing</strong> — Manages email campaigns, newsletter subscribers, and social posts.</p>
        </div>
        <H text="Adding an employee" />
        <Step n={1} text='Go to Admin → Employees → Add Employee.' />
        <Step n={2} text='Enter their name and email address.' />
        <Step n={3} text='Select one or more roles (employees can hold multiple roles).' />
        <Step n={4} text='Save. A temporary password is emailed to them automatically.' />
        <H text="Two-factor authentication (2FA)" />
        <p className="text-sm text-gray-700">2FA is mandatory for all employee accounts. On first login, they are redirected to set up an authenticator app (Google Authenticator, Microsoft Authenticator, etc.) before they can access the dashboard.</p>
        <Tip text="Assign only the roles an employee needs. A staff member who manages both products and orders should have both Product Manager and Sales roles." />
      </div>
    ),
  },
  {
    id: 'task-board-overview',
    category: 'tasks',
    title: 'Using the Task Board',
    keywords: ['task', 'board', 'to-do', 'assign', 'priority', 'status', 'due date', 'team'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">The Task Board at <strong>Admin → Tasks</strong> is an internal to-do system for your team. Every staff member can create, assign, and track tasks.</p>
        <H text="Creating a task" />
        <Step n={1} text='Click + New Task at the top right of the page.' />
        <Step n={2} text='Enter a title and optional description.' />
        <Step n={3} text='Set the priority: Low, Medium, High, or Urgent.' />
        <Step n={4} text='Optionally set a due date.' />
        <Step n={5} text='Use the Assignee field to pick one or more team members to assign the task to.' />
        <Step n={6} text='Click Create Task. It appears in the list immediately.' />
        <H text="Updating task status" />
        <p className="text-sm text-gray-700 mb-2">Click the circle icon on the left of any task row to cycle it through: <strong>Open → In Progress → Done → Open</strong>.</p>
        <H text="Priority levels" />
        <div className="text-sm text-gray-700 space-y-1 mb-3">
          <p><strong>⚪ Low</strong> — Nice to have, complete when time allows.</p>
          <p><strong>🔵 Medium</strong> — Standard priority, complete within the week.</p>
          <p><strong>🟠 High</strong> — Important, complete within 1–2 days.</p>
          <p><strong>🔴 Urgent</strong> — Critical, must be done today.</p>
        </div>
        <Tip text="The Dashboard shows your top 6 open tasks so you can act on priorities without opening the full board." />
      </div>
    ),
  },
  {
    id: 'task-visibility',
    category: 'tasks',
    title: 'Task visibility — what each person sees',
    keywords: ['task', 'visibility', 'assigned', 'my tasks', 'see', 'filter', 'backlog'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">The task board shows only the tasks relevant to you — it is not a shared list of every task in the system.</p>
        <H text="You see a task if" />
        <div className="text-sm text-gray-700 space-y-1 mb-3">
          <p>✔ <strong>You created it</strong> — tasks you opened yourself always appear in your board.</p>
          <p>✔ <strong>You are assigned to it</strong> — if someone added your name as an assignee, you will see it.</p>
          <p>✔ <strong>It is unassigned (backlog)</strong> — tasks with no assignees are visible to everyone so any team member can pick them up.</p>
        </div>
        <H text="You do not see" />
        <p className="text-sm text-gray-700 mb-3">Tasks assigned only to other team members that you did not create will not appear in your view.</p>
        <H text="Multi-assignee tasks" />
        <p className="text-sm text-gray-700 mb-3">A single task can be assigned to more than one person. Each assignee will see the task in their own board and can update its status independently.</p>
        <Note text="Deleting a task is only allowed if you created it. Store Owners can delete any task." />
      </div>
    ),
  },
  {
    id: 'social-login-customers',
    category: 'settings',
    title: 'How customers sign in with Google or Facebook',
    keywords: ['google', 'facebook', 'social login', 'oauth', 'sign in', 'register', 'customer account'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Customers can register and sign in using their Google or Facebook account — no password required on their end.</p>
        <H text="How it works for customers" />
        <Step n={1} text='Customer clicks "Continue with Google" or "Continue with Facebook" on the Login or Register page.' />
        <Step n={2} text="They are sent to Google/Facebook to grant permission. ATN Megastore only reads their name and email." />
        <Step n={3} text="They are automatically returned to the store and signed in. If no account existed, one is created for them." />
        <Note text="If the customer already has an ATN Megastore account with the same email, their social account is linked to it. They can then use either method to sign in." />
        <H text="What you see in the Customers panel" />
        <p className="text-sm text-gray-700 mb-3">Social-login customers appear in <strong>Sales → Customers</strong> exactly like any other customer. Their email is verified automatically by Google/Facebook, so no manual verification step is needed.</p>
        <H text="To enable Google sign-in (setup required)" />
        <Step n={1} text="Go to console.cloud.google.com → Create a project → APIs & Services → Credentials." />
        <Step n={2} text='Create an OAuth 2.0 Client ID (Web application type). Add the backend callback URL as an Authorized Redirect URI.' />
        <Step n={3} text="Copy the Client ID and Client Secret into the backend .env file: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." />
        <H text="To enable Facebook sign-in (setup required)" />
        <Step n={1} text="Go to developers.facebook.com → Create App → Consumer type." />
        <Step n={2} text="Add Facebook Login product → set Valid OAuth Redirect URI to the backend callback URL." />
        <Step n={3} text="Copy the App ID and App Secret into the backend .env file: FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET." />
        <Tip text="Social login is optional. Customers who prefer email/password can still register and sign in the traditional way." />
      </div>
    ),
  },
  {
    id: 'site-settings',
    category: 'settings',
    title: 'Configuring general site settings',
    keywords: ['settings', 'site name', 'logo', 'contact', 'social links', 'seo'],
    body: (
      <div>
        <p className="text-sm text-gray-600 mb-4">Site Settings control store-wide details like the site name, contact info, logo URL, and social media links.</p>
        <H text="General tab" />
        <p className="text-sm text-gray-700 mb-2">Site name, tagline, contact email, phone, address, and Interac e-Transfer email.</p>
        <H text="Appearance tab" />
        <p className="text-sm text-gray-700 mb-2">Logo URL, favicon URL, and theme colour settings.</p>
        <H text="Social Media tab" />
        <p className="text-sm text-gray-700 mb-2">Facebook, Instagram, and Twitter/X profile URLs (shown in the footer).</p>
        <H text="Social API tab" />
        <p className="text-sm text-gray-700 mb-2">API credentials for automated social posting. See the Social Media help articles for setup guides.</p>
        <H text="Email tab" />
        <p className="text-sm text-gray-700 mb-2">From name and email address used in all outgoing emails.</p>
        <H text="Security tab" />
        <p className="text-sm text-gray-700">Two-factor authentication requirements and session settings.</p>
        <Note text="Always click Save after making changes. Settings are applied immediately — no deployment needed." />
      </div>
    ),
  },
];

export default function HelpPage() {
  const [query,      setQuery]      = useState('');
  const [category,   setCategory]   = useState('all');
  const [expanded,   setExpanded]   = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return ARTICLES.filter(a => {
      const matchCat = category === 'all' || a.category === category;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.keywords.some(k => k.includes(q))
      );
    });
  }, [query, category]);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-[#213885]" />
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Help Centre</h1>
        </div>
        <p className="text-sm text-gray-500">Step-by-step guides for managing the ATN Book & Crafts.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search help articles…"
          className="w-full pl-10 pr-4 py-3 border border-[#cccacc] text-sm focus:outline-none focus:ring-2 focus:ring-[#213885] bg-white"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => {
          const Icon = CAT_ICONS[c.key];
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors ${
                category === c.key
                  ? 'bg-[#213885] text-white border-[#213885]'
                  : 'bg-white text-gray-600 border-[#cccacc] hover:border-[#213885] hover:text-[#213885]'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      {query && (
        <p className="text-xs text-gray-500">
          {filtered.length === 0 ? 'No articles found.' : `${filtered.length} article${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* Articles */}
      <div className="space-y-2">
        {filtered.map(article => {
          const isOpen = expanded === article.id;
          const CatIcon = CAT_ICONS[article.category];
          return (
            <div key={article.id} className="border border-[#cccacc] bg-white">
              <button
                onClick={() => toggle(article.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {CatIcon && <CatIcon className="w-4 h-4 text-[#213885] shrink-0" />}
                  <span className="text-sm font-semibold text-[#1a1a1a] truncate">{article.title}</span>
                </div>
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-5 pt-1 border-t border-gray-100">
                  {article.body}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !query && (
        <p className="text-center text-sm text-gray-400 py-8">Select a category or search above to find help articles.</p>
      )}
    </div>
  );
}
