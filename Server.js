const http = require('http');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('crypto');

// ============ CONFIGURATION ============
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'students.json');

// ============ IN-MEMORY STORAGE ============
let students = [];

// ============ UTILITY FUNCTIONS ============

// Generate unique ID (simple UUID-like)
function generateId() {
    return 'STU_' + Math.random().toString(36).substr(2, 9) + Date.now();
}

// Email validation regex
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate student data
function validateStudent(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push('Name is required and must be a non-empty string');
    }

    if (!data.email || typeof data.email !== 'string') {
        errors.push('Email is required');
    } else if (!isValidEmail(data.email)) {
        errors.push('Email must be in valid format (e.g., user@domain.com)');
    }

    if (!data.course || typeof data.course !== 'string' || data.course.trim() === '') {
        errors.push('Course is required and must be a non-empty string');
    }

    if (data.year === undefined || data.year === null) {
        errors.push('Year is required');
    } else {
        const year = parseInt(data.year);
        if (isNaN(year) || year < 1 || year > 4) {
            errors.push('Year must be a number between 1 and 4');
        }
    }

    return errors;
}

// Load students from JSON file
function loadStudents() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            students = JSON.parse(data);
        } else {
            students = [];
        }
    } catch (error) {
        console.error('Error loading students from file:', error.message);
        students = [];
    }
}

// Save students to JSON file
function saveStudents() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving students to file:', error.message);
    }
}

// Parse request body
function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const data = body ? JSON.parse(body) : {};
            callback(null, data);
        } catch (error) {
            callback(new Error('Invalid JSON format'), null);
        }
    });
}

// Parse URL and return parsed components
function parseURL(urlString) {
    const url = new URL(urlString, `http://localhost:${PORT}`);
    const pathname = url.pathname;
    const searchParams = url.searchParams;
    return { pathname, searchParams };
}

// ============ ROUTE HANDLERS ============

// POST /students - Create a new student
function handleCreateStudent(req, res, parsedUrl) {
    parseBody(req, (error, data) => {
        if (error) {
            return sendResponse(res, 400, {
                success: false,
                message: error.message
            });
        }

        const validationErrors = validateStudent(data);
        if (validationErrors.length > 0) {
            return sendResponse(res, 400, {
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        const newStudent = {
            id: generateId(),
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            course: data.course.trim(),
            year: parseInt(data.year),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        students.push(newStudent);
        saveStudents();

        sendResponse(res, 201, {
            success: true,
            message: 'Student created successfully',
            data: newStudent
        });
    });
}

// GET /students - Get all students with pagination and filtering
function handleGetAllStudents(req, res, parsedUrl) {
    let filteredStudents = [...students];

    // Filtering by year
    const year = parsedUrl.searchParams.get('year');
    if (year) {
        const yearNum = parseInt(year);
        if (!isNaN(yearNum)) {
            filteredStudents = filteredStudents.filter(s => s.year === yearNum);
        }
    }

    // Pagination
    const page = parseInt(parsedUrl.searchParams.get('page')) || 1;
    const limit = parseInt(parsedUrl.searchParams.get('limit')) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);
    const totalCount = filteredStudents.length;
    const totalPages = Math.ceil(totalCount / limit);

    sendResponse(res, 200, {
        success: true,
        message: 'Students retrieved successfully',
        data: paginatedStudents,
        pagination: {
            currentPage: page,
            limit,
            totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    });
}

// GET /students/:id - Get a single student by ID
function handleGetStudentById(req, res, parsedUrl, studentId) {
    const student = students.find(s => s.id === studentId);

    if (!student) {
        return sendResponse(res, 404, {
            success: false,
            message: `Student with ID ${studentId} not found`
        });
    }

    sendResponse(res, 200, {
        success: true,
        message: 'Student retrieved successfully',
        data: student
    });
}

// PUT /students/:id - Update a student
function handleUpdateStudent(req, res, parsedUrl, studentId) {
    const student = students.find(s => s.id === studentId);

    if (!student) {
        return sendResponse(res, 404, {
            success: false,
            message: `Student with ID ${studentId} not found`
        });
    }

    parseBody(req, (error, data) => {
        if (error) {
            return sendResponse(res, 400, {
                success: false,
                message: error.message
            });
        }

        // Validate only provided fields
        const validationErrors = validateStudent({
            name: data.name || student.name,
            email: data.email || student.email,
            course: data.course || student.course,
            year: data.year !== undefined ? data.year : student.year
        });

        if (validationErrors.length > 0) {
            return sendResponse(res, 400, {
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Update student fields
        if (data.name !== undefined) student.name = data.name.trim();
        if (data.email !== undefined) student.email = data.email.trim().toLowerCase();
        if (data.course !== undefined) student.course = data.course.trim();
        if (data.year !== undefined) student.year = parseInt(data.year);
        student.updatedAt = new Date().toISOString();

        saveStudents();

        sendResponse(res, 200, {
            success: true,
            message: 'Student updated successfully',
            data: student
        });
    });
}

// DELETE /students/:id - Delete a student
function handleDeleteStudent(req, res, parsedUrl, studentId) {
    const index = students.findIndex(s => s.id === studentId);

    if (index === -1) {
        return sendResponse(res, 404, {
            success: false,
            message: `Student with ID ${studentId} not found`
        });
    }

    const deletedStudent = students.splice(index, 1);
    saveStudents();

    sendResponse(res, 200, {
        success: true,
        message: 'Student deleted successfully',
        data: deletedStudent[0]
    });
}

// ============ RESPONSE HANDLER ============
function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

// ============ REQUEST ROUTING ============
function router(req, res) {
    const parsedUrl = parseURL(req.url);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Enable CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // Routes
    if (pathname === '/students') {
        if (method === 'GET') {
            handleGetAllStudents(req, res, parsedUrl);
        } else if (method === 'POST') {
            handleCreateStudent(req, res, parsedUrl);
        } else {
            sendResponse(res, 405, {
                success: false,
                message: `Method ${method} not allowed for /students`
            });
        }
    } else if (pathname.startsWith('/students/')) {
        const studentId = pathname.split('/')[2];
        
        if (!studentId) {
            return sendResponse(res, 400, {
                success: false,
                message: 'Student ID is required'
            });
        }

        if (method === 'GET') {
            handleGetStudentById(req, res, parsedUrl, studentId);
        } else if (method === 'PUT') {
            handleUpdateStudent(req, res, parsedUrl, studentId);
        } else if (method === 'DELETE') {
            handleDeleteStudent(req, res, parsedUrl, studentId);
        } else {
            sendResponse(res, 405, {
                success: false,
                message: `Method ${method} not allowed for /students/:id`
            });
        }
    } else {
        sendResponse(res, 404, {
            success: false,
            message: 'Route not found'
        });
    }
}

// ============ SERVER INITIALIZATION ============
const server = http.createServer(router);

loadStudents();

server.listen(PORT, () => {
    console.log(`Student Management REST API Server running on http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to stop the server`);
});

server.on('error', (error) => {
    console.error('Server error:', error.message);
});
