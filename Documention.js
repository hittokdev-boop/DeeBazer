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

// ## Product SKU APIs
//
// # Product SKU List API Documentation
//
// ## 1. Overview
// The `api/sku` endpoint retrieves a paginated list of Product SKUs filtered by category, sub-category, child-category, product, specific SKU, or target gender.
//
// - **Method**: `POST`
// - **URL**: `{{base_url}}api/sku`
// - **Content-Type**: `multipart/form-data` or `application/x-www-form-urlencoded`
//
// ---
//
// ## 2. Request Headers
//
// | Header | Type | Required | Description |
// | :--- | :--- | :--- | :--- |
// | `Authorization` | String | Optional / Recommended | `Bearer <access_token>` |
// | `Accept` | String | Required | `application/json` |
//
// ---
//
// ## 3. Request Body Parameters (FormData)
//
// | Parameter | Type | Required | Description | Example |
// | :--- | :--- | :--- | :--- | :--- |
// | `category_id` | Integer / String | Optional | Filter by top-level category ID | `1` |
// | `sub_category_id` | Integer / String | Optional | Filter by sub-category ID | `2` |
// | `child_category_id`| Integer / String | Optional | Filter by child-category ID | `3` |
// | `product_id` | Integer / String | Optional | Filter SKUs belonging to a specific Product | `13` |
// | `sku_id` | Integer / String | Optional | Specific SKU ID | `8` |
// | `gender` | String | Optional | Filter by target gender (`women`, `men`, `kids`, `unisex`) | `women` |
// | `per_page` | Integer | Optional | Number of items per page (default: `10`) | `10` |
// | `page` | Integer | Optional | Page index (default: `1`) | `1` |
//
// ---
//
// ## 4. Response Structure
//
// ### 4.1 Top-Level Fields
//
// | Field | Type | Description |
// | :--- | :--- | :--- |
// | `status` | Integer | HTTP Status Code (e.g. `200`) |
// | `message` | String | Response status message (e.g. `"Product SKU List"`) |
// | `title_category` | String | Name of the filtered category (or empty string) |
// | `title_sub_category` | String | Name of the filtered sub-category (or empty string) |
// | `title_child_category` | String | Name of the filtered child-category (or empty string) |
// | `data` | Array&lt;Object&gt; | List of SKU objects matching criteria |
// | `total` | Integer | Total count of available matching items |
// | `current_page` | Integer | Current page number |
// | `last_page` | Integer | Last page number |
// | `per_page` | Integer | Number of items per page |
//
// ### 4.2 SKU Item Fields (`data[i]`)
//
// | Field | Type | Description |
// | :--- | :--- | :--- |
// | `seller_sku_id` | Integer | Identifier in seller's SKU catalog |
// | `seller_id` | Integer | Seller / Vendor ID |
// | `seller_name` | String | Seller name / store name |
// | `product_sku_id` | Integer | Unique Product SKU variant ID |
// | `product_id` | Integer | Parent Product ID |
// | `gender` | String | Target gender (`"women"`, `"men"`, etc.) |
// | `name` | String | SKU variant name (e.g. `"Collared Top Red M"`) |
// | `image` | String | URL to the primary image for this SKU |
// | `attributes` | Array&lt;Object&gt; | List of variant attributes (Color, Size, etc.) |
// | `attributes[].attribute_id` | Integer | Attribute type ID (e.g. `1`) |
// | `attributes[].attribute` | String | Attribute name (e.g. `"Color"`, `"Size"`) |
// | `attributes[].attribute_value_id` | Integer | Attribute value ID (e.g. `13`) |
// | `attributes[].value` | String | Attribute value label (e.g. `"Red"`, `"XXL"`) |
// | `actual_price` | Number | Original MRP price |
// | `discount_price` | Number | Discounted selling price |
// | `stock_quantity` | Integer | Current available stock quantity |
// | `in_stock` | Boolean | Stock availability flag (`true` / `false`) |
// | `short_desc` | String | Short summary description |
// | `desc` | String | Full product/variant description |
// | `category_id` | Integer | Category ID |
// | `category_name` | String | Category name |
// | `sub_category_id` | Integer / null | Sub-category ID |
// | `sub_category_name` | String | Sub-category name |
// | `child_category_id` | Integer / null | Child-category ID |
// | `child_category_name` | String | Child-category name |
// | `reviews` | Object / null | Customer reviews / rating info |
//
// ---
//
// ## 5. Example Request & Response
//
// ### Request:
// ```http
// POST {{base_url}}api/sku
// Authorization: Bearer <token>
// Content-Type: multipart/form-data
//
// per_page: 10
// page: 1
// gender: women
// ```
//
// ### Response:
// ```json
// {
//   "status": 200,
//   "message": "Product SKU List",
//   "title_category": "Fashion",
//   "title_sub_category": "",
//   "title_child_category": "",
//   "data": [
//     {
//       "seller_sku_id": 13,
//       "seller_id": 1,
//       "seller_name": "Hittok",
//       "product_sku_id": 12,
//       "product_id": 5,
//       "gender": "women",
//       "name": "Collared Top Red M",
//       "image": "https://deebazar.com/admin/images/uploads/skus/12/5SC9EKZOyPebafOUUEx7_1791192667.png",
//       "attributes": [
//         {
//           "attribute_id": 1,
//           "attribute": "Color",
//           "attribute_value_id": 1,
//           "value": "Red"
//         },
//         {
//           "attribute_id": 2,
//           "attribute": "Size",
//           "attribute_value_id": 13,
//           "value": "XXL"
//         }
//       ],
//       "actual_price": 499,
//       "discount_price": 449,
//       "stock_quantity": 15,
//       "in_stock": true,
//       "short_desc": "Collared Top",
//       "desc": "This is collared top",
//       "category_id": 2,
//       "category_name": "Fashion",
//       "sub_category_id": null,
//       "sub_category_name": "",
//       "child_category_id": null,
//       "child_category_name": "",
//       "reviews": null
//     },
//     {
//       "seller_sku_id": 11,
//       "seller_id": 1,
//       "seller_name": "Hittok",
//       "product_sku_id": 9,
//       "product_id": 4,
//       "gender": "women",
//       "name": "Xl",
//       "image": "https://deebazar.com/admin/images/uploads/skus/9/uvSnt3MRnjr5G2Y7BKF8_1791182638.jpg",
//       "attributes": [],
//       "actual_price": 699,
//       "discount_price": 462,
//       "stock_quantity": 2,
//       "in_stock": true,
//       "short_desc": "Dhdhnssnsn hdhsbsbs hsbssbs",
//       "desc": "Hxxhsjsj uxwbwbe d",
//       "category_id": 2,
//       "category_name": "Fashion",
//       "sub_category_id": null,
//       "sub_category_name": "",
//       "child_category_id": null,
//       "child_category_name": "",
//       "reviews": null
//     }
//   ],
//   "total": 2,
//   "current_page": 1,
//   "last_page": 1,
//   "per_page": 10
// }
// ```
//
// ---
//
// ## 6. Code Integration
//
// ```javascript
// import { getSkuListApi } from './Src/Api/Api';
//
// // Example: Fetch women's SKUs
// const response = await getSkuListApi({
//   gender: 'women',
//   perPage: 10,
//   page: 1,
// });
//
// if (response?.status === 200) {
//   const skus = response.data;
//   console.log('SKUs fetched:', skus);
// }
// ```
//
// ---
//
// ## 7. Related Documentation
// - [Product SKU Details API](file:///d:/A/New%20folder/DeeBazer/API_SKU_DETAILS_DOCUMENTATION.md)
// - [Product SKU Search API](file:///d:/A/New%20folder/DeeBazer/API_SKU_SEARCH_DOCUMENTATION.md)
//
//
//
// ---
//
// # Product SKU Details API Documentation
//
// ## 1. Overview
// The `api/sku-details` endpoint returns comprehensive details for a specific Product SKU variant, including parent product details, active SKU attributes, available option selectors (e.g., Color, Size), and sibling variants offered by the seller.
//
// - **Method**: `POST`
// - **URL**: `{{base_url}}api/sku-details`
// - **Content-Type**: `multipart/form-data` or `application/x-www-form-urlencoded`
//
// ---
//
// ## 2. Request Headers
//
// | Header | Type | Required | Description |
// | :--- | :--- | :--- | :--- |
// | `Authorization` | String | Required / Recommended | `Bearer <access_token>` |
// | `Accept` | String | Required | `application/json` |
//
// ---
//
// ## 3. Request Body Parameters (FormData)
//
// | Parameter | Type | Required | Description | Example |
// | :--- | :--- | :--- | :--- | :--- |
// | `sku_id` | Integer / String | **Yes** | Product SKU ID / Variant ID | `13` |
// | `seller_id` | Integer / String | Optional | Seller ID who offers this SKU | `2` |
//
// ---
//
// ## 4. Response Structure
//
// ### 4.1 Root Structure
// ```json
// {
//   "status": 200,
//   "message": "SKU Details",
//   "data": {
//     "product": { ... },
//     "sku": { ... },
//     "selectors": [ ... ],
//     "options": [ ... ],
//     "variants": [ ... ]
//   }
// }
// ```
//
// ### 4.2 Data Fields Breakdown
//
// #### A. `data.product` (Parent Product Catalog Info)
// | Field | Type | Description |
// | :--- | :--- | :--- |
// | `id` | Integer | Product ID |
// | `name` | String | Master product name |
// | `short_desc` | String | Brief product description |
// | `desc` | String | Full product description |
// | `category_id` | Integer | Category ID |
// | `category_name` | String | Category name |
// | `sub_category_id` | Integer / null | Sub-category ID |
// | `sub_category_name` | String | Sub-category name |
// | `child_category_id` | Integer / null | Child-category ID |
// | `child_category_name` | String | Child-category name |
// | `reviews` | Array / null | Customer ratings and reviews |
//
// #### B. `data.sku` (Active Selected Variant)
// | Field | Type | Description |
// | :--- | :--- | :--- |
// | `seller_sku_id` | Integer | Seller's SKU map ID |
// | `seller_id` | Integer | Seller ID |
// | `seller_name` | String | Seller business name |
// | `product_sku_id` | Integer | Unique Product SKU variant ID |
// | `sku_code` | String | SKU code (e.g. `SKU-NZJSO9KF`) |
// | `name` | String | SKU variant name |
// | `weight` | Number / null | Item weight in kg |
// | `dimensions` | String / null | Dimensions string (e.g. `"30x20x5"`) |
// | `image` | String | Primary variant image URL |
// | `attributes` | Array&lt;Object&gt; | Selected attribute values for this SKU |
// | `attributes[].attribute_id` | Integer | Attribute ID (e.g. `1`) |
// | `attributes[].attribute` | String | Attribute name (e.g. `"Color"`, `"Size"`) |
// | `attributes[].attribute_value_id` | Integer | Value ID (e.g. `5`) |
// | `attributes[].value` | String | Value name (e.g. `"White"`, `"XS"`) |
// | `actual_price` | Number | Original MRP price |
// | `discount_price` | Number | Discounted selling price |
// | `discount_percent` | Number | Discount percentage (e.g. `10`) |
// | `in_stock` | Boolean | In stock status (`true` / `false`) |
// | `available_qty` | Integer | Stock count available |
//
// #### C. `data.selectors` (Interactive Attribute Selectors)
// Allows direct selection of SKU variants grouped by attribute (e.g. Color, Size) with direct `product_sku_id`, image, and active/stock state.
// | Field | Type | Description |
// | :--- | :--- | :--- |
// | `attribute_id` | Integer | Attribute category ID (e.g. `1`) |
// | `attribute` | String | Attribute group name (e.g. `"Color"`, `"Size"`) |
// | `selected_value_id` | Integer | ID of the currently selected attribute value (e.g. `5`) |
// | `selected_value` | String | Label of the currently selected attribute value (e.g. `"White"`) |
// | `values` | Array&lt;Object&gt; | List of available choices for this attribute |
// | `values[].attribute_value_id` | Integer | Specific attribute value ID |
// | `values[].value` | String | Display label (e.g. `"Black"`, `"White"`) |
// | `values[].product_sku_id` | Integer | Product SKU ID linked to this variant choice |
// | `values[].image` | String | Thumbnail swatch / variant image URL |
// | `values[].in_stock` | Boolean | Stock availability for this option |
// | `values[].is_selected` | Boolean | `true` if this option is currently active |
//
// #### D. `data.options` (Available Variant Option Selectors)
// Allows building generic attribute option lists.
// | Field | Type | Description |
// | :--- | :--- | :--- |
// | `attribute_id` | Integer | Attribute category ID (e.g. `1`) |
// | `attribute` | String | Attribute group name (e.g. `"Color"`) |
// | `values` | Array&lt;Object&gt; | Available values |
// | `values[].attribute_value_id` | Integer | Specific value ID |
// | `values[].value` | String | Value display label (e.g. `"Black"`, `"White"`) |
//
// #### E. `data.variants` (All Sibling SKU Variants)
// List of all variants of this product provided by this seller.
// | Field | Type | Description |
// | :--- | :--- | :--- |
// | `seller_sku_id` | Integer | Seller's SKU map ID |
// | `seller_id` | Integer | Seller ID |
// | `seller_name` | String | Seller name |
// | `product_sku_id` | Integer | Sibling variant SKU ID |
// | `sku_code` | String | SKU code |
// | `name` | String | Sibling SKU title |
// | `weight` | Number / null | Weight |
// | `dimensions` | String / null | Dimensions |
// | `image` | String | Sibling variant image |
// | `attributes` | Array&lt;Object&gt; | Sibling attributes (Color, Size, etc.) |
// | `actual_price` | Number | Original price |
// | `discount_price` | Number | Selling price |
// | `discount_percent` | Number | Discount percent |
// | `in_stock` | Boolean | In stock status |
// | `available_qty` | Integer | Available quantity |
// | `is_selected` | Boolean | `true` if this variant is the currently active one |
//
// ---
//
// ## 5. Example Request & Response
//
// ### Request:
// ```http
// POST {{base_url}}api/sku-details
// Authorization: Bearer <bearer_token>
// Content-Type: multipart/form-data
//
// sku_id: 8
// seller_id: 2
// ```
//
// ### Response:
// ```json
// {
//     "status": 200,
//     "message": "SKU Details",
//     "data": {
//         "product": {
//             "id": 3,
//             "name": "Masoor Dal",
//             "short_desc": "Masoor Dal",
//             "desc": "This is Masoor Dal",
//             "category_id": 1,
//             "category_name": "Electronics",
//             "sub_category_id": null,
//             "sub_category_name": "",
//             "child_category_id": null,
//             "child_category_name": "",
//             "reviews": null
//         },
//         "sku": {
//             "seller_sku_id": 8,
//             "seller_id": 2,
//             "seller_name": "Demo Seller",
//             "product_sku_id": 8,
//             "sku_code": "SKU-ZC5V8WNG",
//             "name": "Masoor Dal 1 KG",
//             "weight": 2,
//             "dimensions": null,
//             "image": "https://deebazar.com/admin/images/uploads/skus/8/Q8kJG2yi2jtKm0Iq0069_1791271536.png",
//             "attributes": [
//                 {
//                     "attribute_id": 11,
//                     "attribute": "Weight",
//                     "attribute_value_id": 52,
//                     "value": "1 KG"
//                 }
//             ],
//             "actual_price": 260,
//             "discount_price": 245,
//             "discount_percent": 6,
//             "in_stock": true,
//             "available_qty": 40
//         },
//         "selectors": [
//             {
//                 "attribute_id": 11,
//                 "attribute": "Weight",
//                 "selected_value_id": 52,
//                 "selected_value": "1 KG",
//                 "values": [
//                     {
//                         "attribute_value_id": 50,
//                         "value": "250 Gm",
//                         "product_sku_id": 6,
//                         "image": "https://deebazar.com/admin/images/uploads/skus/6/0moTCoxi3xTlnXagIFyQ_1791271536.png",
//                         "in_stock": true,
//                         "is_selected": false
//                     },
//                     {
//                         "attribute_value_id": 51,
//                         "value": "500 Gm",
//                         "product_sku_id": 7,
//                         "image": "https://deebazar.com/admin/images/uploads/skus/7/bQPtbTIhbjArFdhh8sEy_1791271536.png",
//                         "in_stock": true,
//                         "is_selected": false
//                     },
//                     {
//                         "attribute_value_id": 52,
//                         "value": "1 KG",
//                         "product_sku_id": 8,
//                         "image": "https://deebazar.com/admin/images/uploads/skus/8/Q8kJG2yi2jtKm0Iq0069_1791271536.png",
//                         "in_stock": true,
//                         "is_selected": true
//                     },
//                     {
//                         "attribute_value_id": 53,
//                         "value": "2 KG",
//                         "product_sku_id": 9,
//                         "image": "https://deebazar.com/admin/images/uploads/skus/9/8ReIw1evkqVPMkj0hsYb_1791271536.png",
//                         "in_stock": true,
//                         "is_selected": false
//                     }
//                 ]
//             }
//         ],
//         "options": [
//             {
//                 "attribute_id": 11,
//                 "attribute": "Weight",
//                 "values": [
//                     {
//                         "attribute_value_id": 50,
//                         "value": "250 Gm"
//                     },
//                     {
//                         "attribute_value_id": 51,
//                         "value": "500 Gm"
//                     },
//                     {
//                         "attribute_value_id": 52,
//                         "value": "1 KG"
//                     },
//                     {
//                         "attribute_value_id": 53,
//                         "value": "2 KG"
//                     }
//                 ]
//             }
//         ],
//         "variants": [
//             {
//                 "seller_sku_id": 6,
//                 "seller_id": 2,
//                 "seller_name": "Demo Seller",
//                 "product_sku_id": 6,
//                 "sku_code": "SKU-XRXXISNU",
//                 "name": "Masoor Dal 250 Gm",
//                 "weight": 0.5,
//                 "dimensions": null,
//                 "image": "https://deebazar.com/admin/images/uploads/skus/6/0moTCoxi3xTlnXagIFyQ_1791271536.png",
//                 "attributes": [
//                     {
//                         "attribute_id": 11,
//                         "attribute": "Weight",
//                         "attribute_value_id": 50,
//                         "value": "250 Gm"
//                     }
//                 ],
//                 "actual_price": 70,
//                 "discount_price": 65,
//                 "discount_percent": 7,
//                 "in_stock": true,
//                 "available_qty": 100,
//                 "is_selected": false
//             },
//             {
//                 "seller_sku_id": 7,
//                 "seller_id": 2,
//                 "seller_name": "Demo Seller",
//                 "product_sku_id": 7,
//                 "sku_code": "SKU-SAD4EEX6",
//                 "name": "Masoor Dal 500 Gm",
//                 "weight": 1,
//                 "dimensions": null,
//                 "image": "https://deebazar.com/admin/images/uploads/skus/7/bQPtbTIhbjArFdhh8sEy_1791271536.png",
//                 "attributes": [
//                     {
//                         "attribute_id": 11,
//                         "attribute": "Weight",
//                         "attribute_value_id": 51,
//                         "value": "500 Gm"
//                     }
//                 ],
//                 "actual_price": 135,
//                 "discount_price": 125,
//                 "discount_percent": 7,
//                 "in_stock": true,
//                 "available_qty": 80,
//                 "is_selected": false
//             },
//             {
//                 "seller_sku_id": 8,
//                 "seller_id": 2,
//                 "seller_name": "Demo Seller",
//                 "product_sku_id": 8,
//                 "sku_code": "SKU-ZC5V8WNG",
//                 "name": "Masoor Dal 1 KG",
//                 "weight": 2,
//                 "dimensions": null,
//                 "image": "https://deebazar.com/admin/images/uploads/skus/8/Q8kJG2yi2jtKm0Iq0069_1791271536.png",
//                 "attributes": [
//                     {
//                         "attribute_id": 11,
//                         "attribute": "Weight",
//                         "attribute_value_id": 52,
//                         "value": "1 KG"
//                     }
//                 ],
//                 "actual_price": 260,
//                 "discount_price": 245,
//                 "discount_percent": 6,
//                 "in_stock": true,
//                 "available_qty": 40,
//                 "is_selected": true
//             },
//             {
//                 "seller_sku_id": 9,
//                 "seller_id": 2,
//                 "seller_name": "Demo Seller",
//                 "product_sku_id": 9,
//                 "sku_code": "SKU-NGDKCGG3",
//                 "name": "Masoor Dal 2 KG",
//                 "weight": 5,
//                 "dimensions": null,
//                 "image": "https://deebazar.com/admin/images/uploads/skus/9/8ReIw1evkqVPMkj0hsYb_1791271536.png",
//                 "attributes": [
//                     {
//                         "attribute_id": 11,
//                         "attribute": "Weight",
//                         "attribute_value_id": 53,
//                         "value": "2 KG"
//                     }
//                 ],
//                 "actual_price": 640,
//                 "discount_price": 640,
//                 "discount_percent": 0,
//                 "in_stock": true,
//                 "available_qty": 20,
//                 "is_selected": false
//             }
//         ]
//     }
// }
// ```
//
// ---
//
// ## 6. Code Usage Example
//
// ```javascript
// import { getSkuDetailsApi } from './Src/Api/Api';
//
// // Call with positional arguments:
// const response = await getSkuDetailsApi(8, 2);
//
// // Or call with object parameters:
// const response2 = await getSkuDetailsApi({
//   skuId: 8,
//   sellerId: 2,
// });
//
// if (response?.status === 200 && response?.data) {
//   const { product, sku, selectors, options, variants } = response.data;
//   console.log('Product:', product.name);
//   console.log('Active SKU Code:', sku.sku_code);
//   console.log('Selectors (Weight/Attributes):', selectors);
//   console.log('Available Options:', options);
//   console.log('Variants List:', variants);
// }
// ```
//
//
// ---
//
// # Product SKU Search API Documentation
//
// ## 1. Overview
// The `api/sku-search` endpoint searches across the Product SKU catalog by keyword and returns a paginated list of matching SKU variant items, complete with seller and pricing information.
//
// - **Method**: `POST`
// - **URL**: `{{base_url}}api/sku-search`
// - **Content-Type**: `multipart/form-data`, `application/x-www-form-urlencoded`, or `application/json`
//
// ---
//
// ## 2. Request Headers
//
// | Header | Type | Required | Description |
// | :--- | :--- | :--- | :--- |
// | `Authorization` | String | Optional / Recommended | `Bearer <access_token>` |
// | `Accept` | String | Required | `application/json` |
//
// ---
//
// ## 3. Request Body Parameters
//
// | Parameter | Type | Required | Description | Example |
// | :--- | :--- | :--- | :--- | :--- |
// | `keyword` | String | **Yes** | Keyword / search query text | `collared` |
// | `per_page` | Integer | Optional | Number of items per page (default: `10` or `12`) | `5` |
// | `page` | Integer | Optional | Page index (default: `1`) | `1` |
// | `gender` | String | Optional | Target gender filter (`women`, `men`, etc.) | `women` |
// | `category_id` | Integer / String | Optional | Filter by top-level category ID | `2` |
//
// ---
//
// ## 4. Response Structure
//
// ### 4.1 Top-Level Fields
//
// | Field | Type | Description |
// | :--- | :--- | :--- |
// | `status` | Integer | HTTP Status Code (e.g. `200`) |
// | `message` | String | Response status message (`"Product SKU Search"`) |
// | `data` | Array&lt;Object&gt; | List of matching SKU objects |
// | `total` | Integer | Total count of matching items |
// | `current_page` | Integer | Current page number |
// | `last_page` | Integer | Last page number |
// | `per_page` | Integer | Number of items per page |
//
// ### 4.2 SKU Item Fields (`data[i]`)
//
// | Field | Type | Description |
// | :--- | :--- | :--- |
// | `seller_sku_id` | Integer | Identifier in seller's SKU catalog |
// | `seller_id` | Integer | Seller / Vendor ID |
// | `seller_name` | String | Store / Vendor name |
// | `product_sku_id` | Integer | Unique Product SKU variant ID |
// | `product_id` | Integer | Parent Product ID |
// | `name` | String | SKU variant name (e.g. `"Collared Top Red M"`) |
// | `image` | String | URL to the primary image for this SKU |
// | `attributes` | Array&lt;Object&gt; | Selected attributes (Color, Size, etc.) |
// | `attributes[].attribute_id` | Integer | Attribute type ID (e.g. `1`) |
// | `attributes[].attribute` | String | Attribute name (e.g. `"Color"`) |
// | `attributes[].attribute_value_id` | Integer | Attribute value ID (e.g. `1`) |
// | `attributes[].value` | String | Attribute value label (e.g. `"Red"`) |
// | `actual_price` | Number | Original MRP price |
// | `discount_price` | Number | Discounted selling price |
// | `stock_quantity` | Integer | Current stock quantity |
// | `in_stock` | Boolean | In-stock flag (`true` / `false`) |
// | `short_desc` | String | Short summary description |
// | `desc` | String | Detailed product/variant description |
// | `category_id` | Integer | Category ID |
// | `category_name` | String | Category name |
// | `sub_category_id` | Integer / null | Sub-category ID |
// | `sub_category_name` | String | Sub-category name |
// | `child_category_id` | Integer / null | Child-category ID |
// | `child_category_name` | String | Child-category name |
// | `reviews` | Object / null | Customer ratings and review summary |
//
// ---
//
// ## 5. Example Request & Response
//
// ### Request:
// ```http
// POST {{base_url}}api/sku-search
// Authorization: Bearer <token>
// Accept: application/json
// Content-Type: multipart/form-data
//
// keyword: collared
// per_page: 5
// page: 1
// ```
//
// ### Response:
// ```json
// {
//   "status": 200,
//   "message": "Product SKU Search",
//   "data": [
//     {
//       "seller_sku_id": 13,
//       "seller_id": 1,
//       "seller_name": "Hittok",
//       "product_sku_id": 12,
//       "product_id": 5,
//       "name": "Collared Top Red M",
//       "image": "https://deebazar.com/admin/images/uploads/skus/12/5SC9EKZOyPebafOUUEx7_1791192667.png",
//       "attributes": [
//         {
//           "attribute_id": 1,
//           "attribute": "Color",
//           "attribute_value_id": 1,
//           "value": "Red"
//         },
//         {
//           "attribute_id": 2,
//           "attribute": "Size",
//           "attribute_value_id": 13,
//           "value": "XXL"
//         }
//       ],
//       "actual_price": 499,
//       "discount_price": 449,
//       "stock_quantity": 15,
//       "in_stock": true,
//       "short_desc": "Collared Top",
//       "desc": "This is collared top",
//       "category_id": 2,
//       "category_name": "Fashion",
//       "sub_category_id": null,
//       "sub_category_name": "",
//       "child_category_id": null,
//       "child_category_name": "",
//       "reviews": null
//     }
//   ],
//   "total": 1,
//   "current_page": 1,
//   "last_page": 1,
//   "per_page": 5
// }
// ```
//
// ---
//
// ## 6. Code Integration
//
// ### 6.1 API Service (`Src/Api/Api.js`)
// ```javascript
// import { searchSkuApi } from './Src/Api/Api';
//
// // Example: Search SKUs by keyword
// const result = await searchSkuApi({
//   keyword: 'collared',
//   perPage: 5,
//   page: 1,
// });
//
// if (result?.status === 200) {
//   console.log('Search Results:', result.data);
// }
// ```
//
// ### 6.2 Dashboard Integration (`Src/Screen/app/ProductsDashboard/DashBoard.js`)
// In the dashboard search bar:
// ```javascript
// const response = await searchSkuApi({
//   keyword: cleanValue,
//   perPage: 12,
//   page: 1,
// });
//
// if (response?.status === 200 && Array.isArray(response.data)) {
//   const formattedResults = response.data.map((sku) => ({
//     ...sku,
//     product_sku_id: sku.product_sku_id ?? sku.sku_id ?? sku.id,
//   }));
//   setSearchProducts(formattedResults);
// }
// ```
//
//
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

