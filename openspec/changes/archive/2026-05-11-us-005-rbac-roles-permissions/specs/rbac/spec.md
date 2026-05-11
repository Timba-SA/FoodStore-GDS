# Spec: Role-Based Access Control

## MODIFIED Requirements

### Requirement: User Login Payload (Auth)
The login payload MUST include the user's roles to avoid unnecessary DB queries.
#### Scenario: User receives roles in JWT and response
Given an existing user with roles assigned
When the user logs in successfully
Then the JSON response MUST include a `roles` array (e.g., `["CLIENT"]`)
And the access token payload MUST include a `roles` claim with the list of roles.

## ADDED Requirements

### Requirement: Backend Role Dependency
Endpoints MUST be protectable by specific roles.
#### Scenario: Accessing a protected endpoint with correct role
Given an endpoint protected with `require_role(["ADMIN"])`
When an authenticated user with the "ADMIN" role sends a request
Then the system MUST allow access and return the resource.

#### Scenario: Accessing a protected endpoint with incorrect role
Given an endpoint protected with `require_role(["ADMIN"])`
When an authenticated user with the "CLIENT" role sends a request
Then the system MUST return a 403 Forbidden status code.

### Requirement: Admin Role Management
Admins MUST be able to assign or revoke roles from users.
#### Scenario: Admin assigns a role to a user
Given an authenticated user with the "ADMIN" role
When the user sends a `PUT /api/v1/admin/usuarios/{id}/roles` request with valid role IDs
Then the system MUST update the user's roles
And return a 200 OK status code.

#### Scenario: Admin attempts to remove their own admin role as the last admin
Given an authenticated user with the "ADMIN" role who is the ONLY admin in the system
When the user sends a `PUT /api/v1/admin/usuarios/me/roles` request omitting the "ADMIN" role ID
Then the system MUST return a 400 Bad Request status code
And prevent the operation.

### Requirement: Frontend Protected Routes
The frontend MUST prevent unauthorized users from rendering specific views.
#### Scenario: User navigates to an unauthorized route
Given a user logged into the frontend with the "CLIENT" role
When the user attempts to navigate to a route protected with "ADMIN"
Then the application MUST block rendering the view
And redirect the user to a 403 Unauthorized view or show an error Toast.


