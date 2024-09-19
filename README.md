# Final Project B11

## Description

KeKe Clothing Store

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)

## Authors

- Arfin Dwi Octavianto

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/arfindwio/KeKe-BE.git

   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:

   Create a .env file in the root directory and add the necessary variables. Refer to the .env.example file for guidance.

4. Set up prisma:

   ```bash
   npx prisma migrate dev --name init
   ```

## Usage

For development with auto-restart (nodemon):

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## API Documentation

Swagger Documentation
Access the Swagger documentation at `/api-docs` after starting the server.

## API Endpoints

- Users: `/api/v1/users``
- User Profiles: `/api/v1/user-profiles`
- notifications: `/api/v1/notifications`
- Categories: `/api/v1/categories`
- Promotions: `/api/v1/promotions`
- Products: `/api/v1/products`
- Images: `/api/v1/images`
- Sizes: `/api/v1/sizes`
- Colors: `/api/v1/colors`
- Carts: `/api/v1/carts`
- Payments: `/api/v1/payments`
- Reviews: `/api/v1/reviews`
- Discussions: `/api/v1/discussions`
- Replies: `/api/v1/replies`