// ### Add to Cart / Update Cart
// Add product SKU to cart or update quantity.

// **Endpoint:** `POST /api/cart-to-add`

// **Headers:**
// - `Authorization: Bearer {token}`

// POST: {{base_url}}api/cart-to-add
// Authorization : bearer_token

// BODY :
// product_sku_id:2
// qty:1
// seller_sku_id:2
// mode:sub -- add,sub,set

// response :
// {
//     "status": 200,
//     "message": "Cart updated successfully."
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Cart updated successfully."
// }
// ```

// **Validation:**
// - `product_sku_id` (required, integer)
// - `qty` (required, integer)

// ---

// ### View Cart
// Get multi-seller cart items, address data, fulfillment modes, courier delivery options, and billing summary for authenticated user.

// **Endpoint:** `POST /api/cart-view`

// **Headers:**
// - `Authorization: Bearer {token}`
// - `Content-Type: application/json`

// **Request Flow (Hits):**

// **1st hit (Initial Load / Address Selection):**
// ```json
// {
//   "address_id": 2
// }
// ```

// **2nd hit (Mode Selection per Seller):**
// ```json
// {
//   "address_id": 2,
//   "selections": {
//     "1": { "mode": "delivery" },
//     "2": { "mode": "delivery" }
//   }
// }
// ```

