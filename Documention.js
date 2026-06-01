// ## Authentication APIs

// ### Send OTP
// Send OTP to mobile number for verification.

// **Endpoint:** `POST /api/send-otp`

// **Request Body:**
// ```json
// {
//   "mobile": "9876543210"
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "OTP sent successfully",
//   "user_id": "123",
//   "debug_otp": "1234"
// }
// ```

// **Validation:**
// - `mobile` (required, string, 10 digits)

// ---

// ### Verify OTP
// Verify OTP and authenticate user.

// **Endpoint:** `POST /api/verify-otp`

// **Request Body:**
// ```json
// {
//   "mobile": "9876543210",
//   "otp": "1234"
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "OTP verified successfully",
//   "user": {
//     "id": "123",
//     "name": "John Doe",
//     "email": "john@example.com",
//     "mobile": "9876543210",
//     "role": "user",
//     "status": "active",
//     "avatar": "https://example.com/avatar.jpg"
//   },
//   "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
// }
// ```

// ---

// ### Register
// Register a new user account.

// **Endpoint:** `POST /api/register`

// **Request Body:**
// ```json
// {
//   "name": "John Doe",
//   "email": "john@example.com",
//   "mobile": "9876543210",
//   "password": "password123",
//   "role": "user",
//   "store_name": "My Store",
//   "store_description": "Store description",
//   "logo": [file]
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "User registered successfully",
//   "user": {
//     "id": "123",
//     "name": "John Doe",
//     "email": "john@example.com",
//     "mobile": "9876543210",
//     "role": "user",
//     "status": "active"
//   },
//   "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
// }
// ```

// **Validation:**
// - `name` (required, string, max:255)
// - `email` (nullable, email, unique)
// - `mobile` (required, string, unique)
// - `password` (nullable, string, min:6)
// - `role` (nullable, in: user, seller, admin)
// - `store_name` (nullable, string, max:255) - for sellers
// - `store_description` (nullable, string) - for sellers
// - `logo` (nullable, image, max:2048KB) - for sellers

// ---

// ### Login
// Login with email and password.

// **Endpoint:** `POST /api/login`

// **Request Body:**
// ```json
// {
//   "email": "john@example.com",
//   "password": "password123"
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Login successful",
//   "user": {
//     "id": "123",
//     "name": "John Doe",
//     "email": "john@example.com",
//     "mobile": "9876543210",
//     "role": "user",
//     "status": "active"
//   },
//   "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
//   "redirect_to": "/"
// }
// ```
// 
// ### Get Current User
// Get authenticated user details.

// **Endpoint:** `GET /api/me`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "user": {
//     "id": "123",
//     "name": "John Doe",
//     "email": "john@example.com",
//     "mobile": "9876543210",
//     "role": "user",
//     "status": "active",
//     "avatar": "https://example.com/avatar.jpg",
//     "state": "Karnataka",
//     "city": "Bangalore",
//     "zipCode": "560001",
//     "address": "123 Main Street",
//     "landmark": "Near Park",
//     "alternativePhone": "9876543211",
//     "joinedDate": "2024-01-01T00:00:00Z",
//     "lastLoginAt": "2024-01-15T10:30:00Z"
//   }
// }
// ```

// ---

// ### Update Profile
// Update user profile information.

// **Endpoint:** `PUT /api/user/profile`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {
//   "name": "John Doe",
//   "email": "john@example.com",
//   "mobile": "9876543210",
//   "state": "Karnataka",
//   "city": "Bangalore",
//   "zipCode": "560001",
//   "address": "123 Main Street",
//   "landmark": "Near Park",
//   "alternativePhone": "9876543211"
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Profile updated successfully",
//   "user": {
//     "id": "123",
//     "name": "John Doe",
//     "email": "john@example.com",
//     "mobile": "9876543210"
//   }
// }
// ```

// ---

// ### Logout
// Logout current user session.

// **Endpoint:** `POST /api/logout`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Logged out successfully"
// }
// ```

// ---

// ### Delete Account
// Permanently delete user account.

// **Endpoint:** `POST /api/destroy-account`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {
//   "email": "john@example.com",
//   "password": "password123"
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "User account permanently deleted"
// }
// ```