/**
 * Utility functions for image processing and transparency
 */

/**
 * Makes the background of an image transparent by removing white/light pixels
 * @param {string} imageDataUrl - The image data URL to process
 * @param {number} threshold - RGB threshold for considering a pixel as "background" (0-255)
 * @param {number} tolerance - Tolerance for background color detection (0-1)
 * @returns {Promise<string>} - Promise resolving to processed image data URL
 */
export const makeBackgroundTransparent = async (imageDataUrl, threshold = 240, tolerance = 0.1) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Check if pixel is close to white/light (background)
        const isBackground = (
          r >= threshold && 
          g >= threshold && 
          b >= threshold &&
          Math.abs(r - g) < tolerance * 255 &&
          Math.abs(g - b) < tolerance * 255 &&
          Math.abs(r - b) < tolerance * 255
        );
        
        if (isBackground) {
          // Make background transparent
          data[i + 3] = 0; // Alpha channel to 0
        }
      }
      
      // Put the processed image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      const processedDataUrl = canvas.toDataURL('image/png');
      resolve(processedDataUrl);
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Removes a specific color from an image and makes it transparent
 * @param {string} imageDataUrl - The image data URL to process
 * @param {string} targetColor - Hex color to remove (e.g., '#FFFFFF')
 * @param {number} tolerance - Color tolerance (0-1)
 * @returns {Promise<string>} - Promise resolving to processed image data URL
 */
export const removeColor = async (imageDataUrl, targetColor, tolerance = 0.1) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Parse target color
      const targetR = parseInt(targetColor.slice(1, 3), 16);
      const targetG = parseInt(targetColor.slice(3, 5), 16);
      const targetB = parseInt(targetColor.slice(5, 7), 16);
      
      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate color distance
        const distance = Math.sqrt(
          Math.pow(r - targetR, 2) + 
          Math.pow(g - targetG, 2) + 
          Math.pow(b - targetB, 2)
        );
        
        // If pixel is close to target color, make it transparent
        if (distance < tolerance * 441.67) { // 441.67 is max possible distance
          data[i + 3] = 0; // Alpha channel to 0
        }
      }
      
      // Put the processed image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      const processedDataUrl = canvas.toDataURL('image/png');
      resolve(processedDataUrl);
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Applies a mask to an image to create transparency
 * @param {string} imageDataUrl - The image data URL to process
 * @param {string} maskDataUrl - The mask image data URL (black = transparent, white = opaque)
 * @returns {Promise<string>} - Promise resolving to processed image data URL
 */
export const applyMask = async (imageDataUrl, maskDataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    const mask = new Image();
    
    let imagesLoaded = 0;
    const onImageLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        processImages();
      }
    };
    
    img.onload = onImageLoad;
    mask.onload = onImageLoad;
    
    img.src = imageDataUrl;
    mask.src = maskDataUrl;
    
    const processImages = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Get mask data
      const maskCanvas = document.createElement('canvas');
      const maskCtx = maskCanvas.getContext('2d');
      maskCanvas.width = mask.width;
      maskCanvas.height = mask.height;
      maskCtx.drawImage(mask, 0, 0);
      const maskData = maskCtx.getImageData(0, 0, mask.width, mask.height);
      const maskPixels = maskData.data;
      
      // Apply mask to alpha channel
      for (let i = 0; i < data.length; i += 4) {
        const maskIndex = Math.floor(i / 4);
        const maskR = maskPixels[maskIndex * 4];
        const maskG = maskPixels[maskIndex * 4 + 1];
        const maskB = maskPixels[maskIndex * 4 + 2];
        
        // Use grayscale value from mask for alpha
        const maskValue = (maskR + maskG + maskB) / 3;
        data[i + 3] = maskValue; // Alpha channel
      }
      
      // Put the processed image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      const processedDataUrl = canvas.toDataURL('image/png');
      resolve(processedDataUrl);
    };
  });
};

/**
 * Resizes an image while maintaining aspect ratio
 * @param {string} imageDataUrl - The image data URL to resize
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<string>} - Promise resolving to resized image data URL
 */
export const resizeImage = async (imageDataUrl, maxWidth, maxHeight) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      let { width, height } = img;
      const aspectRatio = width / height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to data URL
      const resizedDataUrl = canvas.toDataURL('image/png');
      resolve(resizedDataUrl);
    };
    
    img.src = imageDataUrl;
  });
};
