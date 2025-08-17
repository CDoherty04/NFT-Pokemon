'use client';

import React, { useState } from 'react';
import { Download, RotateCcw, Eye, EyeOff, Settings, X } from 'lucide-react';
import { makeBackgroundTransparent, removeColor, resizeImage } from '../utils/imageUtils';

export default function ImageProcessor({ isOpen, onClose, onSave, title = "Process Avatar Image" }) {
  const [inputImage, setInputImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState('auto'); // 'auto', 'color', 'manual'
  const [threshold, setThreshold] = useState(240);
  const [tolerance, setTolerance] = useState(0.1);
  const [targetColor, setTargetColor] = useState('#FFFFFF');
  const [showSettings, setShowSettings] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputImage(event.target.result);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!inputImage) return;

    setProcessing(true);
    try {
      let result;
      
      switch (method) {
        case 'auto':
          result = await makeBackgroundTransparent(inputImage, threshold, tolerance);
          break;
        case 'color':
          result = await removeColor(inputImage, targetColor, tolerance);
          break;
        default:
          result = inputImage;
      }
      
      setProcessedImage(result);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = () => {
    if (processedImage) {
      onSave(processedImage);
      onClose();
    }
  };

  const resetImage = () => {
    setInputImage(null);
    setProcessedImage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-6 p-6">
          {/* Left Panel - Input and Settings */}
          <div className="w-1/2 space-y-6">
            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upload Image</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {inputImage ? (
                  <div className="space-y-4">
                    <img 
                      src={inputImage} 
                      alt="Input" 
                      className="max-w-full h-auto mx-auto max-h-64 rounded-lg"
                    />
                    <button
                      onClick={resetImage}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      <RotateCcw size={16} />
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2 text-gray-600 hover:text-gray-800"
                    >
                      <Download size={48} />
                      <span>Click to upload image</span>
                      <span className="text-sm">Supports PNG, JPG, GIF</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Processing Method */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Processing Method</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="auto"
                    checked={method === 'auto'}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Auto-detect white/light background</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="color"
                    checked={method === 'color'}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Remove specific color</span>
                </label>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Settings</h3>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  <Settings size={16} />
                  {showSettings ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showSettings && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Threshold: {threshold}
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="255"
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600">
                      Higher values = more aggressive background removal
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tolerance: {tolerance.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.01"
                      max="0.5"
                      step="0.01"
                      value={tolerance}
                      onChange={(e) => setTolerance(Number(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-600">
                      Lower values = more precise color matching
                    </p>
                  </div>
                  
                  {method === 'color' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Target Color
                      </label>
                      <input
                        type="color"
                        value={targetColor}
                        onChange={(e) => setTargetColor(e.target.value)}
                        className="w-full h-12 rounded border-2 border-gray-300"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Process Button */}
            <button
              onClick={processImage}
              disabled={!inputImage || processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Eye size={20} />
                  Process Image
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 space-y-6">
            <h3 className="text-lg font-semibold">Preview</h3>
            
            {processedImage ? (
              <div className="space-y-4">
                <div className="relative">
                  {/* Checkerboard background for transparency visualization */}
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #ccc 75%), 
                        linear-gradient(-45deg, transparent 75%, #ccc 75%)
                      `,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />
                  <img 
                    src={processedImage} 
                    alt="Processed" 
                    className="relative z-10 max-w-full h-auto mx-auto max-h-64 rounded-lg"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <Download size={20} />
                    Use This Image
                  </button>
                  <button
                    onClick={() => setProcessedImage(null)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                <Eye size={48} className="mx-auto mb-2 opacity-50" />
                <p>Process an image to see the preview here</p>
                <p className="text-sm">The checkerboard pattern shows transparent areas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
