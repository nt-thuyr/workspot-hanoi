import { Request, Response } from "express";
import { CafeModel } from "../models/cafe.model";
import { CafeImagesModel } from "../models/cafe_images.model";
import { CafeAmenitiesModel } from "../models/cafe_amenities.model";
import { uploadImageToSupabase } from "../utils/imageUpload";
import { supabase } from "../config/supabase";

// --- UTILS TÍNH TOÁN KHOẢNG CÁCH ---
const deg2rad = (deg: number) => deg * (Math.PI / 180);

// --- UTILS CHUẨN HÓA CHUỖI TÌM KIẾM ---
const removeAccents = (str: string) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const getDistanceFromLatLonInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371; // Bán kính trái đất tính bằng km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- UTILS KIỂM TRA GIỜ MỞ CỬA (theo giờ Việt Nam UTC+7) ---
const getVietnamTimeString = (): string => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
};

const checkIsOpen = (openTime: string, closeTime: string) => {
  if (!openTime || !closeTime) return false;
<<<<<<< Updated upstream

  const now = new Date();
  const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const currentMinutes = vnTime.getHours() * 60 + vnTime.getMinutes();

  const oParts = openTime.split(":");
  const cParts = closeTime.split(":");
  const oMins = parseInt(oParts[0] || "0") * 60 + parseInt(oParts[1] || "0");
  const cMins = parseInt(cParts[0] || "0") * 60 + parseInt(cParts[1] || "0");

  if (oMins <= cMins) {
    return currentMinutes >= oMins && currentMinutes <= cMins;
  } else {
    // Quán mở qua đêm
    return currentMinutes >= oMins || currentMinutes <= cMins;
  }
=======
  const currentTimeStr = getVietnamTimeString();
  return currentTimeStr >= openTime && currentTimeStr <= closeTime;
>>>>>>> Stashed changes
};

// ━━━ READ ━━━

// GET /api/cafes - Lấy danh sách quán (có pagination)
export const getHomeCafes = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limitRaw = parseInt(req.query.limit as string);
    const limit = Number.isNaN(limitRaw) ? 10 : limitRaw;

    const { data, count } = await CafeModel.getHomeCafes(page, limit);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: limit > 0 ? Math.ceil((count || 0) / limit) : 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching cafes:", error);
    res.status(500).json({ error: "サーバーエラー", details: error.message });
  };
};

// GET /api/cafes/:id - Lấy chi tiết quán
export const getCafeDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const cafe = await CafeModel.getCafeDetail(id);

    if (!cafe) {
      return res
        .status(404)
        .json({ success: false, message: "カフェが見つかりません" });
    }

    res.status(200).json({ success: true, data: cafe });
  } catch (error: any) {
    console.error("Error fetching cafe detail:", error);
    res.status(500).json({ error: "サーバーエラー", details: error.message });
  }
};

// GET /api/cafes/owner/:ownerId - Lấy danh sách quán của owner
export const getCafesByOwner = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params as { ownerId: string };
    const page = parseInt(req.query.page as string) || 1;
    const limitRaw = parseInt(req.query.limit as string);
    const limit = Number.isNaN(limitRaw) ? 10 : limitRaw;

    const { data, count } = await CafeModel.getCafesByOwner(
      ownerId,
      page,
      limit,
    );

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: limit > 0 ? Math.ceil((count || 0) / limit) : 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching owner cafes:", error);
    res.status(500).json({ error: "サーバーエラー", details: error.message });
  }
};

// ━━━ CREATE ━━━

