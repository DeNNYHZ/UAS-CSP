# Dashboard Inventory Management

A role-based inventory management web application built with **Next.js** and **Supabase**.  
This project demonstrates authentication, protected routes, and CRUD operations with separate dashboards for **admin** and **user** roles.

---

## Features

### Authentication & Authorization
- Secure sign-in using Supabase Authentication
- Session handling to maintain login state
- Role-based access control (admin and user)

### Dashboard
- **User Dashboard**
  - View inventory product data in table format
- **Admin Dashboard**
  - Full CRUD (Create, Read, Update, Delete) functionality for inventory products

### Inventory Management
- Product data includes:
  - Product Name
  - Unit Price
  - Quantity
- Real-time data fetching from Supabase database

### Route Protection
- Dashboard routes are accessible only to authenticated users
- Unauthorized users are redirected to the sign-in page

---

## Tech Stack

- **Frontend:** Next.js
- **Backend:** Supabase
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Styling:** CSS Modules / Tailwind CSS

### Purpose
This project was developed as a portfolio project to demonstrate:
1. Role-based authentication
2. Secure route protection
3. Full CRUD implementation
4. Clean and scalable application structure
