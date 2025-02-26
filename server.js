require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
}));

// HTML Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/courses', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'courses.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/course-detail', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'course-detail.html'));
});

// User dashboard route
app.get('/user-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user-dashboard.html'));
});

// Admin Dashboard Route
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Favicon route
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.html'));
});

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: role || 'student',
            enrolledCourses: [],
            createdAt: new Date()
        };

        // Insert user into database
        const result = await users.insertOne(user);

        // Create JWT token
        const token = jwt.sign(
            { id: result.insertedId, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        res.status(201).json({ token, role: user.role });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error registering user: ' + error.message });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await users.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        // Store token in session
        req.session.token = token;

        res.json({ token, role: user.role });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

// User Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out, please try again' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// MongoDB Connection
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduplatform';
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB at:', uri);
        
        // Test database connection
        const adminDb = client.db().admin();
        const result = await adminDb.ping();
        console.log('Database ping result:', result);
        
        // List all collections
        const db = client.db('eduplatform');
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
    } catch (error) {
        console.error('MongoDB connection error:', error);
        console.error('Connection string:', uri);
        process.exit(1);
    }
}

connectDB();

// Database collections
const db = client.db('eduplatform');
const users = db.collection('users');
const courses = db.collection('courses');
const progress = db.collection('progress');

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.session.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = verified;
        req.user.id = new ObjectId(verified.id); // Convert id to ObjectId
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes

// Duplicate registration and login routes removed

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await users.findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Error fetching user profile' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, email } = req.body;

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { firstName, lastName, email, updatedAt: new Date() } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Error updating user profile' });
    }
});

// Get Courses
app.get('/api/courses', authenticateToken, async (req, res) => {
    try {
        const coursesList = await courses.find().toArray();
        res.json(coursesList);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Error fetching courses' });
    }
});

// Get Course by ID
app.get('/api/courses/:id', async (req, res) => {
    try {
        const course = await courses.findOne({ _id: req.params.id });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching course' });
    }
});

// Enroll in Course
app.post('/api/courses/:id/enroll', authenticateToken, async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;

        // Check if already enrolled
        const user = await users.findOne({ _id: userId });
        if (user.enrolledCourses.includes(courseId)) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }

        // Update user's enrolled courses
        await users.updateOne(
            { _id: userId },
            { $push: { enrolledCourses: courseId } }
        );

        // Create progress tracking
        await progress.insertOne({
            userId,
            courseId,
            completedLessons: [],
            quizScores: [],
            startDate: new Date(),
            lastAccessed: new Date()
        });

        res.json({ message: 'Successfully enrolled in course' });
    } catch (error) {
        res.status(500).json({ error: 'Error enrolling in course' });
    }
});

// Update Course Progress
app.post('/api/courses/:id/progress', authenticateToken, async (req, res) => {
    try {
        const { lessonId, completed, quizScore } = req.body;
        const courseId = req.params.id;
        const userId = req.user.id;

        const updateData = {};
        if (completed) {
            updateData.$addToSet = { completedLessons: lessonId };
        }
        if (quizScore !== undefined) {
            updateData.$push = { 
                quizScores: {
                    lessonId,
                    score: quizScore,
                    date: new Date()
                }
            };
        }

        await progress.updateOne(
            { userId, courseId },
            { 
                ...updateData,
                $set: { lastAccessed: new Date() }
            }
        );

        res.json({ message: 'Progress updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating progress' });
    }
});

// Get User Progress
app.get('/api/courses/:id/progress', authenticateToken, async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;

        const userProgress = await progress.findOne({ userId, courseId });
        if (!userProgress) {
            return res.status(404).json({ error: 'Progress not found' });
        }

        res.json(userProgress);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching progress' });
    }
});

// Admin Middleware
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

// Admin Dashboard Route
app.get('/admin-dashboard', authenticateToken, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Admin Routes

// Get all users
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const usersList = await users.find({}, { password: 0 }).toArray();
        res.json(usersList);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// Update user role
app.put('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { role } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating user role' });
    }
});

