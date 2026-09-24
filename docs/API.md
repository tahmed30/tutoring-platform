# API

Interactive OpenAPI / Swagger UI (when enabled in NestJS):

- **Local:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Deployed:** `https://{apiDomain}/api/docs`

Base path: `/api/v1` (`API_PREFIX`).

## Endpoint groups

| Group | Prefix | Description |
|-------|--------|-------------|
| Health | `/api/v1/health` | Liveness for ALB / ECS |
| Auth | `/api/v1/auth` | Register, login, refresh, logout (custom JWT) |
| Users | `/api/v1/users` | Profile and admin user management |
| Roles | `/api/v1/roles` | Role listing (STUDENT, PARENT, TEACHER, ADMIN) |
| Subjects / Courses | `/api/v1/subjects`, `/api/v1/courses` | Catalog and teacher courses |
| Enrollments | `/api/v1/enrollments` | Student course enrollment |
| Attendance | `/api/v1/attendance` | Daily attendance records |
| Schedule | `/api/v1/schedules` | Class schedule slots |
| Assignments | `/api/v1/assignments` | Assignments + submissions (S3 URLs) |
| Grades | `/api/v1/grades` | Grade book entries |
| Messages | `/api/v1/messages` | Direct messages (Postgres or DynamoDB hybrid) |
| Notifications | `/api/v1/notifications` | In-app notifications |
| Payments | `/api/v1/payments` | Parent payments for students |
| Uploads | `/api/v1/uploads` | Pre-signed S3 upload URLs |

Auth header: `Authorization: Bearer <access_token>`.

Swagger is the source of truth for request/response schemas once controllers are registered with `@nestjs/swagger`.
