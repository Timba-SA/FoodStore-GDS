# Manual Testing Checklist - Error Cases

This checklist verifies error handling and edge cases for user registration.

**Prerequisites**: Same as happy path
- Backend and frontend running
- PostgreSQL with migrations applied
- Test user already registered: test@example.com / TestPass123!

**Test Duration**: ~15 minutes

## 1. VALIDATION ERRORS - CLIENT SIDE

### 1.1 Empty Nombre Field
- [ ] Leave Nombre empty
- [ ] Click "Crear cuenta"
- [ ] Error appears: "El nombre es requerido"
- [ ] Form does not submit
- [ ] No API request made

### 1.2 Nombre Too Short
- [ ] Enter Nombre: "A" (1 character)
- [ ] Click "Crear cuenta"
- [ ] Error appears: "El nombre debe tener al menos 2 caracteres"
- [ ] Form does not submit
- [ ] No API request made

### 1.3 Email Empty
- [ ] Leave Email empty
- [ ] Click "Crear cuenta"
- [ ] Error appears: "El email es requerido"
- [ ] Form does not submit
- [ ] No API request made

### 1.4 Email Invalid Format
- [ ] Enter Email: "not-an-email"
- [ ] Click "Crear cuenta"
- [ ] Error appears: "Email inválido"
- [ ] Form does not submit
- [ ] No API request made

### 1.5 Email Valid Format But Without @
- [ ] Enter Email: "testemail.com"
- [ ] Click "Crear cuenta"
- [ ] Error appears: "Email inválido"
- [ ] Form does not submit
- [ ] No API request made

### 1.6 Password Empty
- [ ] Leave Password empty
- [ ] Click "Crear cuenta"
- [ ] Error appears: "La contraseña es requerida"
- [ ] Form does not submit
- [ ] No API request made

### 1.7 Password Too Short
- [ ] Enter Password: "short"
- [ ] Click "Crear cuenta"
- [ ] Error appears: "La contraseña debe tener al menos 8 caracteres"
- [ ] Form does not submit
- [ ] No API request made

### 1.8 Passwords Don't Match
- [ ] Enter Nombre: "Juan"
- [ ] Enter Email: "juan@example.com"
- [ ] Enter Password: "SecurePass123!"
- [ ] Enter Confirm Password: "DifferentPass456!"
- [ ] Click "Crear cuenta"
- [ ] Error appears: "Las contraseñas no coinciden"
- [ ] Form does not submit
- [ ] No API request made

### 1.9 Teléfono Too Long
- [ ] Enter Nombre: "Juan"
- [ ] Enter Email: "juan@example.com"
- [ ] Enter Password: "SecurePass123!"
- [ ] Enter Confirm Password: "SecurePass123!"
- [ ] Enter Teléfono: "+" (21 characters - over limit of 20)
- [ ] Click "Crear cuenta"
- [ ] Error appears: "El teléfono es demasiado largo"
- [ ] Form does not submit
- [ ] No API request made


## 2. ERROR CLEARING - USER FEEDBACK

### 2.1 Error Clears When User Fixes Field
- [ ] Leave Nombre empty and submit → Error shows "El nombre es requerido"
- [ ] Start typing in Nombre field: "J..."
- [ ] Error disappears before validation
- [ ] User can correct and resubmit

### 2.2 Multiple Field Errors
- [ ] Leave Nombre empty
- [ ] Enter Email: "invalid"
- [ ] Enter Password: "short"
- [ ] Click "Crear cuenta"
- [ ] All three errors appear simultaneously
- [ ] Each error is shown under correct field

### 2.3 Clear Each Field Individually
- [ ] From previous error state
- [ ] Type in Nombre field → nombre error disappears
- [ ] Type in Email field → email error disappears
- [ ] Type in Password field → password error disappears
- [ ] Other unmodified errors remain


## 3. SERVER ERRORS - 409 DUPLICATE EMAIL

### 3.1 Register With Existing Email
- [ ] Enter Nombre: "Different Name"
- [ ] Enter Email: "test@example.com" (already registered)
- [ ] Enter Password: "SecurePass123!"
- [ ] Enter Confirm Password: "SecurePass123!"
- [ ] Click "Crear cuenta"
- [ ] Button changes to "Registrando..."
- [ ] Button becomes disabled
- [ ] API request sent to /api/v1/auth/register
- [ ] Backend returns HTTP 409 Conflict
- [ ] Error message appears: "El email ya está registrado"
- [ ] Button returns to "Crear cuenta" (enabled)
- [ ] Form fields remain enabled (user can edit and retry)
- [ ] No redirect occurs


## 4. SERVER ERRORS - VALIDATION

### 4.1 Backend Receives Invalid Data
- [ ] Send malformed request (e.g., missing fields)
- [ ] Backend returns HTTP 400 Bad Request
- [ ] Error message appears: Generic validation error or server message
- [ ] Form remains on /register
- [ ] User can retry

### 4.2 Very Long Email (Over System Limits)
- [ ] Create email string > 254 characters
- [ ] Submit form
- [ ] Backend rejects with validation error
- [ ] Error displays properly
- [ ] No system crash


## 5. SERVER ERRORS - 500 SERVER ERROR

### 5.1 Backend Server Error Handling
- [ ] Stop backend server while form is ready to submit
- [ ] Click "Crear cuenta"
- [ ] Network request fails (connection refused)
- [ ] Error message appears: "Error desconocido al registrar"
- [ ] Button returns to normal state (enabled)
- [ ] User can retry after fixing backend

