// Sample course data (will be replaced with MongoDB data later)
const sampleCourses = [
    {
        id: 1,
        title: "Introduction to Web Development",
        instructor: "John Doe",
        rating: 4.5,
        students: 1200,
        price: "$49.99",
        description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript.",
        image: "assets/course1.jpg"
    },
    {
        id: 2,
        title: "Advanced JavaScript",
        instructor: "Jane Smith",
        rating: 4.8,
        students: 800,
        price: "$69.99",
        description: "Master advanced JavaScript concepts, ES6+, and modern development practices.",
        image: "assets/course2.jpg"
    },
    {
        id: 3,
        title: "MongoDB Essentials",
        instructor: "Mike Johnson",
        rating: 4.6,
        students: 950,
        price: "$59.99",
        description: "Learn MongoDB database design, queries, and best practices.",
        image: "assets/course3.jpg"
    }
];

// Function to create course cards
function createCourseCard(course) {
    return `
        <div class="course-card">
            <div class="course-image" style="background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%); color: white; display: flex; align-items: center; justify-content: center; padding: 2rem; text-align: center;">
                <div class="course-preview-text">${course.title}</div>
            </div>
            <div class="course-content">
                <h3>${course.title}</h3>
                <p class="instructor">Instructor: ${course.instructor}</p>
                <p class="description">${course.description}</p>
                <div class="course-meta">
                    <span class="rating">⭐ ${course.rating}</span>
                    <span class="students">${course.students} students</span>
                </div>
                <div class="course-footer">
                    <span class="price">${course.price}</span>
                    <a href="/course-detail?id=${course.id}" class="btn-primary">Learn More</a>
                </div>
            </div>
        </div>
    `;
}

// Load popular courses
document.addEventListener('DOMContentLoaded', () => {
    const popularCoursesContainer = document.getElementById('popularCourses');
    if (popularCoursesContainer) {
        const courseHTML = sampleCourses.map(course => createCourseCard(course)).join('');
        popularCoursesContainer.innerHTML = courseHTML;
    }
});

// Navigation menu toggle for mobile
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    hamburger.innerHTML = '☰';
    
    // Add hamburger menu for mobile
    if (window.innerWidth <= 768) {
        document.querySelector('.navbar').prepend(hamburger);
        navLinks.style.display = 'none';
        
        hamburger.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'none' ? 'flex' : 'none';
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.style.display = 'flex';
            hamburger.style.display = 'none';
        } else {
            navLinks.style.display = 'none';
            hamburger.style.display = 'block';
        }
    });
});

// Search functionality
const searchCourses = (query) => {
    return sampleCourses.filter(course => 
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase())
    );
};

// Add search functionality if search input exists
const searchInput = document.getElementById('courseSearch');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const filteredCourses = searchCourses(query);
        const coursesContainer = document.getElementById('popularCourses');
        coursesContainer.innerHTML = filteredCourses.map(course => createCourseCard(course)).join('');
    });
}
