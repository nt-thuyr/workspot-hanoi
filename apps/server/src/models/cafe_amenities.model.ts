import { supabase } from '../config/supabase';

export class CafeAmenitiesModel {
  // CREATE - Gán amenity cho café
  static async createCafeAmenity(cafeId: string, amenityId: number) {
    const { data, error } = await supabase
      .from('cafe_amenities')
      .insert({
        cafe_id: cafeId,
        amenity_id: amenityId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // READ - Lấy amenities của café
  static async getCafeAmenities(cafeId: string) {
    const { data, error } = await supabase
      .from('cafe_amenities')
      .select('amenity_id, amenities(id, name_ja, name_vi)')
      .eq('cafe_id', cafeId);
    
    if (error) throw error;
    return data;
  }

  // DELETE - Bỏ amenity khỏi café
  static async deleteCafeAmenity(cafeId: string, amenityId: number) {
    const { error } = await supabase
      .from('cafe_amenities')
      .delete()
      .eq('cafe_id', cafeId)
      .eq('amenity_id', amenityId);
    
    if (error) throw error;
    return true;
  }

  // HELPER - Kiểm tra owner của café
  static async isOwner(cafeId: string, ownerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('cafes')
      .select('owner_id')
      .eq('id', cafeId)
      .single();
    
    if (error) return false;
    return data?.owner_id === ownerId;
  }
}
