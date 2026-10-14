# ShopKart

ShopKart is a MERN e-commerce application with a React storefront and an Express/MongoDB API. It includes customer registration and login, product browsing, a wishlist, a shopping cart, order history, and Razorpay checkout.

## Requirements

- Node.js 18 or later and npm
- MongoDB running locally, or a MongoDB connection string
- Razorpay test API keys to process checkout payments (optional for browsing the app)

## Setup

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/Yash8006/Shopkart.git
   cd Shopkart
   ```

2. Install the backend and frontend dependencies:

   ```bash
   npm run install:all
   ```

3. Configure the backend. Create `backend/.env`:

   ```dotenv
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/shopkart
   CLIENT_URL=http://localhost:5173
   JWT_SECRET=replace-with-a-long-random-secret
   JWT_EXPIRES_IN=7d
   ```

   `MONGO_URI` can point to a MongoDB Atlas database instead. The backend has development defaults for the port and database URI, but set a private `JWT_SECRET` for your environment.

4. (Optional) To enable Razorpay checkout, add your Razorpay **test-mode** credentials to `backend/.env`:

   ```dotenv
   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_test_key_secret
   ```

   Do not commit `.env` files or expose the key secret in frontend configuration. Checkout requires valid Razorpay credentials; browsing and other app features can be used without configuring them.

5. (Optional) Configure the frontend API URL. The default is `http://localhost:5001`. To override it, create `frontend/.env`:

   ```dotenv
   VITE_API_URL=http://localhost:5001
   ```

## Run locally

Start the API from the project root:

```bash
npm run backend:dev
```

In a second terminal, start the React development server:

```bash
npm run frontend
```

Open [http://localhost:5173](http://localhost:5173). The API health check is available at [http://localhost:5001/health](http://localhost:5001/health).

## Sample products

With MongoDB running and `MONGO_URI` configured, seed the database with sample products:

```bash
npm run seed
```

The seed script only inserts the sample products when the database has no products yet.

## Tests and production build

Run the backend Jest tests:

```bash
npm test
```

Run the backend end-to-end test:

```bash
npm run test:e2e
```

Build the frontend for production:

```bash
npm --prefix frontend run build
```

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `PORT` | Backend | API port; defaults to `5001`. |
| `MONGO_URI` | Backend | MongoDB connection URI; defaults to `mongodb://localhost:27017/shopkart`. |
| `CLIENT_URL` | Backend | Frontend origin for CORS; defaults to `http://localhost:5173`. |
| `JWT_SECRET` | Backend | Secret used to sign authentication tokens. Set a private value. |
| `JWT_EXPIRES_IN` | Backend | Token lifetime; defaults to `7d`. |
| `RAZORPAY_KEY_ID` | Backend | Razorpay test key ID for checkout. |
| `RAZORPAY_KEY_SECRET` | Backend | Razorpay test key secret; keep it private. |
| `VITE_API_URL` | Frontend | Backend API base URL; defaults to `http://localhost:5001`. |
