# Online Forms Backend API

A comprehensive backend API for the Online Forms application built with Node.js, Express, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Registration, login, profile management, email verification
- **Application Management**: CRUD operations for form applications
- **Form Submissions**: Handle both form data and document uploads
- **Payment Integration**: Razorpay integration for processing fees
- **Admin Panel**: Complete admin dashboard with analytics
- **Email Notifications**: Automated email notifications for various events
- **File Upload**: Cloudinary integration for document storage
- **Security**: Rate limiting, CORS, helmet, input validation
- **Logging**: Winston-based logging system
- **Database**: PostgreSQL with Sequelize ORM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Payment**: Razorpay
- **Validation**: Joi, express-validator
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Winston
- **Testing**: Jest, Supertest

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   - Database credentials
   - JWT secrets
   - Cloudinary credentials
   - Email configuration
   - Payment gateway keys

4. **Database Setup**

   ```bash
   # Create database
   createdb online_forms_db

   # Run migrations
   npm run migrate

   # Seed initial data
   npm run seed
   ```

## Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The API will be available at `http://localhost:3000`

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint                | Description            |
| ------ | ----------------------- | ---------------------- |
| POST   | `/auth/register`        | Register new user      |
| POST   | `/auth/login`           | User login             |
| POST   | `/auth/logout`          | User logout            |
| POST   | `/auth/refresh-token`   | Refresh JWT token      |
| POST   | `/auth/forgot-password` | Request password reset |
| POST   | `/auth/reset-password`  | Reset password         |
| POST   | `/auth/change-password` | Change password        |
| POST   | `/auth/verify-email`    | Verify email address   |
| GET    | `/auth/me`              | Get user profile       |
| PUT    | `/auth/profile`         | Update user profile    |

### Application Endpoints

| Method | Endpoint                   | Description            |
| ------ | -------------------------- | ---------------------- |
| GET    | `/applications`            | Get all applications   |
| GET    | `/applications/search`     | Search applications    |
| GET    | `/applications/categories` | Get categories         |
| GET    | `/applications/:id`        | Get single application |

### User Application Endpoints

| Method | Endpoint                              | Description                 |
| ------ | ------------------------------------- | --------------------------- |
| GET    | `/user-applications`                  | Get user's applications     |
| GET    | `/user-applications/:id`              | Get single user application |
| POST   | `/user-applications/submit-form`      | Submit form application     |
| POST   | `/user-applications/upload-documents` | Upload documents            |
| PUT    | `/user-applications/:id`              | Update application          |
| DELETE | `/user-applications/:id`              | Delete application          |

### Payment Endpoints

| Method | Endpoint                 | Description          |
| ------ | ------------------------ | -------------------- |
| POST   | `/payments/create-order` | Create payment order |
| POST   | `/payments/verify`       | Verify payment       |
| GET    | `/payments/history`      | Get payment history  |
| GET    | `/payments/:id`          | Get single payment   |

### Admin Endpoints

| Method | Endpoint                              | Description               |
| ------ | ------------------------------------- | ------------------------- |
| GET    | `/admin/dashboard`                    | Admin dashboard data      |
| GET    | `/admin/applications`                 | Manage applications       |
| POST   | `/admin/applications`                 | Create application        |
| PUT    | `/admin/applications/:id`             | Update application        |
| DELETE | `/admin/applications/:id`             | Delete application        |
| GET    | `/admin/user-applications`            | Manage user applications  |
| PUT    | `/admin/user-applications/:id/status` | Update application status |
| GET    | `/admin/users`                        | Manage users              |
| GET    | `/admin/analytics/overview`           | Analytics overview        |

## Database Schema

### Users

- Authentication and user profile information
- Role-based access (user/admin)
- Email verification and password reset

### Applications

- Form templates created by admins
- Categories, descriptions, and requirements
- Processing fees and estimated times

### Form Fields

- Dynamic form field definitions
- Various field types (text, email, dropdown, etc.)
- Validation rules and options

### User Applications

- User submissions for applications
- Form data or document uploads
- Status tracking and admin notes

### Payments

- Payment processing records
- Integration with Razorpay
- Transaction history and status

### Documents

- File upload records
- Cloudinary integration
- Verification status

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Rate Limiting**: Prevent API abuse
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Sequelize ORM protection

## Error Handling

The API uses a centralized error handling system with:

- Custom error classes
- Proper HTTP status codes
- Detailed error messages in development
- Sanitized errors in production
- Logging for debugging

## Logging

Winston-based logging system with:

- Different log levels (error, warn, info, debug)
- File-based logging
- Console logging in development
- Log rotation and archiving

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Environment Variables

Ensure all required environment variables are set:

```bash
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
EMAIL_HOST=your-email-host
EMAIL_USER=your-email-user
EMAIL_PASS=your-email-password
```

### Production Deployment

1. **Build and Deploy**

   ```bash
   npm install --production
   npm run migrate
   npm start
   ```

2. **Process Management**
   Use PM2 for production process management:

   ```bash
   npm install -g pm2
   pm2 start src/server.js --name "online-forms-api"
   pm2 startup
   pm2 save
   ```

3. **Reverse Proxy**
   Configure Nginx as a reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
# online_form_backend
