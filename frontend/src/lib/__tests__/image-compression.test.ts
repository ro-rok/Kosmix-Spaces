/**
 * Tests for image compression functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  calculateDimensions, 
  getOptimalCompressionSettings, 
  shouldCompressImage,
  getCompressedFileName 
} from '../image-compression';

// Mock canvas and image APIs
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
  })),
  toBlob: vi.fn((callback, type, quality) => {
    // Simulate compression by creating a smaller blob
    const mockBlob = new Blob(['compressed'], { type });
    callback(mockBlob);
  })
};

const mockImage = {
  width: 1920,
  height: 1080,
  onload: null as any,
  onerror: null as any,
  src: ''
};

// Mock DOM APIs
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn((tag) => {
      if (tag === 'canvas') return mockCanvas;
      return {};
    })
  }
});

Object.defineProperty(global, 'Image', {
  value: vi.fn(() => mockImage)
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url')
  }
});

describe('Image Compression Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDimensions', () => {
    it('should maintain aspect ratio when scaling down', () => {
      const result = calculateDimensions(1920, 1080, 800, 600);
      expect(result.width).toBe(800);
      expect(result.height).toBe(450); // Maintains 16:9 ratio
    });

    it('should not scale up smaller images', () => {
      const result = calculateDimensions(400, 300, 800, 600);
      expect(result.width).toBe(400);
      expect(result.height).toBe(300);
    });

    it('should handle portrait images correctly', () => {
      const result = calculateDimensions(1080, 1920, 800, 600);
      expect(result.width).toBe(337); // Scaled to fit height
      expect(result.height).toBe(600);
    });
  });

  describe('shouldCompressImage', () => {
    it('should compress large files', () => {
      const largeFile = new File(['x'.repeat(600 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      expect(shouldCompressImage(largeFile)).toBe(true);
    });

    it('should compress non-JPEG files', () => {
      const pngFile = new File(['small'], 'image.png', { 
        type: 'image/png' 
      });
      expect(shouldCompressImage(pngFile)).toBe(true);
    });

    it('should not compress small JPEG files', () => {
      const smallJpeg = new File(['small'], 'image.jpg', { 
        type: 'image/jpeg' 
      });
      expect(shouldCompressImage(smallJpeg)).toBe(false);
    });
  });

  describe('getOptimalCompressionSettings', () => {
    it('should use aggressive settings for large files', () => {
      const largeFile = new File(['x'.repeat(3000 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      const settings = getOptimalCompressionSettings(largeFile);
      
      expect(settings.quality).toBe(0.7);
      expect(settings.maxSizeKB).toBe(400);
      expect(settings.maxWidth).toBe(1920);
    });

    it('should use moderate settings for medium files', () => {
      const mediumFile = new File(['x'.repeat(1500 * 1024)], 'medium.jpg', { 
        type: 'image/jpeg' 
      });
      const settings = getOptimalCompressionSettings(mediumFile);
      
      expect(settings.quality).toBe(0.8);
      expect(settings.maxSizeKB).toBe(300);
      expect(settings.maxWidth).toBe(1600);
    });

    it('should use light settings for small files', () => {
      const smallFile = new File(['x'.repeat(500 * 1024)], 'small.jpg', { 
        type: 'image/jpeg' 
      });
      const settings = getOptimalCompressionSettings(smallFile);
      
      expect(settings.quality).toBe(0.85);
      expect(settings.maxSizeKB).toBe(200);
      expect(settings.maxWidth).toBe(1200);
    });
  });

  describe('getCompressedFileName', () => {
    it('should add compressed suffix and change extension', () => {
      const result = getCompressedFileName('photo.png', 'jpeg');
      expect(result).toBe('photo_compressed.jpeg');
    });

    it('should handle files without extensions', () => {
      const result = getCompressedFileName('photo', 'jpeg');
      expect(result).toBe('photo_compressed.jpeg');
    });

    it('should handle complex filenames', () => {
      const result = getCompressedFileName('my-workspace-photo.v2.png', 'webp');
      expect(result).toBe('my-workspace-photo.v2_compressed.webp');
    });
  });
});