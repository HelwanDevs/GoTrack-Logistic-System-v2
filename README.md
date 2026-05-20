---
title: GoTrack Project Structure & Architecture
description: Overview of the GoTrack Logistic System microservices architecture, directory layout, tech stack, infrastructure, and complete API endpoint documentation.
---

# GoTrack — Project Structure & Architecture

## Project Overview

GoTrack is a **logistics and supply chain management platform** built as a Spring Boot microservices application. It enables merchants to manage products, inventory, shipments, pickups, finances, and complaints — all coordinated through an API Gateway with Eureka service discovery.

### You can find more about system documentation here 👇
## [Project Documentation](https://github.com/HelwanDevs/GoTrack-Logistic-System/tree/documentation)


### You can find The NLP PROJECT HERE 👇
## [Project GITHUB LINK](https://github.com/SalmaEzz10/CloudNLPUpdated)
## [MODEL LINK](https://drive.usercontent.google.com/download?id=1QwH7bmoV00iorTlry9lnKu6XTSYOcuiR&export=download&authuser=0&confirm=t&uuid=d61ca77b-c153-4653-ac0d-f80a7a6cfcc4&at=ALBwUgngWOUdvcAFxtPr8QpZk5fi:1778936505643)

> put the model in `arabertNER_Model` folder 

## [NOTEBOOK LINK](https://colab.research.google.com/drive/1Q3KnafOA-WfzxKnqhKgbt462NxT8LVyS?usp=sharing)

## How to Run

### Prerequisites

- **Docker** & **Docker Compose** installed
- **Java 21** (if running services locally without Docker)
- **Node.js 18+** & **npm** (for frontend development)
- **Maven** (if building services locally)

### Option 1: Using Docker Compose (Recommended)

> Important! you have to make sure there is a copy of the RSA keys folder into each service

> we used SSM AWS Services to handel the RSA keys in production


1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - MongoDB (port 27017)
   - MySQL (port 3306)
   - PostgreSQL (port 5432)
   - Service Discovery (port 8761)
   - API Gateway (port 8080)
   - Auth Service
   - User-Branch Service 
   - Inventory Service 
   - Core Logistic Finance
2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop all services:**
   ```bash
   docker-compose down
   ```
4. **Running Admin Dashboard:**

> **Note:** This frontend is only a proof of concept (PoC) for frontend integration with the microservices application and API Gateway.

You can run the frontend to test the integration and API requests with the following services:

- Auth Service
- User Branch Service
- Core Logistic Service

> For better testing, we recommend testing the APIs directly using the Postman collection located in:

```bash
/postman/SE-2-API-Collection
```

### Running the Frontend

#### Admin Dashboard
```bash
cd frontend/admin-dashboard
npm install
npm run dev
```
Access at: `http://localhost:5173`

`Frontend is integrated by default with localhost:8080 `

### Super Admin Account
```
{
  _id: ObjectId('69ea6de547f8518fb6b09b7b'),
  email: 'admin_admin@admin.com',
  password: '$2a$10$tPlJ6EiUvmZtNnYebrtfJOiMsTzfkZUO8tIvUk2s6UWFN8eLNvZVG',
  role: 'ADMIN',
  superAdmin: true,
  updatedAt: ISODate('2026-04-27T05:52:24.471Z'),
  deleted: false,
  _class: 'com.gotrack.auth_service.entity.Account'
}
```
Add This account manualy in mongoDB in "auth-database" > "accounts"


> Email : admin_admin@admin.com , Password : 1234567

### Service Access URLs

| Service | URL |
|---------|-----|
| **API Gateway** | http://localhost:8080 |
| **Service Discovery (Eureka)** | http://localhost:8761 |
| **Admin Dashboard** | http://localhost:5173 |

### Testing APIs

Import the Postman collection to test all endpoints:
```bash
# Import this file into Postman
postman/SE-2-API-Collection.json
```

### Troubleshooting

- **Services not registering with Eureka:** Ensure Service Discovery is running first
- **Database connection errors:** Verify database containers are running with `docker-compose ps`
- **Port conflicts:** Check if ports 8080-8083, 8761, 9091, 5173-5174 are available
- **JWT validation errors:** Ensure RSA keys are properly configured in `keys/` directory


## Directory Layout