// **3rd hit (Courier Partner Selection per Seller):**
// ```json
// {
//   "address_id": 2,
//   "selections": {
//     "1": { "mode": "delivery", "option": "shiprocket" },
//     "2": { "mode": "delivery", "option": "shiprocket" }
//   }
// }
// ```

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Cart View",
//   "extra_data": {
//     "actual_total": 1381,
//     "sub_total": 1194,
//     "discount": 187,
//     "cgst": 101.25,
//     "sgst": 101.25,
//     "igst": 0,
//     "total_gst": 202.5,
//     "delivery_charge": 0,
//     "total_payable_amount": 1396.5
//   },
//   "address_data": {
//     "id": 2,
//     "name": "Ananya",
//     "mobile": "9190074081",
//     "pin": "700150",
//     "state": "West Bengal",
//     "city": "Rajpur Sonarpur",
//     "house_no": "A12/5",
//     "road_name": "Dhelua",
//     "landmark": "Euro Kids school",
//     "type": "Work"
//   },
//   "data": [
//     {
//       "seller_id": 2,
//       "seller_name": "Demo Seller",
//       "items": [
//         {
//           "cart_id": 25,
//           "product_sku_id": 12,
//           "seller_sku_id": 12,
//           "name": "Vivo phone Red 32GB 4GB 6.1\" 6000mAh Snapdragon 888 64MP Android 5G 250 Gm",
//           "attributes": [
//             {
//               "attribute_id": 1,
//               "attribute": "Color",
//               "attribute_value_id": 1,
//               "value": "Red"
//             },
//             {
//               "attribute_id": 3,
//               "attribute": "Storage",
//               "attribute_value_id": 14,
//               "value": "32GB"
//             },
//             {
//               "attribute_id": 4,
//               "attribute": "RAM",
//               "attribute_value_id": 20,
//               "value": "4GB"
//             },
//             {
//               "attribute_id": 5,
//               "attribute": "Screen Size",
//               "attribute_value_id": 26,
//               "value": "6.1\""
//             },
//             {
//               "attribute_id": 6,
//               "attribute": "Battery",
//               "attribute_value_id": 33,
//               "value": "6000mAh"
//             },
//             {
//               "attribute_id": 7,
//               "attribute": "Processor",
//               "attribute_value_id": 34,
//               "value": "Snapdragon 888"
//             },
//             {
//               "attribute_id": 8,
//               "attribute": "Camera",
//               "attribute_value_id": 42,
//               "value": "64MP"
//             },
//             {
//               "attribute_id": 9,
//               "attribute": "Operating System",
//               "attribute_value_id": 44,
//               "value": "Android"
//             },
//             {
//               "attribute_id": 10,
//               "attribute": "Connectivity",
//               "attribute_value_id": 47,
//               "value": "5G"
//             },
//             {
//               "attribute_id": 11,
//               "attribute": "Weight",
//               "attribute_value_id": 50,
//               "value": "250 Gm"
//             }
//           ],
//           "variant_text": "Red / 32GB / 4GB / 6.1\" / 6000mAh / Snapdragon 888 / 64MP / Android / 5G / 250 Gm",
//           "qty": 1,
//           "actual_price": 123,
//           "after_discount_price": 69,
//           "discount_price": 54,
//           "actual_total": 123,
//           "after_discount_total": 69,
//           "discount_total": 54,
//           "short_desc": null,
//           "image": "https://deebazar.com/admin/images/uploads/skus/1/LMj14lCedtAjpEWO0bmQ_1792994817.png",
//           "available": true,
//           "available_stock": 18
//         }
//       ],
//       "seller_subtotal": 69,
//       "seller_gst": {
//         "cgst": 0,
//         "sgst": 0,
//         "igst": 0,
//         "total": 0
//       },
//       "modes": [
//         "pickup",
//         "delivery"
//       ],
//       "selected_mode": "delivery",
//       "delivery_options": [
//         {
//           "code": "shiprocket",
//           "name": "Shiprocket (Delhivery Air)",
//           "charge": 55.72,
//           "days": 2
//         }
//       ],
//       "selected_option": "shiprocket",
//       "delivery_charge": 55.72,
//       "seller_total": 120.72,
//       "delivery_error": null
//     },
//     {
//       "seller_id": 1,
//       "seller_name": "Hittok",
//       "items": [
//         {
//           "cart_id": 26,
//           "product_sku_id": 11,
//           "seller_sku_id": 11,
//           "name": "Vivo phone Blue 32GB 6GB 6.7\" 6000mAh A15 Bionic 50MP Android 500 Gm",
//           "attributes": [
//             {
//               "attribute_id": 1,
//               "attribute": "Color",
//               "attribute_value_id": 2,
//               "value": "Blue"
//             },
//             {
//               "attribute_id": 3,
//               "attribute": "Storage",
//               "attribute_value_id": 14,
//               "value": "32GB"
//             },
//             {
//               "attribute_id": 4,
//               "attribute": "RAM",
//               "attribute_value_id": 21,
//               "value": "6GB"
//             },
//             {
//               "attribute_id": 5,
//               "attribute": "Screen Size",
//               "attribute_value_id": 28,
//               "value": "6.7\""
//             },
//             {
//               "attribute_id": 6,
//               "attribute": "Battery",
//               "attribute_value_id": 33,
//               "value": "6000mAh"
//             },
//             {
//               "attribute_id": 7,
//               "attribute": "Processor",
//               "attribute_value_id": 36,
//               "value": "A15 Bionic"
//             },
//             {
//               "attribute_id": 8,
//               "attribute": "Camera",
//               "attribute_value_id": 41,
//               "value": "50MP"
//             },
//             {
//               "attribute_id": 9,
//               "attribute": "Operating System",
//               "attribute_value_id": 44,
//               "value": "Android"
//             },
//             {
//               "attribute_id": 11,
//               "attribute": "Weight",
//               "attribute_value_id": 51,
//               "value": "500 Gm"
//             }
//           ],
//           "variant_text": "Blue / 32GB / 6GB / 6.7\" / 6000mAh / A15 Bionic / 50MP / Android / 500 Gm",
//           "qty": 1,
//           "actual_price": 2999,
//           "discount_price": 2599,
//           "actual_total": 2999,
//           "discount_total": 2599,
//           "short_desc": null,
//           "image": "https://deebazar.com/admin/images/uploads/skus/11/qjKhEGDglaa5zw4ZJ5W0_1791446618.jpg",
//           "available": true,
//           "available_stock": 10
//         }
//       ],
//       "seller_subtotal": 2599,
//       "modes": [
//         "pickup",
//         "delivery"
//       ],
//       "selected_mode": "delivery",
//       "delivery_options": [
//         {
//           "code": "shiprocket",
//           "name": "Shiprocket (Delhivery Air)",
//           "charge": 55.72,
//           "days": 2
//         }
//       ],
//       "selected_option": "shiprocket",
//       "delivery_charge": 55.72,
//       "seller_total": 2654.72,
//       "delivery_error": null
//     }
//   ],
//   "unavailable": []
// }
// ```

