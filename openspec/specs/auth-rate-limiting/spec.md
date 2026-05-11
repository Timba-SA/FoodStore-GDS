# Spec: auth-rate-limiting

## Overview
Define rate limiting rules for sensitive authentication endpoints.

## ADDED Requirements

### Requirement: Rate limits for auth endpoints
The system MUST enforce rate limits on authentication-sensitive endpoints to mitigate abuse.

#### Scenario: Login rate limit exceeded
- **GIVEN** repeated login attempts from the same client within the limit window
- **WHEN** the configured threshold is exceeded
- **THEN** the system returns HTTP 429 with a standardized error body and a Retry-After header

#### Scenario: Register rate limit exceeded
- **GIVEN** repeated registration attempts from the same client within the limit window
- **WHEN** the configured threshold is exceeded
- **THEN** the system returns HTTP 429 with a standardized error body and a Retry-After header

#### Scenario: Refresh rate limit exceeded
- **GIVEN** repeated refresh attempts from the same client within the limit window
- **WHEN** the configured threshold is exceeded
- **THEN** the system returns HTTP 429 with a standardized error body and a Retry-After header

#### Scenario: Order creation rate limit exceeded
- **GIVEN** repeated order creation attempts from the same client within the limit window
- **WHEN** the configured threshold is exceeded
- **THEN** the system returns HTTP 429 with a standardized error body and a Retry-After header

### Requirement: Rate limit identity and scope
The system MUST apply rate limiting at minimum by client identifier (IP or equivalent) and endpoint.

#### Scenario: Limits are endpoint-specific
- **GIVEN** a client has exceeded the limit for one endpoint
- **WHEN** the client calls a different endpoint with a separate limit bucket
- **THEN** the request is evaluated against that endpoint's limit, not the previous one

### Requirement: Standardized error format for rate limiting
The system MUST return a consistent error format for rate-limited responses.

#### Scenario: Rate limited response payload
- **WHEN** a request is rejected due to rate limiting
- **THEN** the response body includes an error object with a machine-readable code and human-readable message