```
SE-2/
├── api-gateway/                   # Spring Cloud Gateway — routing & load balancing
├── auth-service/                  # Authentication — JWT/RSA, accounts, roles, refresh tokens (MongoDB)
├── service-discovery/             # Eureka Server — service registry
├── inventory-service/             # Product & inventory management (MySQL)
├── core-logistic-finance/         # Shipments, pickups, transactions, wallets (MySQL)
├── user-branch-service/           # Branches & profiles (users: employees, couriers, customers) (PostgreSQL)
├── support_and_notifications_service/  # Complaints & notifications (MongoDB)
├── frontend/
│   ├── admin-dashboard/           # React + TanStack Router + Tailwind v4
│   └── merchant-dashboard/        # React + TanStack Router + Tailwind v4
├── postman/                       # API test collection
├── docker-compose.yml             # Orchestrates MongoDB + services
└── logs/                          # Runtime logs
```


## Architecture Diagram

```
┌──────────────┐    ┌──────────────┐
│ Admin Dashboard│    │Merchant Dashboard│
│  (port 5173)  │    │  (port 5174)   │
└──────┬───────┘    └──────┬───────┘
       │ HTTPS              │ HTTPS
       ▼                    ▼
┌─────────────────────────────────────────┐
│         API Gateway (port 8080)         │
│    Spring Cloud Gateway + Eureka Client │
└──┬────────────┬──────────┬──────────┬──┘
   │            │          │          │
   ▼            ▼          ▼          ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐
│ Auth    │  │Inventory│  │Core-   │  │Support &  │
│ Service │  │Service  │  │Logistic│  │Notifications│
│ :8081   │  │ :8083  │  │Finance │  │Service     │
│ (Mongo) │  │(MySQL) │  │:9091  │  │(Mongo)    │
└────────┘  └────────┘  └────────┘  └──────────┘
                                              ┌──────────┐
                                              │Branch &  │
                                              │User Svc  │
                                              │:8082     │
                                              │(PG)      │
                                              └──────────┘
┌──────────────────────────────────────────────────────┐
│                Eureka Server (port 8761)              │
│              Service Discovery Registry               │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│              MongoDB (port 27017)                     │
│              MySQL (port 3306)                        │
│              PostgreSQL (port 5432)                   │
└──────────────────────────────────────────────────────┘
```

## Services Summary

| Service | Port | DB | Framework | Auth | Key Role |
|---------|------|----|-----------|------|----------|
| **api-gateway** | 8080 | — | Spring Cloud Gateway | N/A | Request routing, load balancing |
| **auth-service** | 8081 | MongoDB | Spring Boot 4.0.5, JJWT | BCrypt + JWT (HMAC/RSA) + AOP logging | Account management, login/logout, role-based auth |
| **core-logistic-finance** | 8082 | MySQL | Spring Boot 4.0.5, JPA, MapStruct | None (gateway auth) | Shipments, pickups, transactions, wallets |
| **user-branch-service** | 8083 | PostgreSQL | Spring Boot 4.0.5, JPA, ModelMapper | JJWT + Feign + auth0 jwt | Branches, profiles (employees, couriers, customers) |
| **inventory-service** | 8084 | MySQL | Spring Boot 4.0.6, JPA, MapStruct, JJWT, Feign | JWT validation + Role header | Products & inventory items |
| **support_and_notifications** | — | MongoDB | Spring Boot 4.0.5, JJWT, AOP | JJWT + @PreAuthorize | Complaints lifecycle + multi-channel notifications |
| **service-discovery** | 8761 | — | Spring Boot, Eureka Server | N/A | Service registry |

## Tech Stack

- **Backend:** Java 21, Spring Boot 4.0.5/4.0.6, Spring Cloud 2025.1.1
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Router, TanStack React Query
- **Databases:** MongoDB (auth, notifications), MySQL (inventory, finance), PostgreSQL (branches/profiles)
- **Infrastructure:** Docker Compose, Eureka (service discovery), Spring Cloud Gateway
- **Security:** Spring Security, JWT (jjwt 0.11.5), BCrypt, RSA fallback, method security (@PreAuthorize)
- **Mapping:** MapStruct (inventory, finance), ModelMapper (user-branch)
- **Validation:** Jakarta Bean Validation, Lombok, AOP logging

## Key Patterns

- **Microservices** with independent databases (polyglot persistence)
- **API Gateway** routes `/auth/**` → auth-service; other routes delegated to Eureka-discovered services
- **JWT-based auth** — auth-service generates signed tokens; other services validate via JJWT
- **Eureka** service discovery for dynamic service registration
- **AOP** logging across services
- **Soft deletes** — accounts, branches, and profiles use `deleted` flags instead of cascade deletes
- **Two-Layer JWT Security** — Client JWT validated by gateway; internal JWT validated by services (RS256)

## Database Per Service

