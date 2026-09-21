// ## Authentication APIs

// ### Send OTP
// Send OTP to mobile number for verification.

// **Endpoint:** `POST /api/send-otp`

// **Request Body:**
// ```json
// {
//   "mobile": "9876543210",
//   "fcm_token": "fXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//   "device_type": "android"
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "OTP sent successfully",
//   "user_id": "123",
//   "debug_otp": "1234"
// }
// ```

// **Validation:**
// - `mobile` (required, string, 10 digits)
// - `fcm_token` (optional/recommended, string, FCM device push token)
// - `device_type` (optional/recommended, string: 'android' | 'ios')

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

//User Profile Update :
// POST : {{base_url}}api/user/profile
// authorization : bearer_token {seller_token}

// body :
// name: User_A59bgo
// //email: rajesh.kumar@example.com
// mobile: 8240804149
// //state: Odisha
// //city: Cuttack
// //zipCode: 753001
// //address: 123 Main Road, Buxi Bazar
// //landmark: Near City Hospital
// //alternativePhone: 9861234567ma
// logo : file

// response:
// {
//     "status": 200,
//     "message": "Profile updated successfully",
//     "user": {
//         "id": "82",
//         "name": "User_A59bgo",
//         "email": null,
//         "mobile": "8240804149",
//         "role": "user",
//         "status": "active",
//         "approval_status": "approved",
//         "avatar": "https://deebazar.com/admin/images/uploads/logo/1789544914_6aaa49d299eb4.png",
//         "store_name": null,
//         "store_description": null,
//         "state": null,
//         "city": null,
//         "zipCode": null,
//         "address": null,
//         "landmark": null,
//         "alternativePhone": null,
//         "joinedDate": "2026-08-21T13:23:00+05:30",
//         "lastLoginAt": "2026-09-14T21:15:15+05:30"
//     }
// }

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

// /. Send Delete Account OTP
// Method: POST
// URL:
// https://deebazar.com/api/send-delete-account-otpHeaders:
// Content-Type: application/json
// Accept: application/jsonPostman Body → raw → JSON

// {
//     "mobile": "9876543210"
// }Success Response

// {
//     "status": 200,
//     "message": "OTP sent successfully"
// }User Not Found

// {
//     "status": 404,
//     "message": "User not found"
// }Validation Error

// {
//     "status": 400,
//     "errors": {
//         "mobile": [
//             "The mobile field is required."
//         ]
//     }
// }SMS Failed

// {
//     "status": 400,
//     "message": "Failed to send OTP. Please try again."
// }

// 2. Permanently Delete Account
// Method: POST
// URL:
// https://deebazar.com/api/delete-accountHeaders:
// Content-Type: application/json
// Accept: application/jsonPostman Body → raw → JSON

// {
//     "mobile": "9876543210",
//     "otp": "1234",
//      reasons:'I no longer want to use the app'
 // }The otp should be the OTP received by the user through SMS.
// Success Response

// {
//     "status": 200,
//     "message": "User account permanently deleted"
// }OTP Expired / Not Generated

// {
//     "status": 400,
//     "message": "OTP not generated or expired"
// }Invalid OTP

// {
//     "status": 400,
//     "message": "Invalid OTP"
// }User Not Found

// {
//     "status": 404,
//     "message": "User not found"
// }Validation Error

// {
//     "status": 400,
//     "errors": {
//         "mobile": [
//             "The mobile field is required."
//         ],
//         "otp": [
//             "The otp field is required."
//         ]
//     }
// }Debdas  [12:50 PM]
// {
//     "reasons": [
//         "I no longer want to use the app",
//         "I am not satisfied with the service",
//         "I found another app",
//         "Too many notifications",
//         "Privacy concerns",
//         "Technical issues",
//         "I created this account by mistake",
//         "Other"
//     ]
// }
// Message all-hittok-conquer

// ### Get All Categories
// Get list of all active categories.

// **Endpoint:** `GET /api/categories`

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Categories retrieved successfully",
//   "data": [
//     {
//       "id": 1,
//       "name": "Electronics",
//       "slug": "electronics",
//       "image": "https://example.com/categories/electronics.jpg",
//       "description": "Electronic items"
//     }
//   ]
// }
// ```

// ---

// ### Get Category by Slug
// Get single category with subcategories.