// **Validation:**
// - `address_id` (optional, integer)
// - `selections` (optional, object mapping seller_id string to `{ mode: "delivery" | "pickup", option?: string }`)

// ---
// ### Remove from Cart
// Remove product SKU from user cart.

// *POST : {{base_url}}api/cart-remove
// Authorization : bearer_token

// BODY :
// product_sku_id:3
// seller_sku_id:3

// Response :
// {
//     "status": 200,
//     "message": "Cart removed successfully."
// }

// **Response (200):**
// ```json
// {
//   "status": 200,
//   "message": "Cart removed successfully."
// }
// ```

// **Validation:**
// - `product_sku_id` (required, integer)

// ---
// ## Wishlist

// POST : {{base_url}}api/wishlist-add
// Authorization : bearer_token

// BODY :
// product_sku_id:2
// seller_sku_id:10

// Response :
// {
//     "status": 200,
//     "message": "Added to Wishlist Successfully"
// }[6:24 PM]POST : {{base_url}}api/wishlist-view
// Authorization : bearer_token

// Response :
// {
//     "status": 200,
//     "message": "Wishlist View",
//     "data": [
//         {
//             "id": 1,
//             "product_sku_id": 2,
//             "seller_sku_id": 2,
//             "name": "Marbe gray",
//             "slug": "samsung-s24-marbe-gray",
//             "sku": "SKU-EY9GFPRM",
//             "actual_price": 74999,
//             "discount_price": 49999,
//             "short_desc": "Android mobile",
//             "category_id": 1,
//             "category_name": "Electronics",
//             "image": "https://deebazar.com/admin/images/uploads/skus/2/U6otPNTU9HOUIJrJXE4L_1790752135.jpg",
//             "in_stock": true,
//             "stock_quantity": 8,
//             "rating": 0,
//             "reviews": 0,
//             "seller_id": 2,
//             "seller_name": "Demo Seller",
//             "created_at": "2026-09-30T07:08:55.000000Z",
//             "updated_at": "2026-09-30T07:09:07.000000Z",
//             "isCartProduct": false,
//             "isWishlistProduct": true
//         },
//         {
//             "id": 4,
//             "product_sku_id": 2,
//             "seller_sku_id": 10,
//             "name": "Marbe gray",
//             "slug": "samsung-s24-marbe-gray",
//             "sku": "SKU-EY9GFPRM",
//             "actual_price": 75999,
//             "discount_price": 50999,
//             "short_desc": "Android mobile",
//             "category_id": 1,
//             "category_name": "Electronics",
//             "image": "https://deebazar.com/admin/images/uploads/skus/2/U6otPNTU9HOUIJrJXE4L_1790752135.jpg",
//             "in_stock": true,
//             "stock_quantity": 5,
//             "rating": 0,
//             "reviews": 0,
//             "seller_id": 1,
//             "seller_name": "Hittok",
//             "created_at": "2026-09-30T07:08:55.000000Z",
//             "updated_at": "2026-09-30T07:09:07.000000Z",
//             "isCartProduct": false,
//             "isWishlistProduct": true
//         }
//     ]
// }[6:26 PM]POST : {{base_url}}api/wishlist-remove
// Authorization : bearer_token

