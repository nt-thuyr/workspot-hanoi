/**
 * BACKEND API DOCUMENTATION - WorkSpot HaNoi
 * Complete CRUD Implementation for All 10 Database Tables
 *
 * Backend running on: VITE_API_URL fallback to http://localhost:3000
 * Frontend running on: http://localhost:5173 or 5174
 */

// ============================================
// 1. AUTHENTICATION (/api/auth)
// ============================================
/**
 * POST /api/auth/register
 * - Register new user
 * - Body: { email, password, phone, full_name, avatar_url? }
 *
 * POST /api/auth/login
 * - Login user
 * - Body: { email, password }
 * - Returns: { user, token }
 */

// ============================================
// 2. CAFES (/api/cafes) - 7 endpoints
// ============================================
/**
 * GET /api/cafes
 * - Get all cafes with pagination (for home page)
 * - Query: page=1, limit=10
 * - Returns: { data: Cafe[], pagination: { page, limit, total, pages } }
 *
 * GET /api/cafes/:id
 * - Get cafe detail (with amenities, images, avg_rating)
 * - Returns: { success, data: CafeDetail }
 *
 * GET /api/cafes/owner/:ownerId
 * - Get all cafes owned by a user (for owner dashboard)
 * - Query: page=1, limit=10
 * - Returns: { data: Cafe[], pagination }
 *
 * POST /api/cafes
 * - Create new cafe (owner only)
 * - Auth required: user_id (from JWT)
 * - Body: { name, address, phone, description, image_url, owner_id }
 *
 * PUT /api/cafes/:id
 * - Update cafe info (owner only)
 * - Auth required: must be owner
 * - Body: partial updates to cafe fields
 *
 * DELETE /api/cafes/:id
 * - Delete cafe (owner only)
 * - Auth required: must be owner
 *
 * GET /api/cafes/map (on cafe routes)
 * - Get all cafes for map display
 * - Returns: { success, data: [{ id, name, address, lat, lng, avg_rating }] }
 */

// ============================================
// 3. AMENITIES (/api/amenities) - 2 endpoints
// ============================================
/**
 * GET /api/amenities
 * - Get all amenities (for dropdown/filter)
 * - Returns: { success, data: Amenity[] }
 *
 * GET /api/amenities/:id
 * - Get specific amenity
 * - Returns: { success, data: Amenity }
 */

// ============================================
// 4. CAFE IMAGES (/api/cafes + routes) - 3 endpoints
// ============================================
/**
 * POST /api/cafes/:cafeId/images
 * - Upload image for cafe (owner only)
 * - Auth required: must be cafe owner
 * - Body: { image_url }
 *
 * GET /api/cafes/:cafeId/images
 * - Get all images for a cafe
 * - Returns: { success, data: CafeImage[], count }
 *
 * DELETE /api/cafes/:cafeId/images/:imageId
 * - Delete cafe image (owner only)
 * - Auth required: must be cafe owner
 */

// ============================================
// 5. CAFE AMENITIES (/api/cafes + routes) - 3 endpoints
// ============================================
/**
 * POST /api/cafes/:cafeId/amenities
 * - Assign amenity to cafe (owner only)
 * - Auth required: must be cafe owner
 * - Body: { amenity_id }
 *
 * GET /api/cafes/:cafeId/amenities
 * - Get all amenities for a cafe
 * - Returns: { success, data: Amenity[], count }
 *
 * DELETE /api/cafes/:cafeId/amenities/:amenityId
 * - Remove amenity from cafe (owner only)
 * - Auth required: must be cafe owner
 */

// ============================================
// 6. PROFILES (/api/profiles) - 2 endpoints
// ============================================
/**
 * GET /api/profiles/:userId
 * - Get user profile
 * - Returns: { success, data: Profile }
 *
 * PUT /api/profiles/:userId
 * - Update user profile (user only)
 * - Auth required: must be same user
 * - Body: { full_name?, phone?, avatar_url?, bio? }
 */

// ============================================
// 7. RESERVATIONS (/api/reservations) - 4 endpoints
// ============================================
/**
 * POST /api/reservations
 * - Create reservation (user)
 * - Auth required: user_id (from JWT)
 * - Body: { user_id, cafe_id, reservation_date, reservation_time, party_size, notes? }
 *
 * GET /api/reservations/user/:userId
 * - Get user's reservations (user only)
 * - Query: page=1, limit=10
 * - Auth required: must be same user
 * - Returns: { data: Reservation[], pagination }
 *
 * GET /api/reservations/cafe/:cafeId
 * - Get cafe's reservations (owner only)
 * - Query: page=1, limit=10
 * - Auth required: must be cafe owner
 * - Returns: { data: Reservation[], pagination }
 *
 * PUT /api/reservations/:id
 * - Update reservation status (owner/user)
 * - Auth required: must be owner or reservation user
 * - Body: { status: 'pending' | 'confirmed' | 'cancelled' | 'completed' }
 */

