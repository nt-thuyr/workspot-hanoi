import { supabase } from '../config/supabase';

export class ReviewModel {
  // CREATE - Viết review
  static async createReview(userId: string, cafeId: string, rating: number, comment: string) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        cafe_id: cafeId,
        rating,
        comment,
      })
      .select()
      .single();
    
    if (error) throw error;

    // Cập nhật avg_rating của café
    await this.updateCafeRating(cafeId);

    return data;
  }

  // READ - Lấy reviews của café
  static async getCafeReviews(cafeId: string, page: number = 1, limit: number = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('reviews')
      .select('*, profiles(id, full_name, avatar_url), review_images(id, image_url)', { count: 'exact' })
      .eq('cafe_id', cafeId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    return { data, count };
  }

  // READ - Lấy reviews của user
  static async getUserReviews(userId: string, page: number = 1, limit: number = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('reviews')
      .select('*, cafes(id, name)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    return { data, count };
  }

  // HELPER - Cập nhật avg_rating của café
  private static async updateCafeRating(cafeId: string) {
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('cafe_id', cafeId);
    
    if (reviewError) return;

    if (!reviews || reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await supabase
      .from('cafes')
      .update({ avg_rating: parseFloat(avgRating.toFixed(1)) })
      .eq('id', cafeId);
  }
}

export class ReviewImagesModel {
  // CREATE - Thêm ảnh cho review
  static async createReviewImage(reviewId: number, imageUrl: string) {
    const { data, error } = await supabase
      .from('review_images')
      .insert({
        review_id: reviewId,
        image_url: imageUrl,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // READ - Lấy ảnh của review
  static async getReviewImages(reviewId: number) {
    const { data, error } = await supabase
      .from('review_images')
      .select('*')
      .eq('review_id', reviewId);
    
    if (error) throw error;
    return data;
  }
}