### 5.2 Database Error (e.g., Connection Lost)
- [ ] Stop PostgreSQL server
- [ ] Try to register with valid data
- [ ] Backend attempts database operation
- [ ] Connection fails
- [ ] Backend returns HTTP 500 (or similar)
- [ ] Frontend shows error message
- [ ] Form remains recoverable


## 6. EDGE CASES

### 6.1 Whitespace Handling
- [ ] Enter Nombre: "  Juan  " (with spaces)
- [ ] Enter Email: "  juan@example.com  " (with spaces)
- [ ] Enter Password: "SecurePass123!"
- [ ] Enter Confirm Password: "SecurePass123!"
- [ ] Submit form successfully
- [ ] Database stores trimmed values: "Juan" and "juan@example.com"
- [ ] API response shows trimmed values

### 6.2 Optional Teléfono Field
- [ ] Leave Teléfono empty
- [ ] Submit form with all other fields valid
- [ ] Registration succeeds
- [ ] API request includes `numero_telefono: undefined` or omitted
- [ ] User created with null/empty teléfono in database

### 6.3 Special Characters in Nombre
- [ ] Enter Nombre: "José María O'Brien-López"
- [ ] Submit successfully
- [ ] Database stores correctly
- [ ] API response displays correctly

### 6.4 Special Characters in Email
- [ ] Enter Email: "juan+test@example.co.uk" (with + and subdomain)
- [ ] Submit successfully
- [ ] Email validation accepts it
- [ ] Registration succeeds
- [ ] Email treated as unique (different from "juan@example.co.uk")

### 6.5 Case Sensitivity
- [ ] Register first user: "Juan@Example.COM"
- [ ] Try to register second user: "juan@example.com"
- [ ] Should fail with duplicate email error (emails are case-insensitive)
- [ ] Message: "El email ya está registrado"

### 6.6 Rapid Form Submissions
- [ ] Fill form with valid data
- [ ] Click "Crear cuenta" rapidly multiple times
- [ ] Only one request sent (button disabled prevents duplicates)
- [ ] Only one user created in database
- [ ] Response received once, user redirected once


## 7. LOADING STATE

### 7.1 Button State During Submission
- [ ] Click "Crear cuenta"
- [ ] Button text changes to "Registrando..."
- [ ] Button background dims (opacity reduced)
- [ ] Button cursor shows "not-allowed"
- [ ] Button cannot be clicked

### 7.2 Input Fields During Submission
- [ ] Click "Crear cuenta"
- [ ] All input fields become disabled
- [ ] User cannot type in any field
- [ ] Fields show disabled styling

### 7.3 Loading State Clears on Error
- [ ] Attempt registration that fails (e.g., duplicate email)
- [ ] While loading: Button disabled, inputs disabled
- [ ] After error received: Button re-enabled, inputs re-enabled
- [ ] User can edit and retry

### 7.4 Loading State Clears on Success
- [ ] Submit valid registration
- [ ] Loading state shows
- [ ] Success received → automatic redirect (no manual action needed)


## 8. BROWSER/NETWORK CONDITIONS

### 8.1 Very Slow Network
- [ ] Use DevTools Network Throttling (3G)
- [ ] Submit form
- [ ] Loading state persists (Button says "Registrando...")
- [ ] Wait for response
- [ ] Either succeeds or shows error appropriately

### 8.2 Network Timeout
- [ ] Simulate network timeout in DevTools
- [ ] Submit form
- [ ] After timeout, error appears
- [ ] Error message is user-friendly
- [ ] Form recoverable

### 8.3 Form Submission Without Page Reload
- [ ] Register successfully
- [ ] Verify tokens in localStorage
- [ ] Verify authStore state
- [ ] Verify automatic redirect to /dashboard
- [ ] All happens without page reload (smooth UX)


## 9. ACCESSIBILITY / USABILITY

### 9.1 Tab Navigation
- [ ] Use Tab key to navigate through form fields
- [ ] Order: Nombre → Email → Password → Confirm Password → Teléfono → Button
- [ ] Shift+Tab goes backward
- [ ] Focus visible on each field

### 9.2 Enter Key Submission
- [ ] Fill form completely
- [ ] Press Enter on any field
- [ ] Form submits (should trigger click on button)

### 9.3 Error Focus
- [ ] Submit form with errors
- [ ] First error field should be focused or highlighted
- [ ] User can immediately see which field has problem

### 9.4 Screen Reader
- [ ] All form labels properly associated with inputs
- [ ] Error messages associated with fields
- [ ] Button text clear
- [ ] Links have proper text (not just "click here")

### 9.5 Mobile Responsiveness
- [ ] DevTools: set to mobile (375px width)
- [ ] Form still readable and usable
- [ ] Inputs have proper touch target size (min 44px height)
- [ ] Keyboard doesn't hide form


## 10. FINAL SUMMARY

### After All Tests Complete:
- [ ] All validation errors handled properly
- [ ] All server errors handled gracefully
- [ ] Loading states work correctly
- [ ] User feedback is clear and helpful
- [ ] Form is accessible
- [ ] No console errors or warnings
- [ ] Database integrity maintained
- [ ] No duplicate registrations possible
- [ ] User experience is smooth and professional