// POST /api/cafes - Tạo quán mới (owner) - Hỗ trợ file upload
export const createCafe = async (req: Request, res: Response) => {
  try {
    console.log("[CreateCafe] Request received");
    console.log("[CreateCafe] Body:", req.body);
    console.log(
      "[CreateCafe] Files:",
      req.files ? Object.keys(req.files) : "No files",
    );

    // Parse form data
    const {
      cafeName,
      ward,
      street,
      openTime,
      closeTime,
      tags,
      owner_id,
      lat,
      lng,
    } = req.body;

    // Validate required fields
    if (!cafeName?.trim() || !ward?.trim() || !street?.trim() || !owner_id) {
      console.log("[CreateCafe] Validation failed - missing required fields");
      return res.status(400).json({
        success: false,
        message: "必須項目が不足しています：カフェ名、区・町、番地・通り",
      });
    }

    // Combine address
    const address = `${street}, ${ward}`;
    console.log("[CreateCafe] Cafe name:", cafeName, "Address:", address);

    // Get files from request
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let coverImageUrl: string | null = null;
    const menuImageUrls: string[] = [];

    // Upload cover image
    if (files?.coverImage && files.coverImage.length > 0) {
      try {
        console.log("[CreateCafe] Uploading cover image...");
        const coverFile = files.coverImage[0];
        if (coverFile) {
          coverImageUrl = await uploadImageToSupabase(
            coverFile,
            "cafe-images",
            "covers",
          );
          console.log("[CreateCafe] Cover image uploaded:", coverImageUrl);
        }
      } catch (error: any) {
        console.error("[CreateCafe] Error uploading cover image:", error);
        return res.status(400).json({
          success: false,
          message: "Failed to upload cover image",
          details: error.message,
        });
      }
    } else {
      console.log("[CreateCafe] No cover image provided");
    }

    // Upload menu images
    if (files?.menuImages && files.menuImages.length > 0) {
      try {
        console.log(
          "[CreateCafe] Uploading menu images...",
          files.menuImages.length,
        );
        for (const file of files.menuImages) {
          const url = await uploadImageToSupabase(file, "cafe-images", "menus");
          menuImageUrls.push(url);
          console.log("[CreateCafe] Menu image uploaded:", url);
        }
      } catch (error: any) {
        console.error("[CreateCafe] Error uploading menu images:", error);
        return res.status(400).json({
          success: false,
          message: "Failed to upload menu images",
          details: error.message,
        });
      }
    } else {
      console.log("[CreateCafe] No menu images provided");
    }

    // Parse tags to separate standard amenities and custom tags
    const tagArray = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags || "[]")) : [];
    const tagToAmenityMap: { [key: string]: number } = {
      wifi: 1,
      "fast wi-fi": 1,
      "高速wi-fi": 1,
      outlet: 2,
      コンセント: 2,
      コンセントあり: 2,
      quiet: 3,
      静かな環境: 3,
      静か: 3,
      nonsmoking: 4,
      禁煙: 4,
      エアコン: 5,
      エアコン完備: 5,
      ペット可: 6,
      駐車場: 7,
      テラス席: 8,
      飲食可: 9,
      プロジェクター: 10,
      会議室: 11,
      "24時間営業": 12,
    };

    const uniqueAmenityIds = new Set<number>();
    const customTags: string[] = [];

    for (const tag of tagArray) {
      const amenityId = tagToAmenityMap[tag.toLowerCase()];
      if (amenityId) {
        uniqueAmenityIds.add(amenityId);
      } else {
        customTags.push(tag);
      }
    }

    // Create cafe record
    console.log("[CreateCafe] Creating cafe record...");
    const cafe = await CafeModel.createCafe({
      name: cafeName,
      address,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      open_time: openTime || null,
      close_time: closeTime || null,
      owner_id,
      wifi_speed: "NORMAL",
      quiet_level: "NORMAL",
      description_ja: null,
      custom_tags: customTags.length > 0 ? customTags : null,
    });
    console.log("[CreateCafe] Cafe record created:", cafe.id);

    // Save cover image to cafe_images table
    if (coverImageUrl) {
      await CafeImagesModel.createCafeImage(cafe.id, coverImageUrl, "INTERIOR");
      console.log("[CreateCafe] Cover image record saved");
    }

    // Save menu images to cafe_images table
    for (const url of menuImageUrls) {
      await CafeImagesModel.createCafeImage(cafe.id, url, "MENU");
    }
    console.log("[CreateCafe] Menu images records saved");

    // Link amenities
    for (const amenityId of uniqueAmenityIds) {
      await CafeAmenitiesModel.createCafeAmenity(cafe.id, amenityId);
      console.log("[CreateCafe] Amenity linked:", amenityId);
    }

    console.log("[CreateCafe] Cafe registration complete");
    res.status(201).json({
      success: true,
      message: "カフェが正常に登録されました",
      data: cafe,
    });
  } catch (error: any) {
    console.error("[CreateCafe] Error:", error);
    res.status(500).json({
      error: "サーバーエラー",
      details: error.message,
    });
  }
};

// ━━━ UPDATE ━━━

