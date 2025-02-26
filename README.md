# EduPlatform - Online Course System

## Prerequisites

- Node.js (v14 or later)
- MongoDB

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/eduplatform.git
   cd eduplatform
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/eduplatform
   JWT_SECRET=your_secret_key_here
   ```
   Replace `your_secret_key_here` with a secure random string.

4. Ensure MongoDB is running on your local machine.

## Running the Application

1. Start the server:
   ```
   npm start
   ```

2. Open a web browser and navigate to `http://localhost:3000`

## Features

- User registration and login
- Course browsing and enrollment
- Video lessons and quizzes
- Progress tracking
- Certificate generation upon course completion
- Admin dashboard for course and user management

## API Documentation

(Add API documentation here)

## Contributing

(Add contribution guidelines here)

## License

(Add license information here)