// Create a new course
app.post('/api/admin/courses', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, description, duration, instructor, modules } = req.body;

        const newCourse = {
            title,
            description,
            duration,
            instructor,
            modules,
            createdAt: new Date()
        };

        const result = await courses.insertOne(newCourse);
        res.status(201).json({ message: 'Course created successfully', courseId: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: 'Error creating course' });
    }
});

// Update a course
app.put('/api/admin/courses/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { title, description, duration, instructor, modules } = req.body;

        const result = await courses.updateOne(
            { _id: new ObjectId(courseId) },
            { $set: { title, description, duration, instructor, modules, updatedAt: new Date() } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ message: 'Course updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error updating course' });
    }
});

// Delete a course
app.delete('/api/admin/courses/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const courseId = req.params.id;

        const result = await courses.deleteOne({ _id: new ObjectId(courseId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting course' });
    }
});

// Add video lesson to a course
app.post('/api/admin/courses/:id/lessons', authenticateToken, isAdmin, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { title, videoUrl, description } = req.body;

        const result = await courses.updateOne(
            { _id: new ObjectId(courseId) },
            { 
                $push: { 
                    lessons: {
                        _id: new ObjectId(),
                        title,
                        videoUrl,
                        description,
                        createdAt: new Date()
                    }
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.status(201).json({ message: 'Lesson added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error adding lesson' });
    }
});

// Add test to a course
app.post('/api/admin/courses/:id/tests', authenticateToken, isAdmin, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { title, questions } = req.body;

        const result = await courses.updateOne(
            { _id: new ObjectId(courseId) },
            { 
                $push: { 
                    tests: {
                        _id: new ObjectId(),
                        title,
                        questions,
                        createdAt: new Date()
                    }
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.status(201).json({ message: 'Test added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error adding test' });
    }
});

// Generate certificate
app.post('/api/courses/:id/certificate', authenticateToken, async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;

        // Check if user has completed all lessons and tests
        const userProgress = await progress.findOne({ userId, courseId });
        const course = await courses.findOne({ _id: new ObjectId(courseId) });

        if (!userProgress || !course) {
            return res.status(404).json({ error: 'Course or progress not found' });
        }

        const allLessonsCompleted = course.lessons.every(lesson => 
            userProgress.completedLessons.includes(lesson._id.toString())
        );

        const allTestsPassed = course.tests.every(test => 
            userProgress.quizScores.some(quiz => 
                quiz.lessonId === test._id.toString() && quiz.score >= 70
            )
        );

        if (!allLessonsCompleted || !allTestsPassed) {
            return res.status(400).json({ error: 'Course not completed' });
        }

        // Generate certificate
        const certificate = {
            userId,
            courseId,
            courseName: course.title,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            issueDate: new Date()
        };

        const result = await db.collection('certificates').insertOne(certificate);

        res.status(201).json({ 
            message: 'Certificate generated successfully',
            certificateId: result.insertedId
        });
    } catch (error) {
        res.status(500).json({ error: 'Error generating certificate' });
    }
});

// Get user's certificates
app.get('/api/user/certificates', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const certificates = await db.collection('certificates').find({ userId }).toArray();
        res.json(certificates);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching certificates' });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await users.findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Error fetching user profile' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, email } = req.body;

        const result = await users.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { firstName, lastName, email, updatedAt: new Date() } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Error updating user profile' });
    }
});

// Removed duplicate routes

// Handle 404 errors for HTML routes
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        console.log(`404 Error: ${req.url} not found`);
        res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        next();
    }
});

// Handle 404 errors for other routes
app.use((req, res) => {
    console.log(`404 Error: ${req.url} not found`);
    res.status(404).send('404: File Not Found');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
    console.log(`MongoDB connected at: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduplatform'}`);
}).on('error', (err) => {
    console.error('Error starting server:', err);
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await client.close();
        console.log('MongoDB connection closed');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});