| Service | Database | URL / Driver |
|---------|----------|--------------|
| auth-service | MongoDB | `mongodb://root:secret@mongodb:27017/auth_db` |
| inventory-service | MySQL | `jdbc:mysql://localhost:3306/core_logistic_finance` |
| core-logistic-finance | MySQL | `jdbc:mysql://localhost:3306/core_logistic_finance` |
| user-branch-service | PostgreSQL | `jdbc:postgresql://localhost:5432/user_branch_db` |
| support_and_notifications | MongoDB | MongoDB (auth_db) |

---

# Complete API Endpoint Documentation

## 1. Auth Service — 9 Endpoints

**Base:** `http://localhost:8081`

| # | Method | Path | Description | Auth |
|---|--------|------|-------------|------|
| 1 | POST | `/api/auth/login` | Authenticate → JWT + refresh token | None |
| 2 | POST | `/api/auth/logout` | Invalidate refresh token | None |
| 3 | POST | `/api/auth/refresh-token` | Exchange refresh token for new tokens | Any |
| 4 | POST | `/api/auth/accounts` | Create account with role | ADMIN only |
| 5 | GET | `/api/auth/accounts` | List accounts (filtered, paginated) | ADMIN only |
| 6 | GET | `/api/auth/accounts/{id}` | Get account by ID | Any |
| 7 | PUT | `/api/auth/accounts/{id}` | Update account (email/password/role) | Any |
| 8 | DELETE | `/api/auth/accounts/{id}` | Soft-delete account | ADMIN only |
| 9 | GET | `/api/auth/accounts/super-admin/{id}` | Check super admin status | Any |

## 2. User-Branch Service — 12 Endpoints

**Base:** `http://localhost:8082`

### Branches
| # | Method | Path | Description | Auth |
|---|--------|------|-------------|------|
| 10 | POST | `/api/branches` | Create branch | ADMIN or EMPLOYEE |
| 11 | GET | `/api/branches/{id}` | Get branch by ID | Any |
| 12 | GET | `/api/branches` | List branches (paginated) | Any |
| 13 | PUT | `/api/branches/{id}` | Full update branch | ADMIN or EMPLOYEE |
| 14 | DELETE | `/api/branches/{id}` | Soft-delete branch | ADMIN only |
| 15 | GET | `/api/branches/search` | Search by name/location/phone | ADMIN or EMPLOYEE |

### Profiles
| # | Method | Path | Description | Auth |
|---|--------|------|-------------|------|
| 16 | POST | `/api/users/profiles` | Create profile | ADMIN or EMPLOYEE |
| 17 | GET | `/api/users/profiles/{id}` | Get profile by ID | Any |
| 18 | PUT | `/api/users/profiles/{id}` | Update profile | ADMIN or EMPLOYEE |
| 19 | GET | `/api/users/profiles` | List profiles (paginated, sorted) | ADMIN or EMPLOYEE |
| 20 | GET | `/api/users/profiles/search` | Search by name/phone/type/branch/status | ADMIN or EMPLOYEE |
| 21 | GET | `/api/users/profiles/account/{accountId}` | Get profile by accountId | Any |

## 3. Inventory Service — 7 Endpoints

**Base:** `http://localhost:8083`

### Products
| # | Method | Path | Description | Auth |
|---|--------|------|-------------|------|
| 22 | POST | `/api/inventory/products` | Create product | ADMIN or EMPLOYEE |
| 23 | PUT | `/api/inventory/products/{id}` | Update product | ADMIN or EMPLOYEE |
| 24 | GET | `/api/inventory/products/merchent/{id}` | Get products by merchant ID (note: typo) | ADMIN or EMPLOYEE |
| 25 | GET | `/api/inventory/products/myProducts` | Get authenticated merchant's products | MERCHANT only |

### Inventory Items
| # | Method | Path | Description | Auth |
|---|--------|------|-------------|------|
| 26 | POST | `/api/inventory/items/receive` | Receive items into inventory | ADMIN or EMPLOYEE |
| 27 | GET | `/api/inventory/items` | List all inventory items | Any |
| 28 | GET | `/api/inventory/items/search` | Search with filters | Any |

**Total: 28 endpoints across 3 services**

---

## Service-to-Service Integration (Feign Clients)

### Data Flow Diagram

```
┌─────────────────┐         ┌──────────────────┐
│  Auth Service   │◄────────│  User-Branch Svc │
│  (port 8081)    │         │  (port 8082)     │
└─────────────────┘         └───────┬──────────┘
   ▲                               │
   │  AuthClient (Feign)           │  UserClient (Feign)
   │  - getAccountById()           │  - getProfileByAccountId()
   │  - isSuperAdmin()             │  - getProfileById()
   │                               │
   │                       ┌───────┴──────────┐
   │                       │  Inventory Svc   │
   │                       │  (port 8083)     │
   │                       └───────┬──────────┘
   │                               │
   │                    BranchClient (Feign)    PickupClient (Feign)
   │                    - getBranchById()       - getPickup()
   └────────────────────────────────────────────┘
```