// BODY :
// product_sku_id:2
// seller_sku_id:10

// Response :
// {
//     "status": 200,
//     "message": "Wishlist Removed Successfully"
// }
// ---

// ## Address Management APIs

// ### Save Address
// User Address:

// Save Address
// {
//     "user_id": 1,
//     "name": "Rahul Sharma",
//     "mobile": "9876543210",
//     "pin": "700001",
//     "state": "West Bengal",
//     "city": "Kolkata",
//     "house_no": "12/B",
//     "road_name": "Park Street",
//     "landmark": "Near City Mall", // optional
//     "latitude": 22.5726,
//     "longitude": 88.3639,
//     "type": "Home",
//     "status": "active"
// }

// Update Address
// {
//     "address_id": 5,
//     "user_id": 1,
//     "name": "Rahul Sharma",
//     "mobile": "9876543210",
//     "pin": "700001",
//     "state": "West Bengal",
//     "city": "Kolkata",
//     "house_no": "12/B",
//     "road_name": "Park Street",
//     "landmark": "Near City Mall", // optional
//     "latitude": 22.5726,
//     "longitude": 88.3639,
//     "type": "Home",
//     "status": "active"
// }

// user_id is only needed if the request is not authenticated. If auth()->id() exists, it overrides the body value (the code merges user_id after $request->all()), so with a Bearer token you can omit user_id. But addressRules() still marks it required, and it passes because of the merge.

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

