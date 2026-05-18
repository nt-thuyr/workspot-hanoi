import { Request, Response } from "express";
import { CafeModel } from "../models/cafe.model";
import { CafeImagesModel } from "../models/cafe_images.model";
import { CafeAmenitiesModel } from "../models/cafe_amenities.model";
import { uploadImageToSupabase } from "../utils/imageUpload";
import { supabase } from "../config/supabase";

// --- UTILS TÍNH TOÁN KHOẢNG CÁCH ---
const deg2rad = (deg: number) => deg * (Math.PI / 180);

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

// --- UTILS KIỂM TRA GIỜ MỞ CỬA ---
const checkIsOpen = (openTime: string, closeTime: string) => {
  if (!openTime || !closeTime) return false;
  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  return currentTimeStr >= openTime && currentTimeStr <= closeTime;
};

// ━━━ READ ━━━

// GET /api/cafes - Lấy danh sách quán (có pagination)
export const getHomeCafes = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data, count } = await CafeModel.getHomeCafes(page, limit);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching cafes:", error);
    res.status(500).json({ error: "Lỗi server!", details: error.message });
  }
};

// GET /api/cafes/:id - Lấy chi tiết quán
export const getCafeDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const cafe = await CafeModel.getCafeDetail(id);

    if (!cafe) {
      return res
        .status(404)
        .json({ success: false, message: "Quán không tồn tại" });
    }

    res.status(200).json({ success: true, data: cafe });
  } catch (error: any) {
    console.error("Error fetching cafe detail:", error);
    res.status(500).json({ error: "Lỗi server!", details: error.message });
  }
};

// GET /api/cafes/owner/:ownerId - Lấy danh sách quán của owner
export const getCafesByOwner = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params as { ownerId: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

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
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching owner cafes:", error);
    res.status(500).json({ error: "Lỗi server!", details: error.message });
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
        message: "Missing required fields: cafeName, ward, street, owner_id",
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
      message: "Café registered successfully",
      data: cafe,
    });
  } catch (error: any) {
    console.error("[CreateCafe] Error:", error);
    res.status(500).json({
      error: "Lỗi server!",
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
        message: "Bạn không có quyền sửa quán này",
      });
    }

    // Parse tags
    const tagArray = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags || "[]")) : [];
    const tagToAmenityMap: { [key: string]: number } = {
      wifi: 1,
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
    res.status(500).json({ error: "Lỗi server!", details: error.message });
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
        message: "Bạn không có quyền xóa quán này",
      });
    }

    await CafeModel.deleteCafe(id);

    res.status(200).json({ success: true, message: "Quán đã bị xóa" });
  } catch (error: any) {
    console.error("Error deleting cafe:", error);
    res.status(500).json({ error: "Lỗi server!", details: error.message });
  }
};

// --- CONTROLLER API BẢN ĐỒ ---
export const getMapCafes = async (req: Request, res: Response) => {
  try {
    console.log("[getMapCafes] ===== START =====");
    console.log("[getMapCafes] Query params:", req.query);

    const { lat, lng, hasWifi, isQuiet, isOpen, maxDistance } = req.query;

    // 1. Fetch toàn bộ dữ liệu từ Supabase
    console.log("[getMapCafes] Fetching all cafes from database...");
    const allCafes = await CafeModel.getAllCafes();
    console.log("[getMapCafes] Total cafes in DB:", allCafes?.length || 0);

    if (!allCafes || allCafes.length === 0) {
      console.log("[getMapCafes] No cafes found in database!");
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Debug: Show first cafe
    if (allCafes.length > 0) {
      console.log("[getMapCafes] Sample cafe:", {
        id: allCafes[0].id,
        name: allCafes[0].name,
        lat: allCafes[0].lat,
        lng: allCafes[0].lng,
      });
    }

    let filteredCafes = [...allCafes];

    // 2. Lọc theo trạng thái Đang mở cửa (営業中)
    if (isOpen === "true") {
      const before = filteredCafes.length;
      filteredCafes = filteredCafes.filter((cafe) =>
        checkIsOpen(cafe.open_time, cafe.close_time),
      );
      console.log(
        `[getMapCafes] After isOpen filter: ${before} → ${filteredCafes.length}`,
      );
    }

    // 3. Lọc theo Wi-Fi (高速Wi-Fi) và Yên tĩnh (静か)
    if (hasWifi === "true") {
      const before = filteredCafes.length;
      filteredCafes = filteredCafes.filter((cafe) =>
        cafe.tags?.includes("Fast Wi-Fi"),
      );
      console.log(
        `[getMapCafes] After hasWifi filter: ${before} → ${filteredCafes.length}`,
      );
    }
    if (isQuiet === "true") {
      const before = filteredCafes.length;
      filteredCafes = filteredCafes.filter((cafe) =>
        cafe.tags?.includes("Quiet"),
      );
      console.log(
        `[getMapCafes] After isQuiet filter: ${before} → ${filteredCafes.length}`,
      );
    }

    // 4. Tính khoảng cách (Haversine) nếu có tọa độ của User
    if (lat && lng) {
      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const radiusKm = maxDistance ? parseFloat(maxDistance as string) : 5; // Mặc định 5km

      console.log(
        `[getMapCafes] Calculating distance from (${userLat}, ${userLng}), radius: ${radiusKm}km`,
      );

      // Map để thêm thuộc tính distance
      filteredCafes = filteredCafes.map((cafe) => {
        const distance = getDistanceFromLatLonInKm(
          userLat,
          userLng,
          cafe.lat,
          cafe.lng,
        );
        return { ...cafe, distance };
      });

      // Lọc các quán nằm trong bán kính cho phép
      const before = filteredCafes.length;
      filteredCafes = filteredCafes.filter((cafe) => cafe.distance <= radiusKm);
      console.log(
        `[getMapCafes] After distance filter: ${before} → ${filteredCafes.length}`,
      );

      // Sắp xếp ưu tiên quán gần nhất
      filteredCafes.sort((a, b) => a.distance - b.distance);
    }

    console.log("[getMapCafes] Final filtered count:", filteredCafes.length);

    // 5. Format lại dữ liệu trả về Frontend
    const responseData = filteredCafes.map((cafe) => ({
      id: cafe.id,
      name: cafe.name,
      location: { lat: cafe.lat, lng: cafe.lng },
      rating: cafe.rating || 0,
      reviewCount: cafe.review_count || 0,
      tags: cafe.tags || [],
      imageUrl: cafe.image_url,
      isOpenNow: checkIsOpen(cafe.open_time, cafe.close_time),
      distance: cafe.distance ? parseFloat(cafe.distance.toFixed(1)) : null,
    }));

    console.log(
      "[getMapCafes] Sending response with",
      responseData.length,
      "cafes",
    );

    res.status(200).json({
      success: true,
      count: responseData.length,
      data: responseData,
    });
  } catch (error: any) {
    console.error("[getMapCafes] ERROR:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ", details: error.message });
  }
};
