import { supabase } from '../config/supabase';

export class CafeImagesModel {
  // CREATE - Thêm ảnh cho café
  static async createCafeImage(cafeId: string, imageUrl: string, imageType: string = 'INTERIOR') {
    const { data, error } = await supabase
      .from('cafe_images')
      .insert({
        cafe_id: cafeId,
        image_url: imageUrl,
        image_type: imageType,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // READ - Lấy ảnh của café
  static async getCafeImages(cafeId: string) {
    const { data, error } = await supabase
      .from('cafe_images')
      .select('*')
      .eq('cafe_id', cafeId)
      .order('id', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // READ - Lấy ảnh theo ID
  static async getCafeImageById(id: number) {
    const { data, error } = await supabase
      .from('cafe_images')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  // DELETE - Xóa ảnh
  static async deleteCafeImage(id: number) {
    const { error } = await supabase
      .from('cafe_images')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // DELETE BY TYPE - Xóa ảnh theo loại
  static async deleteCafeImagesByType(cafeId: string, imageType: string) {
    const { error } = await supabase
      .from('cafe_images')
      .delete()
      .eq('cafe_id', cafeId)
      .eq('image_type', imageType);
    
    if (error) throw error;
    return true;
  }

  // HELPER - Kiểm tra owner của café
  static async isOwner(cafeImageId: number, ownerId: string): Promise<boolean> {
    const { data: image, error: imageError } = await supabase
      .from('cafe_images')
      .select('cafe_id')
      .eq('id', cafeImageId)
      .single();
    
    if (imageError) return false;

    const { data: cafe, error: cafeError } = await supabase
      .from('cafes')
      .select('owner_id')
      .eq('id', image?.cafe_id)
      .single();
    
    if (cafeError) return false;
    return cafe?.owner_id === ownerId;
  }
}