// ### Create Order
// Create a new order by user.

// **Endpoint:** `POST /api/orders`

// **Headers:**
// - `Authorization: Bearer {token}`
// - `Content-Type: application/json`

// **Request Body (Pickup):**
// ```json
// {
//     "address_id": 2,
//     "payment_method": "cod",
//     "selections": {
//         "1": { "mode": "pickup" }
//     }
// }
// ```

// **Request Body (Delivery):**
// ```json
// {
//     "address_id": 2,
//     "payment_method": "cod",
//     "selections": {
//         "1": { "mode": "delivery", "option": "seller" }
//     }
// }
// ```

// **Parameters:**
// - `address_id` (required, integer): Saved address ID
// - `payment_method` (required, string): "cod" | "cashfree"
// - `selections` (required, object): Object mapping seller_id string (`"1"` -> seller id) to selection details:
//   - Store Pickup: `{ "mode": "pickup" }`
//   - Home Delivery: `{ "mode": "delivery", "option": "seller" }`
// - `coupon_code` (optional, string): Discount coupon code

// **Response (200):**
// ```json
// {
//     "status": 200,
//     "message": "Order created successfully",
//     "order_ids": [
//         841440
//     ]
// }
// ```

// ---

// ### Order List
// Get list of orders for authenticated user.