// PUT /api/cafes/:id - Cập nhật quán (owner)
export const updateCafe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const {
      owner_id,
      cafeName, // Lấy tên tương tự FE truyền
      name,
      address,
      ward,
      street,
      lat,
      lng,
      openTime,
      closeTime,
      tags,
      deletedMenuImageIds,
    } = req.body;

    // Xử lý address: kết hợp từ street và ward nếu có, hoặc dùng thẳng address
    const updatedAddress = street && ward ? `${street}, ${ward}` : address;
    const updatedName = cafeName || name;

    // Kiểm tra owner
    const isOwner = await CafeModel.isOwner(id, owner_id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "このカフェを編集する権限がありません",
      });
    }

    // Parse tags
    const tagArray = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags || "[]")) : [];
    const tagToAmenityMap: { [key: string]: number } = {
      wifi: 1,
      "fast wi-fi": 1,
      "高速wi-fi": 1,
      outlet: 2,
      コンセント: 2,
      コンセントあり: 2,
      quiet: 3,
      静かな環境: 3,
      静か: 3,
      nonsmoking: 4,
      禁煙: 4,
      エアコン: 5,
      エアコン完備: 5,
      ペット可: 6,
      駐車場: 7,
      テラス席: 8,
      飲食可: 9,
      プロジェクター: 10,
      会議室: 11,
      "24時間営業": 12,
    };

    const uniqueAmenityIds = new Set<number>();
    const customTags: string[] = [];

    for (const tag of tagArray) {
      const amenityId = tagToAmenityMap[tag.toLowerCase()];
      if (amenityId) {
        uniqueAmenityIds.add(amenityId);
      } else {
        customTags.push(tag);
      }
    }

    const updates = {
      name: updatedName,
      address: updatedAddress,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      open_time: openTime || null,
      close_time: closeTime || null,
      custom_tags: customTags.length > 0 ? customTags : null,
    };

    const cafe = await CafeModel.updateCafeInfo(id, updates);

    // Cập nhật amenities
    await CafeAmenitiesModel.deleteCafeAmenities(id);
    for (const amenityId of uniqueAmenityIds) {
      await CafeAmenitiesModel.createCafeAmenity(id, amenityId);
    }

    // Xử lý file ảnh
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Cập nhật ảnh cover (INTERIOR)
    if (files?.coverImage && files.coverImage.length > 0) {
      const coverFile = files.coverImage[0];
      if (coverFile) {
        await CafeImagesModel.deleteCafeImagesByType(id, "INTERIOR");
        const coverImageUrl = await uploadImageToSupabase(
          coverFile,
          "cafe-images",
          "covers",
        );
        await CafeImagesModel.createCafeImage(id, coverImageUrl, "INTERIOR");
      }
    }

    // Xóa các ảnh menu bị người dùng xóa
    if (deletedMenuImageIds) {
      const idsToDelete = JSON.parse(deletedMenuImageIds);
      for (const imageId of idsToDelete) {
        await CafeImagesModel.deleteCafeImage(parseInt(imageId));
      }
    }

    // Cập nhật ảnh menu (thêm ảnh mới)
    if (files?.menuImages && files.menuImages.length > 0) {
      for (const file of files.menuImages) {
        const url = await uploadImageToSupabase(file, "cafe-images", "menus");
        await CafeImagesModel.createCafeImage(id, url, "MENU");
      }
    }

    res.status(200).json({ success: true, data: cafe });
  } catch (error: any) {
    console.error("Error updating cafe:", error);
    res.status(500).json({ error: "サーバーエラー", details: error.message });
  }
};

// ━━━ DELETE ━━━

// DELETE /api/cafes/:id - Xóa quán (owner)
export const deleteCafe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { owner_id } = req.body;

    // Kiểm tra owner
    const isOwner = await CafeModel.isOwner(id, owner_id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "このカフェを削除する権限がありません",
      });
    }

    await CafeModel.deleteCafe(id);

    res.status(200).json({ success: true, message: "カフェが削除されました" });
  } catch (error: any) {
    console.error("Error deleting cafe:", error);
    res.status(500).json({ error: "サーバーエラー", details: error.message });
  }
};

