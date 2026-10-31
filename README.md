# Complaint Management System

A full-stack web application for managing college complaints. Students can submit and track complaints, while administrators and staff can review, assign, manage, and resolve them.

The system uses AI-assisted complaint classification to identify a complaint's category and priority, followed by department-based routing and staff assignment.

## Features

### Student
- Secure login using JWT authentication.
- Submit complaints with a title and description.
- View submitted complaints and their current status.
- Track complaint progress and complaint history.
- Reopen eligible complaints.

### Administrator
- View and manage complaints.
- Review complaints requiring manual classification review.
- Assign complaints to staff members.
- View unassigned complaints.
- Create and update staff accounts.
- View analytics, including complaint statistics, department workload, monthly trends, and staff performance.

### Staff
- View complaints assigned to them.
- Update complaint status.
- Track complaint history.

### AI-assisted complaint management
- Classifies complaint categories and priorities using Ollama.
- Uses complaint information to determine the appropriate department.
- Supports manual review when classification requires administrator attention.
- Automatically routes complaints and supports staff assignment based on workload.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, Tailwind CSS |
| Build tool | Vite |
| Backend | Java 25, Spring Boot |
| Security | Spring Security, JWT |
| Persistence | Spring Data JPA, Hibernate |
| Database | PostgreSQL |
| AI | Ollama, Qwen 2.5 (3B) |
| API communication | REST APIs |
| Development tools | IntelliJ IDEA, VS Code, Postman, Git |

## Architecture

The application follows a frontend-backend architecture.

1. **React frontend:** Provides the user interface for students, staff, and administrators.
2. **Spring Boot backend:** Handles business logic, authentication, complaint processing, and REST API requests.
3. **Spring Security and JWT:** Protect application endpoints and enforce role-based access.
4. **Spring Data JPA and Hibernate:** Handle communication between the backend and PostgreSQL.
5. **PostgreSQL:** Stores users, departments, complaints, assignments, and complaint history.
6. **Ollama:** Provides the local AI model used for complaint classification.

## Project Structure

```text
complaint_system/
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
│
├── src/
│   ├── main/
│   │   ├── java/com/college/complaint_system/
│   │   └── resources/
│   │       └── application.yaml
│   │
│   └── test/
│
├── .gitignore
├── mvnw
├── mvnw.cmd
├── pom.xml
└── README.md
```

## Prerequisites

Install the following before running the application:

- Java 25
- PostgreSQL
- Node.js and npm (a Node.js version supported by Vite 8)
- Ollama
- Git (optional)

## Database Setup

1. Start PostgreSQL.
2. Create a database named `complaint_system`.

```sql
CREATE DATABASE complaint_system;
```

3. Configure the database credentials using the environment variables described below.

The application uses Hibernate's `ddl-auto: update` setting to update the database schema.

## Environment Configuration

The backend uses environment variables for database credentials and JWT configuration.

Configure the following variables:

| Variable | Description |
|---|---|
| `DB_URL` | PostgreSQL JDBC connection URL |
| `DB_USERNAME` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Long, randomly generated JWT signing secret |

Example database URL:

```text
jdbc:postgresql://localhost:5432/complaint_system
```

Do not commit actual passwords, API keys, or JWT secrets to Git.

## Running the Backend

Open a terminal in the project root directory.

Set the environment variables in PowerShell for the current terminal session:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/complaint_system"
$env:DB_USERNAME="your_database_username"
$env:DB_PASSWORD="your_database_password"
$env:JWT_SECRET="your_long_random_secret"
```

Replace the example values with your actual local configuration.

Run the Spring Boot application:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

## Running the Frontend

Open a separate terminal:

```powershell
cd frontend
```

Install dependencies using the lockfile:

```powershell
npm ci
```

Start the development server:

```powershell
npm run dev
```

Open the local URL displayed by Vite in your terminal (normally `http://localhost:5173`).

## Running the AI Classification Service

The application uses Ollama with the `qwen2.5:3b` model.

Make sure Ollama is installed and running.

Pull the model if it is not already available:

```bash
ollama pull qwen2.5:3b
```

The local Ollama API endpoint used by the application is:

```text
http://localhost:11434/api/chat
```

Keep Ollama running while testing AI-assisted complaint classification.

## Demo Login Accounts

The following accounts are seeded by the application for demonstration and testing.

| Role | Email | Password |
|---|---|---|
| Student | student@college.com | student123 |
| Admin | admin@college.com | admin123 |
| IT Staff | it.staff@college.com | staff123 |
| IT Staff 2 | it.staff2@college.com | staff123 |
| Hostel Staff | hostel.staff@college.com | staff123 |
| Academic Staff | academic.staff@college.com | staff123 |
| Infrastructure Staff | infra.staff@college.com | staff123 |
| Transport Staff | transport.staff@college.com | staff123 |

**Security note:** These are demonstration credentials. Replace or disable seeded accounts and use secure passwords before deploying the application in a real environment.

## API Overview

The backend exposes REST APIs under `/api`.

### Complaint APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/complaints` | Submit a complaint |
| GET | `/api/complaints/my` | View the logged-in student's complaints |
| GET | `/api/complaints` | Retrieve complaints |
| GET | `/api/complaints/{id}` | Retrieve complaint details |
| GET | `/api/complaints/{complaintId}/history` | View complaint history |
| PATCH | `/api/complaints/{complaintId}/status` | Update complaint status |
| POST | `/api/complaints/{complaintId}/close` | Close a complaint |
| POST | `/api/complaints/{complaintId}/reopen` | Reopen an eligible complaint |
| GET | `/api/complaints/assigned` | View complaints assigned to staff |

### Administrator APIs

| Method | Endpoint | Purpose |
|---|---|---|
| PUT | `/api/admin/complaints/{complaintId}/assign` | Assign complaint to staff |
| GET | `/api/admin/complaints/review-queue` | View complaints requiring review |
| GET | `/api/admin/complaints/unassigned-queue` | View unassigned complaints |
| PATCH | `/api/admin/complaints/{complaintId}/review` | Review a complaint |
| GET | `/api/admin/staff` | Retrieve staff |
| POST | `/api/admin/staff` | Create staff account |
| PUT | `/api/admin/staff/{staffId}` | Update staff account |
| GET | `/api/admin/departments` | Retrieve departments |
| GET | `/api/admin/analytics` | Retrieve dashboard analytics |

Protected endpoints require appropriate authentication and role permissions.

## Complaint Lifecycle

The application supports the following complaint statuses:

- `OPEN`
- `PENDING_REVIEW`
- `ROUTED`
- `ASSIGNED`
- `IN_PROGRESS`
- `RESOLVED`
- `CLOSED`
- `REJECTED`
- `REOPENED`

Complaint history records important events during the complaint lifecycle, including creation, routing, assignment, and status changes.

## Build and Test

### Backend

From the project root:

```powershell
.\mvnw.cmd clean package
```

### Frontend

From the frontend directory:

```powershell
npm run build
```

Both backend and frontend builds have been successfully verified during development.

## Future Improvements

- Production deployment and hosting.
- Database migration management.
- Automated integration and end-to-end testing.
- Additional monitoring and reporting capabilities.

---

**Complaint Management System**  
A college-focused platform designed to improve complaint submission, tracking, assignment, and resolution through centralized management and AI-assisted classification.