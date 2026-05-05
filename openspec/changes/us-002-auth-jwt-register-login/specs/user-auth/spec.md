# Spec: user-auth

## Overview
Define updates to authentication endpoints and standardized auth error handling.

## MODIFIED Requirements

### Requirement: Endpoint: GET /api/v1/auth/me
- **Description**: Verify current user identity
- **Auth Required**: Yes (access token in header)
- **Returns**: `{ id, nombre, email, telefono, roles, creado_en, actualizado_en }`
- **Status Codes**: 200 (success), 401 (invalid/expired token)

#### Scenario: Valid access token
- **WHEN** a request is made with a valid access token
- **THEN** the system returns 200 with the current user payload

#### Scenario: Missing or invalid token
- **WHEN** a request is made without a valid access token
- **THEN** the system returns 401

### Requirement: Error Handling
The system MUST return standardized error responses for authentication failures.

#### Scenario: Invalid token
- **WHEN** an access token is invalid
- **THEN** the system returns 401 with message "Token inválido o expirado"

#### Scenario: Expired token
- **WHEN** an access token is expired
- **THEN** the system returns 401 with message "Token expirado"

#### Scenario: Missing token
- **WHEN** an access token is missing
- **THEN** the system returns 401 with message "Token requerido"

#### Scenario: Malformed token
- **WHEN** an access token has an invalid format
- **THEN** the system returns 401 with message "Formato de token inválido"

#### Scenario: Rate limited auth request
- **WHEN** an auth endpoint request is rate limited
- **THEN** the system returns 429 with a standardized error body

## ADDED Requirements

### Requirement: Endpoint: POST /api/v1/auth/login
The system MUST authenticate a user using credentials and issue access + refresh tokens.

#### Scenario: Successful login
- **WHEN** valid credentials are submitted
- **THEN** the system returns 200 with a new access token and refresh token

#### Scenario: Invalid credentials
- **WHEN** invalid credentials are submitted
- **THEN** the system returns 401 with a standardized error body

### Requirement: Endpoint: POST /api/v1/auth/refresh
The system MUST accept a refresh token and return a new access + refresh token pair.

#### Scenario: Valid refresh token
- **WHEN** a valid refresh token is submitted
- **THEN** the system returns 200 with a new access token and refresh token

#### Scenario: Invalid refresh token
- **WHEN** an invalid, expired, or revoked refresh token is submitted
- **THEN** the system returns 401 with a standardized error body

### Requirement: Endpoint: POST /api/v1/auth/logout
The system MUST revoke the provided refresh token and end the refresh session.

#### Scenario: Successful logout
- **WHEN** a valid refresh token is submitted for logout
- **THEN** the system revokes the refresh token and returns 200

#### Scenario: Invalid refresh token on logout
- **WHEN** an invalid, expired, or revoked refresh token is submitted for logout
- **THEN** the system returns 401 with a standardized error body