// **Endpoint:** `POST /api/order-list`

// **Headers:**
// ```
// Authorization: Bearer {token}
// ```

// **Response (200):**
// ```json
// {
//     "status": 200,
//     "message": "Order List",
//     "data": [
//         {
//             "id": 8,
//             "order_id": 8,
//             "order_number": "159832",
//             "name": "Women Printed Kurti Soild Red L",
//             "selling_price": "999.00",
//             "amount": "999.00",
//             "payable_amount": "1178.82",
//             "image": "https://deebazar.com/admin/images/uploads/skus/13/G2sif3wBLCI5ymolPr3o_1793091157.png",
//             "status": "pending"
//         }
//     ]
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
// ```
// order_id: 8
// ```

// **Response (200):**
// ```json
// {
//     "status": 200,
//     "message": "Order Details",
//     "data_order": {
//         "id": 8,
//         "order_id": 8,
//         "order_number": "159832",
//         "name": "Women Printed Kurti Soild Red L",
//         "img": "https://deebazar.com/admin/images/uploads/skus/13/G2sif3wBLCI5ymolPr3o_1793091157.png",
//         "selling_price": "999.00",
//         "extra_discount": 0,
//         "shipping_fee": 0,
//         "total_amount": "999.00",
//         "taxable_amount": "999.00",
//         "total_line_gst_amount": "179.82",
//         "line_total": "1178.82",
//         "status": "pending",
//         "order_date": "2026-Oct-27",
//         "seller_policy": {
//             "id": 5,
//             "policy_type": "return",
//             "title": "No Return",
//             "return_days": 0,
//             "description": "Products are not eligible for return.",
//             "status": 1
//         }
//     },
//     "data_user": {
//         "name": "Anu",
//         "mobile": "8240804149",
//         "pin": "743503",
//         "state": "West Bengal",
//         "city": "Baruipur",
//         "house_no": "Near baba boro kacharir  mandir",
//         "road_name": "julpiya",
//         "landmark": "Matsya khali",
//         "address_type": "Home"
//     }
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

