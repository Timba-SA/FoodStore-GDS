# Spec: refresh-token-management

## Overview
Define updates to refresh token rotation, replay detection, and logout revocation.

## MODIFIED Requirements

### Requirement: Rotation Mechanism
When a refresh token is used to obtain a new access token, the system MUST validate the token, detect replay, rotate the token, and return a new pair.

#### Scenario: Replay detected on used token
- **WHEN** a refresh token with a non-null used timestamp is submitted
- **THEN** the system revokes all tokens in the same family, returns 401, and requires re-authentication

#### Scenario: Valid refresh token rotates
- **WHEN** a valid, unexpired, unrevoked refresh token is submitted
- **THEN** the system marks it used, issues a new refresh token in a new family, and returns a new access token

### Requirement: Explicit Revocation (Logout)
When a user logs out, the system MUST revoke the submitted refresh token.

#### Scenario: Logout revokes refresh token
- **WHEN** a valid refresh token is submitted to logout
- **THEN** the system sets revocado_en for that token and returns 200

#### Scenario: Logout with invalid token
- **WHEN** an invalid, expired, or revoked refresh token is submitted to logout
- **THEN** the system returns 401

### Requirement: Error Responses
The system MUST return standardized error responses for refresh token failures.

#### Scenario: Invalid or expired refresh token
- **WHEN** a refresh token is invalid, expired, revoked, or user not found
- **THEN** the system returns 401 with message "Token inválido o expirado"

#### Scenario: Malformed refresh token
- **WHEN** a refresh token is malformed
- **THEN** the system returns 400 with message "Formato de token inválido"
