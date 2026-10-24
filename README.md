# \# Califnco — Water Purifier E-commerce Platform

# 

# Califnco is a water purifier e-commerce platform designed to simplify product discovery, ordering, service booking, and dealer applications.

# 

# \## Project Modules

# 

# \### 1. Mobile Application

# \- User registration and login using Firebase Authentication

# \- Product catalogue with search and categories

# \- Shopping cart and checkout

# \- Order placement and order history

# \- Service request booking

# \- Dealer application submission

# 

# \### 2. Admin Dashboard

# \- Admin authentication and dashboard

# \- View and manage customer orders

# \- Review service requests and update their statuses

# \- Review dealer applications and approve or reject them

# \- Firebase Firestore integration

# 

# \### 3. Instagram Automation

# \- Automation workflow starter for social media content publishing

# \- Requires configuration of Meta/Instagram API access and credentials before live use

# 

# \### 4. Firebase Backend

# \- Firebase Authentication

# \- Cloud Firestore database

# \- Security rules for protecting application data

# 

# \## Technology Stack

# 

# \- React

# \- Vite

# \- TypeScript

# \- Expo / React Native

# \- Firebase Authentication

# \- Cloud Firestore

# \- Node.js and npm

# 

# \## Project Structure

# 

# ```text

# califnco\_submission/

# ├── admin/       # Web-based admin dashboard

# ├── mobile/      # Mobile application

# ├── firebase/    # Firebase configuration and rules

# ├── automation/  # Social media automation resources

# ├── README.md

# └── .gitignore

# ```

# 

# \## Local Development

# 

# \### Admin Dashboard

# 

# ```bash

# cd admin

# npm install

# npm run dev

# ```

# 

# Create an appropriate local `.env` file containing the required Firebase web configuration variables before running the dashboard.

# 

# \### Mobile Application

# 

# ```bash

# cd mobile

# npm install

# npx expo start

# ```

# 

# Follow the mobile application's Firebase configuration requirements.

# 

# \## Security

# 

# \- Do not commit `.env` files, service-account keys, passwords, or private access tokens.

# \- Keep Firestore security rules enabled and restrict administrative operations to authorized administrators.

# \- Configure production environment variables in the deployment platform.

# 

# \## Deployment

# 

# The admin dashboard can be built for production with:

# 

# ```bash

# cd admin

# npm run build

# ```

# 

# The generated production files are placed in the `admin/dist` directory and can be deployed using a platform such as Vercel.

# 

# \## Project Status

# 

# The admin dashboard production build has completed successfully. Configure and verify deployment settings, Firebase permissions, and external automation credentials before using all features in production.