// ============================================
// 8. REVIEWS (/api/reviews) - 5 endpoints
// ============================================
/**
 * POST /api/reviews
 * - Create review (user)
 * - Auth required: user_id (from JWT)
 * - Auto-updates cafe avg_rating
 * - Body: { user_id, cafe_id, rating (1-5), comment? }
 *
 * GET /api/reviews/cafe/:cafeId
 * - Get all reviews for a cafe (paginated)
 * - Query: page=1, limit=10
 * - Returns: { data: Review[], pagination }
 *
 * GET /api/reviews/user/:userId
 * - Get user's reviews (paginated)
 * - Query: page=1, limit=10
 * - Returns: { data: Review[], pagination }
 *
 * POST /api/reviews/:reviewId/images
 * - Add image to review (user)
 * - Auth required: user_id matches review author
 * - Body: { imageUrl }
 *
 * GET /api/reviews/:reviewId/images
 * - Get all images for a review
 * - Returns: { success, data: ReviewImage[], count }
 */

// ============================================
// 9. FAVORITES (/api/favorites) - 4 endpoints
// ============================================
/**
 * POST /api/favorites
 * - Add cafe to favorites (user)
 * - Auth required: user_id (from JWT)
 * - Body: { user_id, cafe_id }
 *
 * DELETE /api/favorites/:cafeId
 * - Remove cafe from favorites (user)
 * - Auth required: user_id (from JWT)
 * - Body: { user_id }
 *
 * GET /api/favorites/user/:userId
 * - Get user's favorite cafes (paginated)
 * - Query: page=1, limit=10
 * - Returns: { data: [{ id, created_at, cafes: { id, name, address, avg_rating, image_url, owner_id } }], pagination }
 *
 * GET /api/favorites/user/:userId/check/:cafeId
 * - Check if cafe is favorited by user
 * - Returns: { success, isFavorite: boolean }
 */

// ============================================
// 10. NOTIFICATIONS (/api/notifications) - 6 endpoints
// ============================================
/**
 * GET /api/notifications/user/:userId
 * - Get user's notifications (paginated)
 * - Query: page=1, limit=10
 * - Auth required: must be same user
 * - Returns: { data: Notification[], pagination }
 *
 * GET /api/notifications/user/:userId/unread-count
 * - Get count of unread notifications
 * - Auth required: must be same user
 * - Returns: { success, unreadCount: number }
 *
 * PUT /api/notifications/:id/mark-as-read
 * - Mark single notification as read
 * - Returns: { success, data: Notification }
 *
 * PUT /api/notifications/user/:userId/mark-all-as-read
 * - Mark all notifications as read
 * - Auth required: must be same user
 *
 * DELETE /api/notifications/:id
 * - Delete single notification
 *
 * DELETE /api/notifications/user/:userId
 * - Delete all notifications for user
 * - Auth required: must be same user
 */

// ============================================
// KEY FEATURES IMPLEMENTED
// ============================================
/**
 * ✅ Pagination: All list endpoints support page/limit
 * ✅ Authorization: Owner checks, user isolation on mutations
 * ✅ Auto-calculated Fields: avg_rating updates when review created
 * ✅ Error Handling: Consistent 400/403/404/500 responses
 * ✅ Data Relationships: JOIN queries with related tables
 * ✅ Status Tracking: Reservations support multiple statuses
 * ✅ Soft Operations: Reservations use status updates instead of deletes
 * ✅ Type Safety: Full TypeScript with strict mode
 * ✅ RESTful Design: Proper HTTP verbs and status codes
 * ✅ Response Format: Consistent { success, data, pagination } structure
 */

// ============================================
// ENVIRONMENT VARIABLES REQUIRED
// ============================================
/**
 * Server .env:
 * - SUPABASE_URL=https://jljefdsnxywecqmynzsj.supabase.co
 * - SUPABASE_SERVICE_ROLE_KEY=[JWT_TOKEN]
 * - PORT=3000
 *
 * Client .env:
 * - VITE_GOOGLE_MAPS_API_KEY=[API_KEY]
 */
