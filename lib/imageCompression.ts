import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  quality?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.7, // 700KB target
  maxWidthOrHeight: 2400, // Prevent overly large images
  useWebWorker: true,
  quality: 0.8,
  fileType: "image/jpeg",
};

/**
 
 * @param file - The image file to compress
 * @param options - Compression options (optional)
 * @returns Promise<File> - The compressed image file
 * @throws Error if compression fails
 */
export async function compressImage(
  file: File,
  options: Partial<CompressionOptions> = {}
): Promise<File> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // If file is already small enough, process with desired format/quality
  if (file.size < mergedOptions.maxSizeMB! * 1024 * 1024) {
    // Still convert format for consistency if needed and file is not SVG
    if (file.type !== "image/svg+xml" && file.type !== mergedOptions.fileType) {
      return await convertImageFormat(file, mergedOptions.fileType || "image/jpeg");
    }
    return file;
  }

  try {
    const compressedBlob = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB || 0.7,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight || 2400,
      useWebWorker: mergedOptions.useWebWorker !== false,
    });

    // Convert Blob to File with original filename (with new extension if needed)
    const ext = mergedOptions.fileType === "image/webp" ? "webp" : "jpg";
    const newFileName = file.name.replace(/\.[^.]+$/, `.${ext}`);

    // If format conversion is needed, convert the compressed blob
    if (compressedBlob.type !== mergedOptions.fileType) {
      return await convertBlobFormat(compressedBlob, newFileName, mergedOptions.fileType || "image/jpeg");
    }

    return new File([compressedBlob], newFileName, {
      type: compressedBlob.type || "image/jpeg",
    });
  } catch (error) {
    console.error("Image compression failed:", error);
    throw new Error(
      `Failed to compress image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Converts image format by re-encoding with canvas
 * Useful for converting formats even if image is small
 */
async function convertImageFormat(file: File, targetType: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to convert image"));
              return;
            }

            const ext = targetType === "image/webp" ? "webp" : "jpg";
            const newFileName = file.name.replace(/\.[^.]+$/, `.${ext}`);

            resolve(
              new File([blob], newFileName, {
                type: targetType,
              })
            );
          },
          targetType,
          0.8
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts blob format by re-encoding with canvas
 * Used for converting compressed image to target format
 */
async function convertBlobFormat(blob: Blob, fileName: string, targetType: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to convert image"));
              return;
            }

            resolve(
              new File([blob], fileName, {
                type: targetType,
              })
            );
          },
          targetType,
          0.8
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Validates image file size and type
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP, or SVG)",
    };
  }

  // Max 5MB before compression
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File too large. Maximum size is 5MB before compression",
    };
  }

  return { isValid: true };
}