// **Headers:**
// - `Authorization: Bearer {token}`
// - `Content-Type: application/json`

// **Request Body (Pickup):**
// ```json
// {
//     "address_id": 2,
//     "payment_method": "cod",
//     "selections": {
//         "1": { "mode": "pickup" }
//     }
// }
// ```

// **Request Body (Delivery):**
// ```json
// {
//     "address_id": 2,
//     "payment_method": "cod",
//     "selections": {
//         "1": { "mode": "delivery", "option": "seller" }
//     }
// }
// ```

// **Request Parameters:**
// - `address_id` (required, integer): ID of the saved address to use for shipping
// - `payment_method` (required, string): Payment method - "cashfree" for online payment, "cod" for cash on delivery
// - `selections` (required, object): Object mapping seller_id string (`"1"` -> seller id) to mode & option:
//   - Pickup: `{ "mode": "pickup" }`
//   - Delivery: `{ "mode": "delivery", "option": "seller" }`
// - `coupon_code` (optional, string): Discount coupon code to apply

// **Response:**
// ```json
// {
//   "status": 200,
//   "message": "Order created successfully",
//   "order_id": 123,
//   "order_ids": [841440],
//   "payment_url": "https://payments.cashfree.com/..."
// }
// ```

// **Note:** This endpoint:
// - Automatically fetches the authenticated user's cart items
// - Uses the provided address_id for shipping
// - Uses selections for seller fulfillment mode (pickup or delivery) and delivery option
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