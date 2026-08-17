# project

A production-quality Spring Boot backend with JWT authentication, layered architecture
(Controller → Service → Repository), MySQL persistence, and centralized error handling.

## Tech Stack

- Java 21
- Spring Boot 3.3.4
- Maven
- Spring Web
- Spring Data JPA (Hibernate)
- Spring Security (stateless, JWT)
- MySQL 8
- Lombok
- Bean Validation (Jakarta Validation)
- JJWT 0.12.6

## Architecture

```
Controller  →  Service (interface)  →  ServiceImpl  →  Repository  →  Database
                                     ↑
                                  Mapper (Entity ↔ DTO)
```

- Controllers only handle HTTP concerns (request/response, status codes) — no business logic.
- Services contain business logic and transaction boundaries.
- Repositories are Spring Data JPA interfaces — no business logic.
- DTOs (`dto/request`, `dto/response`) are the only objects exposed over REST; entities never
  leave the service layer.
- `GlobalExceptionHandler` (`@RestControllerAdvice`) converts exceptions into a consistent
  `ApiError` JSON body.

## Project Structure

```
project-name/
├── pom.xml
├── README.md
├── .gitignore
├── .env.example
├── src/main/java/com/myapp/project/
│   ├── ProjectApplication.java
│   ├── config/          # SecurityConfig, JwtConfig, CorsConfig
│   ├── controller/       # AuthController, UserController
│   ├── service/          # UserService, AuthService (interfaces)
│   │   └── impl/         # UserServiceImpl, AuthServiceImpl
│   ├── repository/       # UserRepository
│   ├── entity/           # User
│   ├── dto/
│   │   ├── request/      # RegisterRequest, LoginRequest, UserRequest
│   │   └── response/     # UserResponse, AuthResponse
│   ├── mapper/           # UserMapper
│   ├── security/         # JwtService, JwtAuthenticationFilter, CustomUserDetailsService
│   ├── exception/        # GlobalExceptionHandler, ApiError, custom exceptions
│   ├── util/              # StringUtils
│   └── enums/             # Role
├── src/main/resources/
│   ├── application.properties
│   └── application-dev.properties
├── src/test/java/com/myapp/project/  # ProjectApplicationTests
├── src/test/resources/application-test.properties  # H2 in-memory profile
└── docs/api/
```

## Configuration

All secrets and environment-specific values are read from environment variables —
**nothing is hard-coded** in `application.properties`.

1. Copy `.env.example` to `.env` and fill in real values:

   ```bash
   cp .env.example .env
   ```

2. Required variables:

   | Variable | Description |
   |---|---|
   | `DB_URL` | JDBC URL, e.g. `jdbc:mysql://localhost:3306/project_db?useSSL=false&serverTimezone=UTC&createDatabaseIfNotExist=true` |
   | `DB_USERNAME` | MySQL username |
   | `DB_PASSWORD` | MySQL password |
   | `JWT_SECRET` | Long, random secret used to sign JWTs (`openssl rand -base64 64`) |
   | `JWT_EXPIRATION_MS` | Token lifetime in milliseconds (default `86400000` = 24h) |
   | `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed origins |
   | `SERVER_PORT` | Port the app listens on (default `8080`) |

3. Export the variables before running (or use an IDE run-configuration / a tool like
   `direnv` / `dotenv-cli` to load `.env` automatically):

   ```bash
   export $(grep -v '^#' .env | xargs)
   ```

## Setting Up MySQL

```sql
CREATE DATABASE project_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'project_user'@'localhost' IDENTIFIED BY 'a_strong_password';
GRANT ALL PRIVILEGES ON project_db.* TO 'project_user'@'localhost';
FLUSH PRIVILEGES;
```

With `spring.jpa.hibernate.ddl-auto=update` (the default), Hibernate will create/update the
`users` table automatically on startup. For production, prefer a migration tool
(Flyway/Liquibase) and set `DDL_AUTO=validate`.

## Running the Application

```bash
# 1. Set environment variables (see above)
# 2. Build
mvn clean install

# 3. Run
mvn spring-boot:run

# Or run the packaged jar
java -jar target/project.jar
```

The API will be available at `http://localhost:8080`.

## API Endpoints

### Auth (public)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user, returns a JWT |
| POST | `/api/auth/login` | Authenticate, returns a JWT |

**Register**

```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "a_secure_password"
}
```

**Login**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ada@example.com",
  "password": "a_secure_password"
}
```

Both return:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresInMs": 86400000,
  "user": {
    "id": 1,
    "fullName": "Ada Lovelace",
    "email": "ada@example.com",
    "role": "USER",
    "enabled": true,
    "createdAt": "2026-08-17T10:00:00"
  }
}
```

### Users (require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Current authenticated user's profile |
| GET | `/api/users/{id}` | Get a user by id |
| GET | `/api/users` | List all users |
| PUT | `/api/users/{id}` | Update a user's `fullName` / `email` |
| DELETE | `/api/users/{id}` | Delete a user |

### Error Response Format

```json
{
  "timestamp": "2026-08-17T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "User not found with id: '99'",
  "path": "/api/users/99"
}
```

## Testing

```bash
mvn test
```

Tests run against an in-memory H2 database via the `test` Spring profile
(`src/test/resources/application-test.properties`) — no external MySQL instance required.
