import { supabase } from '../config/supabase';

export class AmenitiesModel {
  // READ - Lấy danh sách tất cả amenities
  static async getAllAmenities() {
    const { data, error } = await supabase
      .from('amenities')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // READ - Lấy amenity theo ID
  static async getAmenityById(id: number) {
    const { data, error } = await supabase
      .from('amenities')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
}