// **Endpoint:** `GET /api/categories/{slug}`

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Category retrieved successfully",
//   "data": {
//     "id": 1,
//     "name": "Electronics",
//     "slug": "electronics",
//     "image": "https://example.com/categories/electronics.jpg",
//     "description": "Electronic items",
//     "subcategories": [
//       {
//         "id": 1,
//         "name": "Mobiles",
//         "slug": "mobiles",
//         "image": "https://example.com/subcategories/mobiles.jpg"
//       }
//     ]
//   }
// }
// ```

// ---

// ### Get Categories (Legacy)
// Legacy endpoint for categories.

// **Endpoint:** `POST /api/category`

// **Request Body:**
// ```json
// {}
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Category List",
//   "data": [
//     {
//       "id": 1,
//       "name": "Electronics",
//       "image": "https://example.com/categories/electronics.jpg",
//       "count_sub_category": 5
//     }
//   ]
// }
// ```

// ---

// ### Get Sub Categories
// Get subcategories by category ID.

// **Endpoint:** `POST /api/sub-category`

// **Request Body:**
// ```json
// {
//   "category_id": 1
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Sub Category List",
//   "data": [
//     {
//       "id": 1,
//       "name": "Mobiles",
//       "category_id": 1,
//       "category_name": "Electronics",
//       "image": "https://example.com/subcategories/mobiles.jpg",
//       "count_child_category": 3
//     }
//   ]
// }
// ```

// ---

// ### Get Child Categories
// Get child categories by category and subcategory ID.

// **Endpoint:** `POST /api/child-category`

// **Request Body:**
// ```json
// {
//   "category_id": 1,
//   "sub_category_id": 1
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Child Category List",
//   "data": [
//     {
//       "id": 1,
//       "name": "Smartphones",
//       "image": "https://example.com/child-categories/smartphones.jpg",
//       "category_name": "Electronics",
//       "sub_category_name": "Mobiles",
//       "category_id": 1,
//       "sub_category_id": 1,
//       "count_product": 10
//     }
//   ]
// }
// ```

// ---

// ## Product APIs

// ### Get Products
// Get products with optional filters and pagination.

// **Endpoint:** `POST /api/product`

// **Request Body:**
// ```json
// {
//   "category_id": "all",
//   "sub_category_id": null,
//   "child_category_id": null,
//   "per_page": 12,
//   "page": 1
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Product List",
//   "title_category": "Electronics",
//   "title_sub_category": "Mobiles",
//   "title_child_category": "Smartphones",
//   "data": [
//     {
//       "id": 1,
//       "name": "iPhone 15",
//       "actual_price": 79999,
//       "discount_price": 69999,
//       "short_desc": "Latest iPhone",
//       "desc": "Product description",
//       "category_id": 1,
//       "category_name": "Electronics",
//       "sub_category_id": 1,
//       "sub_category_name": "Mobiles",
//       "child_category_id": 1,
//       "child_category_name": "Smartphones",
//       "image": "https://example.com/products/iphone15.jpg",
//       "stock_quantity": 50,
//       "in_stock": true,
//       "rating": 4.5,
//       "reviews": 100,
//       "seller_id": 1,
//       "seller_name": "Apple Store"
//     }
//   ],
//   "total": 100,
//   "current_page": 1,
//   "last_page": 9,
//   "per_page": 12
// }
// ```

// ---

// ### Get Product Details
// Get detailed information about a specific product.

// **Endpoint:** `POST /api/product-details`

// **Request Body:**
// ```json
// {
//   "product_id": 1
// }
// ```**Endpoint:** `POST /api/product-details`

// **Request Body:**
// ```json
// {
//   "product_id": 1
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Product Details",
//   "data": {
//     "id": 1,
//     "name": "iPhone 15",
//     "slug": "iphone-15",
//     "sku": "IP15-001",
//     "actual_price": 79999,
//     "discount_price": 69999,
//     "short_desc": "Latest iPhone",
//     "desc": "Product description",
//     "category_id": 1,
//     "category_name": "Electronics",
//     "sub_category_id": 1,
//     "sub_category_name": "Mobiles",
//     "child_category_id": 1,
//     "child_category_name": "Smartphones",
//     "image": [
//       "https://example.com/products/iphone15-1.jpg",
//       "https://example.com/products/iphone15-2.jpg"
//     ],
//     "in_stock": true,
//     "stock_quantity": 50,
//     "rating": 0,
//     "reviews": 0,
//     "seller_id": 1,
//     "seller_name": "Apple Store",
//     "created_at": "2024-01-01T00:00:00Z",
//     "updated_at": "2024-01-15T00:00:00Z"
//   }
// }
// ```

