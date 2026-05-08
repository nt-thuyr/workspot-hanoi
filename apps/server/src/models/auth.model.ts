import { supabase } from '../config/supabase'; // Đường dẫn tới file config supabase của bạn
import { Profile } from '@workspot-hanoi/shared';

export class AuthModel {
  static async createProfile(profile: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}