// --- CONTROLLER API BẢN ĐỒ ---
export const getMapCafes = async (req: Request, res: Response) => {
  try {
    console.log("[getMapCafes] ===== START =====");
    console.log("[getMapCafes] Query params:", req.query);

    const { lat, lng, hasWifi, isQuiet, isOpen, maxDistance, keyword, minRating } = req.query;

    console.log("[getMapCafes] Fetching all cafes from database...");
    const allCafesRaw = await CafeModel.getAllCafes();
    console.log("[getMapCafes] Total cafes in DB:", allCafesRaw?.length || 0);

    if (!allCafesRaw || allCafesRaw.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Map amenities to string tags
    const tagMap: Record<number, string> = {
      1: "高速Wi-Fi", 2: "コンセント", 3: "静か", 4: "禁煙",
      5: "エアコン", 6: "ペット可", 7: "駐車場", 8: "テラス席",
      9: "飲食可", 10: "プロジェクター", 11: "会議室", 12: "24時間営業",
    };

    // Pre-process cafes to extract tags and imageUrl
    let filteredCafes = allCafesRaw.map((cafe: any) => {
      const standardTags = (cafe.cafe_amenities || []).map((a: any) => tagMap[a.amenity_id]).filter(Boolean);
      const tags = [...standardTags, ...(cafe.custom_tags || [])];
      
      let image_url = null;
      if (cafe.cafe_images && cafe.cafe_images.length > 0) {
        const cover = cafe.cafe_images.find((img: any) => img.image_type === 'INTERIOR') || cafe.cafe_images[0];
        image_url = cover.image_url;
      }

      return { ...cafe, tags, image_url };
    });

    // 1. Lọc theo Keyword (tìm trong tên, địa chỉ, tags)
    if (keyword) {
      const kw = removeAccents(keyword as string).toLowerCase();
      filteredCafes = filteredCafes.filter((cafe) => {
        const nameStr = cafe.name ? removeAccents(cafe.name).toLowerCase() : "";
        const addrStr = cafe.address ? removeAccents(cafe.address).toLowerCase() : "";
        
        const nameMatch = nameStr.includes(kw);
        const addressMatch = addrStr.includes(kw);
        const tagsMatch = cafe.tags.some((t: string) => removeAccents(t).toLowerCase().includes(kw));
        return nameMatch || addressMatch || tagsMatch;
      });
    }

    // 2. Lọc theo trạng thái Đang mở cửa (営業中)
    if (isOpen === "true") {
      filteredCafes = filteredCafes.filter((cafe) =>
        checkIsOpen(cafe.open_time, cafe.close_time),
      );
    }

    // 2b. Lọc theo đánh giá tối thiểu (高評価: minRating >= 4)
    if (minRating) {
      const minRatingNum = parseFloat(minRating as string);
      filteredCafes = filteredCafes.filter((cafe) =>
        cafe.avg_rating != null && Number(cafe.avg_rating) >= minRatingNum,
      );
    }

    // 3. Lọc theo Wi-Fi và Yên tĩnh
    if (hasWifi === "true") {
      filteredCafes = filteredCafes.filter((cafe) =>
        cafe.tags?.includes("高速Wi-Fi") || cafe.tags?.some((t: string) => t.toLowerCase().includes("wifi")),
      );
    }
    if (isQuiet === "true") {
      filteredCafes = filteredCafes.filter((cafe) =>
        cafe.tags?.includes("静か") || cafe.tags?.some((t: string) => t.toLowerCase().includes("静か")),
      );
    }

    // 4. Tính khoảng cách (Haversine) nếu có tọa độ của User
    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const radiusKm = maxDistance ? parseFloat(maxDistance as string) : 5; // Mặc định 5km

      filteredCafes = filteredCafes.map((cafe) => {
        const distance = getDistanceFromLatLonInKm(
          userLat, userLng, cafe.lat, cafe.lng,
        );
        return { ...cafe, distance };
      });

      // Lọc các quán nằm trong bán kính cho phép
      filteredCafes = filteredCafes.filter((cafe) => cafe.distance <= radiusKm);

      // Sắp xếp ưu tiên quán gần nhất
      filteredCafes.sort((a, b) => a.distance - b.distance);
    }

    console.log("[getMapCafes] Final filtered count:", filteredCafes.length);

    // 5. Format lại dữ liệu trả về Frontend
    const responseData = filteredCafes.map((cafe) => ({
      id: cafe.id,
      name: cafe.name,
      location: { lat: cafe.lat, lng: cafe.lng },
      rating: cafe.avg_rating ? Number(cafe.avg_rating) : 0,
      reviewCount: cafe.reviews ? cafe.reviews.length : 0,
      tags: cafe.tags || [],
      imageUrl: cafe.image_url,
      isOpenNow: checkIsOpen(cafe.open_time, cafe.close_time),
      open_time: cafe.open_time,
      close_time: cafe.close_time,
      distance: cafe.distance ? parseFloat(cafe.distance.toFixed(1)) : null,
      address: cafe.address,
    }));

    res.status(200).json({
      success: true,
      count: responseData.length,
      data: responseData,
    });
  } catch (error: any) {
    console.error("[getMapCafes] ERROR:", error);
    res
      .status(500)
      .json({ success: false, message: "サーバーエラーが発生しました", details: error.message });
  }
};