// ---

// ### Search Products
// Search products by keyword.

// **Endpoint:** `POST /api/search`

// **Request Body:**
// ```json
// {
//   "keyword": "iPhone"
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Product Search",
//   "data": [
//     {
//       "id": 1,
//       "name": "iPhone 15",
//       "actual_price": 79999,
//       "discount_price": 69999,
//       "short_desc": "Latest iPhone",
//       "desc": "Product description",
//       "category_id": 1,
//       "category_name": "Electronics",
//       "sub_category_id": 1,
//       "sub_category_name": "Mobiles",
//       "child_category_id": 1,
//       "child_category_name": "Smartphones",
//       "image": "https://example.com/products/iphone15.jpg"
//     }
//   ]
// }
// ```

// // ---
// ## Popular Products APIs

// ### Get Popular Products (Legacy)
// Legacy endpoint for popular products.

// **Endpoint:** `GET /api/popular-products`

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "data": [
//     {
//       "id": 1,
//       "name": "iPhone 15",
//       "price": 79999,
//       "sale_price": 69999,
//       "image": "https://example.com/products/iphone15.jpg"
//     }
//   ]
// }
// ```

// ---

// ## Latest Products APIs

// ### Get Latest Products (Legacy)
// Legacy endpoint for latest products.

// **Endpoint:** `GET /api/latest-products`

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "data": [
//     {
//       "id": 1,
//       "name": "iPhone 15",
//       "price": 79999,
//       "sale_price": 69999,
//       "image": "https://example.com/products/iphone15.jpg"
//     }
//   ]
// }
// ```

// ---

// ## Deal of the Day APIs

// ### Get Deal of the Day (Legacy)
// Legacy endpoint for deal of the day products.

// **Endpoint:** `GET /api/deal-of-the-day`

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "data": [
//     {
//       "id": 1,
//       "name": "iPhone 15",
//       "price": 79999,
//       "sale_price": 69999,
//       "image": "https://example.com/products/iphone15.jpg"
//     }
//   ]
// }
// ```

// ---

// ## Featured Products APIs

// ### Get Featured Products (Legacy)
// Legacy endpoint for featured products.

// **Endpoint:** `GET /api/featured-products`

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "data": [
//     {
//       "id": 1,
//       "name": "iPhone 15",
//       "price": 79999,
//       "sale_price": 69999,
//       "image": "https://example.com/products/iphone15.jpg"
//     }
//   ]
// }
// ```

// ---

// ## Best Selling Products APIs

// ### Get Best Selling Products (Legacy)
// Legacy endpoint for best selling products.

// **Endpoint:** `GET /api/best-selling-products`

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "data": [
//     {
//       "id": 1,
//       "name": "iPhone 15",
//       "price": 79999,
//       "sale_price": 69999,
//       "image": "https://example.com/products/iphone15.jpg"
//     }
//   ]
// }
// ```

// ---
// ---

// ### Get Banners
// Get all active banners.

// **Endpoint:** `GET /api/banners`

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "data": [
//     {
//       "id": 1,
//       "title": "Summer Sale",
//       "image": "https://example.com/banners/summer.jpg",
//       "link": "/products",
//       "position": "home_top"
//     }
//   ]
// }
// ```

// ---

// ### Get Banner (Legacy)
// Legacy endpoint for banners.

// **Endpoint:** `POST /api/banner`

// **Request Body:**
// ```json
// {}
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "bannar List",
//   "data": [
//     {
//       "id": 1,
//       "name": "Summer Sale",
//       "image": "https://example.com/banners/summer.jpg",
//       "desc": "Up to 50% off",
//       "category_id": 1,
//       "category_name": "Electronics",
//       "sub_category_id": null,
//       "sub_category_name": null,
//       "child_category_id": null,
//       "child_category_name": null
//     }
//   ]
// }
// ```

// ---

// ## Cart APIs

// ### Add to Cart
// Add product to cart or update quantity.

// **Endpoint:** `POST /api/cart-to-add`

// **Request Body:**
// ```json
// {
//   "user_id": 123,
//   "product_id": 1,
//   "qty": 2
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Add to Cart Successfully"
// }
// ```

// **Validation:**
// - `user_id` (required) - User must be logged in
// - `product_id` (required)
// - `qty` (required, integer)

// ---

// ### View Cart
// Get cart items for a user.

// **Endpoint:** `POST /api/cart-view`

// **Request Body:**
// ```json
// {
//   "user_id": 123
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Cart View",
//   "extra_data": {
//     "sub_total": 139998,
//     "discount": 0,
//     "delivery_charge": 0,
//     "total_amount": 139998
//   },
//   "address_data": {
//     "id": 1,
//     "name": "John Doe",
//     "mobile": "9876543210",
//     "pin": "560001",
//     "state": "Karnataka",
//     "city": "Bangalore",
//     "house_no": "123",
//     "road_name": "Main Street",
//     "landmark": "Near Park",
//     "type": "Home"
//   },
//   "data": [
//     {
//       "product_id": 1,
//       "name": "iPhone 15",
//       "qty": 2,
//       "actual_price": 159996,
//       "discount_price": 139998,
//       "short_desc": "Latest iPhone",
//       "image": "https://example.com/products/iphone15.jpg"
//     }
//   ]
// }
// ```
// Debdas  [5:52 PM]
// ### Add to Cart
// Add or update product in cart.

// **Endpoint:** `POST /api/cart-to-add`

// **Request Body:**
// ```json
// {
//   "user_id": 1,
//   "product_id": 1,
//   "qty": 2
// }
// ```

// **Response:**
// ```json
// {
//   "status": 200,
//   "message": "Add to Cart Successfully"
// }
// ```

// ### Remove from Cart
// Remove a product from cart.

// **Endpoint:** `POST /api/cart-remove`

// **Request Body:**
// ```json
// {
//   "user_id": 1,
//   "product_id": 1
// }
// ```

// **Response:**
// ```json
// {
//   "status": 200,
//   "message": "Cart Remove Successfully"
// }
// ```
// ## Wishlist

// ### Add to Wishlist
// Add a product to wishlist.

// **Endpoint:** `POST /api/wishlist-add`

// **Request Body:**
// ```json
// {
//   "user_id": 1,
//   "product_id": 1
// }
// ```

// **Response:**
// ```json
// {
//   "status": 200,
//   "message": "Add to Wishlist Successfully"
// }
// ```

// **Response (Already in wishlist):**
// ```json
// {
//   "status": 200,
//   "message": "Product already in wishlist"
// }
// ```

// ### Remove from Wishlist
// Remove a product from wishlist.

// **Endpoint:** `POST /api/wishlist-remove`

// **Request Body:**
// ```json
// {
//   "user_id": 1,
//   "product_id": 1
// }
// ```

// **Response:**
// ```json
// {
//   "status": 200,
//   "message": "Wishlist Remove Successfully"
// }
// ```

// **Error Response (Item not found):**
// ```json
// {
//   "status": 404,
//   "message": "Wishlist item not found"
// }
// ```
// ---

// ## Address Management APIs

// ### Save Address
// Save a new address for the user.

// **Endpoint:** `POST /api/save-address`
   
// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {
//   "name": "John Doe",
//   "mobile": "9876543210",
//   "pin": "560001",
//   "state": "Karnataka",
//   "city": "Bangalore",
//   "house_no": "123",
//   "road_name": "Main Street",
//   "landmark": "Near Park",
//   "type": "Home"
    // status:1
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Address saved successfully"
// }
// ```

// ---

// ### Update Address
// Update an existing address.

// **Endpoint:** `POST /api/update-address`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {
//   "address_id": 1,
//   "name": "John Doe",
//   "mobile": "9876543210",
//   "pin": "560001",
//   "state": "Karnataka",
//   "city": "Bangalore",
//   "house_no": "123",
//   "road_name": "Main Street",
//   "landmark": "Near Park",
//   "type": "Home"
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Address updated successfully"
// }
// ```

// ---

// ### List Addresses
// Get all addresses for the user.

// **Endpoint:** `POST /api/list-address`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {}
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Address list retrieved successfully",
//   "data": [
//     {
//       "id": 1,
//       "name": "John Doe",
//       "mobile": "9876543210",
//       "pin": "560001",
//       "state": "Karnataka",
//       "city": "Bangalore",
//       "house_no": "123",
//       "road_name": "Main Street",
//       "landmark": "Near Park",
//       "type": "Home",
//       "status": "Active"
//     }
//   ]
// }
// ```

// ---

// ### Check Address
// Check if user has an active address.

// **Endpoint:** `POST /api/check-address`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {}
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "has_address": true,
//   "address": {
//     "id": 1,
//     "name": "John Doe",
//     "mobile": "9876543210",
//     "pin": "560001",
//     "state": "Karnataka",
//     "city": "Bangalore",
//     "house_no": "123",
//     "road_name": "Main Street",
//     "landmark": "Near Park",
//     "type": "Home"
//   }
// }
// ```

// ---

// ### Delete Address
// Delete an address.

// **Endpoint:** `POST /api/delete-address`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {
//   "address_id": 1
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Address deleted successfully"
// }
// ```[11:58 AM]@Ananya
// [12:00 PM]### Get Latest Products
// Get latest products.

// **Endpoint:** `GET /api/products/latest?limit=8`

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "data": [
//     {
//       "id": 1,
//       "name": "iPhone 15",
//       "slug": "iphone-15",
//       "short_description": "Latest iPhone",
//       "price": 79999,
//       "sale_price": 69999,
//       "on_sale": true,
//       "is_featured": true,
//       "is_trending": false,
//       "is_popular": false,
//       "is_deal_of_the_day": false,
//       "view_count": 1000,
//       "sales_count": 50,
//       "in_stock": true,
//       "stock_quantity": 50,
//       "image": "https://example.com/products/iphone15.jpg",
//       "gallery": [],
//       "seller": {
//         "id": 1,
//         "name": "Apple Store",
//         "shop_name": "Apple Official"
//       },
//       "categories": [
//         {
//           "id": 1,
//           "name": "Electronics",
//           "slug": "electronics"
//         }
//       ],
//       "rating": 4.5,
//       "rating_count": 100
//     }
//   ]
// }
// // ```
// Debdas  [12:02 PM]
// ## Order APIs

// ### Create Order (Legacy)
// Create a new order from cart.

// **Endpoint:** `POST /api/order`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {
//   "user_id": 123,
//   "address_id": 1
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Order created successfully",
//   "order_id": "123456"
// }
// ```

// ---

// ### Create Order (Enhanced)
// Create a new order with enhanced features.

// **Endpoint:** `POST /api/orders`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {
//   
//   "address_id": 1,
//   "payment_method": "cod"
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Order created successfully",
//   "order_id": "123456",
//   "payment_session_id": "session_xxxxxxxxx"
// }
// ```

// ---

// ### Order List
// Get list of orders for the user.

// **Endpoint:** `POST /api/order-list`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {
//   "user_id": 123
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Order list retrieved successfully",
//   "data": [
//     {
//       "id": 1,
//       "order_id_generate": "123456",
//       "amount": 139998,
//       "net_amount": 139998,
//       "order_status": "Success",
//       "created_at": "2024-01-15T10:30:00Z"
//     }
//   ]
// }
// ```

// ---

// ### Order Details
// Get details of a specific order.

// **Endpoint:** `POST /api/order-details`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {
//   "order_id": 123456
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Order details retrieved successfully",
//   "data": {
//     "id": 1,
//     "order_id_generate": "123456",
//     "name": "John Doe",
//     "mobile": "9876543210",
//     "address": "123 Main Street",
//     "amount": 139998,
//     "net_amount": 139998,
//     "order_status": "Success",
//     "items": [
//       {
//         "id": 1,
//         "product_id": 1,
//         "name": "iPhone 15",
//         "selling_price": 69999,
//         "total_amount": 139998,
//         "status": "Pending"
//       }
//     ]
//   }
// }
// ```

// ---

// ## Payment APIs

// ### Get Payment Settings
// Get payment gateway settings.

// **Endpoint:** `GET /api/payment-settings`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Response (200):**
// ```json
// {
//   "status": "success",
//   "data": {
//     "cashfree": {
//       "environment": "sandbox",
//       "api_version": "2022-09-01",
//       "production": {
//         "app_id": "your_app_id",
//         "secret_key": "set",
//         "base_url": "https://api.cashfree.com/pg"
//       },
//       "sandbox": {
//         "app_id": "your_sandbox_app_id",
//         "secret_key": "set",
//         "base_url": "https://sandbox.cashfree.com/pg"
//       },
//       "return_url": "http://localhost:8000/payment/callback",
//       "notify_url": "http://localhost:8000/payment/notify"
//     },
//     "currency": "INR",
//     "supported_payment_methods": ["card", "netbanking", "upi", "wallet", "emi", "paylater"]
//   }
// }
// ```

// ---

// ### Create Cashfree Order
// Create a payment order with Cashfree.

// **Endpoint:** `POST /api/payment/cashfree/create-order`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Request Body:**
// ```json
// {
//   "amount": 139998,
//   "customer_id": "123",
//   "email": "john@example.com",
//   "phone": "9876543210",
//   "name": "John Doe",
//   "order_note": "Product Purchase",
//   "return_url": "http://localhost:3000/payment-return",
//   "notify_url": "http://localhost:8000/payment-notify"
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": "success",
//   "data": {
//     "order_id": "ORDER_1234567890_abc123",
//     "order_amount": 139998,
//     "order_currency": "INR",
//     "payment_session_id": "session_xxxxxxxxx"
//   },
//   "checkout_url": "https://sandbox.cashfree.com/pg/view/sessions/checkout"
// }
// ```

// **Validation:**
// - `amount` (required, numeric, min:1)
// - `customer_id` (required, string)
// - `email` (required, email)
// - `phone` (required, string)
// - `name` (required, string)
// - `order_note` (nullable, string)
// - `return_url` (nullable, url)
// - `notify_url` (nullable, url)

// ---

// ### Verify Cashfree Payment
// Verify payment status with Cashfree.

// **Endpoint:** `GET /api/payment/cashfree/verify/{order_id}`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Response (200):**
// ```json
// {
//   "status": "success",
//   "data": {
//     "order_id": "ORDER_1234567890_abc123",
//     "order_status": "PAID",
//     "order_amount": 139998,
//     "payment_amount": 139998,
//     "customer_details": {
//       "customer_id": "123",
//       "customer_email": "john@example.com",
//       "customer_phone": "9876543210",
//       "customer_name": "John Doe"
//     }
//   }
// }
// ```

// ---




//
// Debdas  [11:35 AM]
// ## Orders

// ### Create Order (Main App API)
// **This is the primary order creation API to use for your app.** It automatically uses the authenticated user's cart items and selected address.

// **Endpoint:** `POST /api/orders`

// **Headers:** `Authorization: Bearer {token}`

// **Request Body:**
// ```json
// {
//   "address_id": 1,
//   "payment_method": "cashfree",
//   "coupon_code": "SAVE10"
// }
// ```

// **Request Parameters:**
// - `address_id` (required): ID of the saved address to use for shipping
// - `payment_method` (required): Payment method - "cashfree" for online payment, "cod" for cash on delivery
// - `coupon_code` (optional): Discount coupon code to apply

// **Response:**
// ```json
// {
//   "status": 200,
//   "message": "Order created successfully",
//   "order_id": 123,
//   "payment_url": "https://payments.cashfree.com/..."
// }
// ```

// **Note:** This endpoint:
// - Automatically fetches the authenticated user's cart items
// - Uses the provided address_id for shipping
// - Calculates totals including discounts and delivery charges
// - For Cashfree payment, returns a payment_url for redirecting to payment gateway
// - For COD, processes order directly without payment redirect

// ### Get Order List
// Get list of user's orders for the order history screen.

// **Endpoint:** `POST /api/order-list`

// **Headers:** `Authorization: Bearer {token}`

// **Request Body:**
// ```json
// {
//   "user_id": 1
// }
// ```

// **Response:**
// ```json
// {
//   "status": 200,
//   "message": "Order List",
//   "data": [
//     {
//       "id": 123,
//       "order_number": "ORD-123",
//       "total_amount": 5000,
//       "status": "pending",
//       "created_at": "2024-01-01T00:00:00.000000Z"
//     }
//   ]
// }
// ```

// ### Get Order Details
// Get detailed information about a specific order for the order details screen.

// **Endpoint:** `POST /api/order-details`

// **Headers:** `Authorization: Bearer {token}`

// **Request Body:**
// ```json
// {
//   "order_id": 123
// }
// ```

// **Response:**
// ```json
// {
//   "status": 200,
//   "message": "Order Details",
//   "data": {
//     "id": 123,
//     "order_number": "ORD-123",
//     "total_amount": 5000,
//     "status": "pending",
//     "items": [...],
//     "shipping_address": {...}
//   }
// }
// ``` 

// ---

// ## Seller Notification APIs

// ### Get Notifications List
// Retrieve paginated list of notifications for the authenticated seller.
//
// **Endpoint:** `GET /api/notifications`
//
// **Headers:**
// - `Authorization: Bearer {token}`
//
// **Response (200):**
// ```json
// {
//   "status": 200,
//   "data": {
//     "current_page": 1,
//     "data": [
//       {
//         "id": 17,
//         "user_id": 76,
//         "from_user_id": 82,
//         "title": "New Order Received",
//         "message": "You have received a new order #225965.",
//         "type": "info",
//         "event_type": "seller_new_order",
//         "target_audience": "all",
//         "with_email": false,
//         "email_subject": null,
//         "email_content": null,
//         "image": null,
//         "scheduled_at": null,
//         "sent_at": "2026-09-16T13:30:55.000000Z",
//         "status": "sent",
//         "is_read": false,
//         "read_at": null,
//         "views": 0,
//         "email_opens": 0,
//         "created_at": "2026-09-16T13:30:55.000000Z",
//         "updated_at": "2026-09-16T13:30:55.000000Z",
//         "deleted_at": null
//       },
//       {
//         "id": 15,
//         "user_id": 76,
//         "from_user_id": null,
//         "title": "Test Notification",
//         "message": "This is a test message to verify the notification system.",
//         "type": "info",
//         "event_type": "order_placed",
//         "target_audience": "all",
//         "with_email": false,
//         "email_subject": null,
//         "email_content": null,
//         "image": null,
//         "scheduled_at": null,
//         "sent_at": "2026-09-16T12:15:54.000000Z",
//         "status": "sent",
//         "is_read": false,
//         "read_at": null,
//         "views": 0,
//         "email_opens": 0,
//         "created_at": "2026-09-16T12:15:54.000000Z",
//         "updated_at": "2026-09-16T12:15:54.000000Z",
//         "deleted_at": null
//       }
//     ],
//     "first_page_url": "https://deebazar.com/admin/api/notifications?page=1",
//     "from": 1,
//     "last_page": 1,
//     "last_page_url": "https://deebazar.com/admin/api/notifications?page=1",
//     "links": [
//       {
//         "url": null,
//         "label": "&laquo; Previous",
//         "active": false
//       },
//       {
//         "url": "https://deebazar.com/admin/api/notifications?page=1",
//         "label": "1",
//         "active": true
//       },
//       {
//         "url": null,
//         "label": "Next &raquo;",
//         "active": false
//       }
//     ],
//     "next_page_url": null,
//     "path": "https://deebazar.com/admin/api/notifications",
//     "per_page": 20,
//     "prev_page_url": null,
//     "to": 2,
//     "total": 2
//   }
// }
// ```
//
// ---
//
// ### Get Unread Notifications Count
// Get total count of unread notifications for authenticated seller.
//
// **Endpoint:** `GET /api/notifications/unread-count`
//
// **Headers:**
// - `Authorization: Bearer {token}`
//
// **Response (200):**
// ```json
// {
//   "status": 200,
//   "unread_count": 2
// }
// ```
//
// ---
//
// ### Mark Notification As Read
// Mark a specific notification as read.
//
// **Endpoint:** `POST /api/notifications/read`
//
// **Headers:**
// - `Authorization: Bearer {token}`
//
// **Request Body:**
// ```json
// {
//   "id": 15
// }
// ```
//
// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Notification marked as read."
// }
// ```
//
// ---
//
// ### Mark All Notifications As Read
// Mark all unread notifications for authenticated seller as read.
//
// **Endpoint:** `POST /api/notifications/read-all`
//
// **Headers:**
// - `Authorization: Bearer {token}`
//
// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "All notifications marked as read."
// }
// ```

// https://deebazar.com/help-and-support.php
// https://deebazar.com/privacy-policy.php
// https://deebazar.com/terms-and-conditions.php