### Feign Client Summary

| Consumer | Provider | Endpoint | Purpose |
|----------|----------|----------|---------|
| user-branch-service (AuthClient) | auth-service | `GET /api/auth/accounts/{id}` | Validate account exists |
| user-branch-service (AuthClient) | auth-service | `GET /api/auth/accounts/super-admin/{id}` | Check super admin status |
| inventory-service (BranchClient) | user-branch-service | `GET /api/branches/{branchId}` | Validate branch exists |
| inventory-service (UserClient) | user-branch-service | `GET /api/users/profiles/account/{accountId}` | Resolve merchant profile |
| inventory-service (UserClient) | user-branch-service | `GET /api/users/profiles/{id}` | Get profile by ID |
| inventory-service (PickupClient) | core-logistic-finance | `GET /api/pickups/{id}` | Check pickup status |

All Feign clients use `FeignConfig` to propagate `X-Internal-Token`, `X-Account-Id`, `X-Email`, `X-User-Role` headers.

---

## Security Architecture

### Two-Layer JWT Authentication

The platform implements a **two-layer JWT security model** using RSA (RS256):

1. **Client JWT** — Issued by `auth-service` on login. Contains `sub` (email), `accountId`, `role`. Validated by `api-gateway` using auth-service's public key.
2. **Internal JWT** — Generated by `api-gateway` after validating the client JWT. Contains `sub`, `role`, `requestId`. Signed with gateway's private key. Verified by backend services using gateway's public key.

### Request Flow

```
Client → [Bearer <client JWT>]
     → API Gateway: AuthenticationGlobalFilter
         - Validates client JWT with auth-service public key
         - Rejects invalid/expired tokens with 401
         - Generates internal JWT (RS256, 5min expiry)
         - Adds headers: X-User-Id, X-User-Role, X-Request-Id, X-Internal-Token
     → Backend Service: InternalTokenFilter
         - Validates X-Internal-Token with gateway's public key
         - Extracts role from claims
         - Applies role-based access control per endpoint
```

### Services with Security Implementation

| Service | JWT Type | Validation | Role Check |
|---------|----------|------------|------------|
| api-gateway | Client JWT | RS256 (auth-service pub key) | Generates internal JWT |
| auth-service | Client + Internal JWT | RS256 (self) | JwtFilter checks internal token |
| user-branch-service | Internal JWT only | RS256 (gateway pub key) | Controllers check role attribute |
| inventory-service | Internal JWT | RS256 (gateway pub key) | Method security with ROLE_ authorities |
| core-logistic-finance | — | Not yet implemented | Not implemented |
| support_and_notifications | — | Not yet implemented | @PreAuthorize |

### Key Files

- **Gateway:** `api-gateway/src/main/java/com/gotrack/api_gateway/filter/AuthenticationGlobalFilter.java`
- **Gateway:** `api-gateway/src/main/java/com/gotrack/api_gateway/config/JwtKeyConfig.java`
- **Auth:** `auth-service/src/main/java/com/gotrack/auth_service/Jwt/JwtService.java`
- **Auth:** `auth-service/src/main/java/com/gotrack/auth_service/Jwt/JwtFilterImpl.java`
- **Auth:** `auth-service/src/main/java/com/gotrack/auth_service/controller/AuthController.java` (internal endpoints)
- **Branch:** `user-branch-service/src/main/java/com/gotrack/user_branch_service/filter/InternalTokenFilter.java`
- **Branch:** `user-branch-service/src/main/java/com/gotrack/user_branch_service/config/JwtKeyConfig.java`

### Detailed API References

For complete request/response schemas, DTO definitions, and error formats:
- **Auth Service:** `.opencode/context/auth-service.md` (9 endpoints, full schema)
- **User-Branch Service:** `.opencode/context/user-branch-service.md` (12 endpoints, full schema)
- **Inventory Service:** `.opencode/context/inventory-service.md` (7 endpoints, full schema)

### Postman Collection

- **File:** `postman/SE-2-API-Collection.json`
- **Coverage:** All 28 endpoints across 3 services
- **Folders:** 8 groups (Auth, Branches, Profiles, Products, Inventory Items, Feign Integration, E2E Scenarios, Auth Flow Reset)
- **Variables:** 10 dynamic placeholders (tokens, IDs) with clear instructions
