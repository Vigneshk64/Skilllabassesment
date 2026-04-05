# Student Management REST API
**Assignment 1 | Web Technologies Lab**
**Name:** Vignesh Das | **Course:** ISE | **Semester:** 4

---

## What I Built

A simple REST API to manage student records — built using only **Node.js** (no Express, no frameworks). It can create, read, update, and delete student data, and saves everything to a JSON file so the data doesn't disappear when you restart.

---

## How to Run

```bash
node Server.js
```

Server starts at: `http://localhost:3000`

No need to install anything — it uses only built-in Node.js modules.

---

## API Endpoints

| Method | URL | What it does |
|--------|-----|--------------|
| POST | `/students` | Add a new student |
| GET | `/students` | Get all students |
| GET | `/students/:id` | Get one student by ID |
| PUT | `/students/:id` | Update a student |
| DELETE | `/students/:id` | Delete a student |

---

## Testing Screenshots (Postman)

### 1. POST — Create Student → `201 Created`
Created a student with name, email, course, year. Got back the new student object with auto-generated ID and timestamps.

### 2. GET All Students → `200 OK`
Returns a list of all students with pagination info (currentPage, totalPages, etc.)

### 3. GET One Student → `200 OK`
Fetched a single student using their ID in the URL.

### 4. PUT — Update Student → `200 OK`
Updated student details. The `updatedAt` timestamp changed automatically.

### 5. DELETE — Delete Student → `200 OK`
Deleted a student. Returns the deleted student's data as confirmation.

### 6. Error Case — Wrong ID → `404 Not Found`
Tried to delete/get a student with an ID that doesn't exist. Got proper error message.

---

## Bonus Features I Added

- **Pagination** — `?page=1&limit=5`
- **Filter by year** — `?year=2`
- **JSON file storage** — data saves in `students.json`
- **Timestamps** — `createdAt` and `updatedAt` on every record
- **405 Method Not Allowed** — handled wrong HTTP methods

---

## Files

```
Assignment 1/
├── Server.js        ← main server code
├── students.json    ← auto-created when you add students
├── package.json
└── README.md
```

---

## Validation Rules

- **Name** — required
- **Email** — must be valid format (checked with regex)
- **Course** — required
- **Year** — must be 1, 2, 3, or 4

---

## Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | OK — successful GET/PUT/DELETE |
| 201 | Created — successful POST |
| 400 | Bad Request — missing/invalid fields |
| 404 | Not Found — wrong ID or route |
| 405 | Method Not Allowed |
