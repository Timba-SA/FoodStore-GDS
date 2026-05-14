# Feature Specifications: Hide Auth Links

## Requirements

### Requirement: Hide Login Button for Authenticated Users
**ID**: REQ-UI-AUTH-001
**Description**: The UI navigation must not display login or registration links to users who already have an active session.
**Acceptance Criteria**:
- When `isAuthenticated` is true, any `NavLink` with `hideWhenAuth: true` must be excluded from the visible links array.
- When `isAuthenticated` is false, the link must remain visible.
