'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Palette, Brush, Eraser, Download, RotateCcw, Square, Circle, X, Eye, EyeOff } from 'lucide-react';

export default function DrawingApp({ isOpen, onClose, onSave, title = "Draw Your Pokemon" }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [transparentBackground, setTransparentBackground] = useState(true);
  
  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
    '#808080', '#008000', '#000080', '#800000'
  ];

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 400;
      canvas.height = 400;
      
      // Clear canvas with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Only fill with white background if transparency is disabled
      if (!transparentBackground) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Set default drawing properties
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen, transparentBackground]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    
    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Only fill with white background if transparency is disabled
    if (!transparentBackground) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    
    // Create a temporary canvas for saving with transparency
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Clear the temporary canvas
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the original canvas content onto the temporary canvas
    tempCtx.drawImage(canvas, 0, 0);
    
    // Save with transparency support
    const dataUrl = tempCanvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  const toggleBackground = () => {
    setTransparentBackground(!transparentBackground);
    clearCanvas();
  };

  const drawShape = (e, shape) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = 'source-over';
    
    if (shape === 'rectangle') {
      ctx.strokeRect(x - 25, y - 15, 50, 30);
    } else if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 border-b">
          {/* Tools */}
          <div className="flex gap-2">
            <button
              onClick={() => setTool('brush')}
              className={`p-2 rounded-md ${tool === 'brush' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
              title="Brush"
            >
              <Brush size={20} />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-md ${tool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
              title="Eraser"
            >
              <Eraser size={20} />
            </button>
            <button
              onClick={(e) => drawShape(e, 'rectangle')}
              className="p-2 rounded-md bg-white hover:bg-gray-100"
              title="Rectangle"
            >
              <Square size={20} />
            </button>
            <button
              onClick={(e) => drawShape(e, 'circle')}
              className="p-2 rounded-md bg-white hover:bg-gray-100"
              title="Circle"
            >
              <Circle size={20} />
            </button>
          </div>

          {/* Background Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleBackground}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                transparentBackground 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
              title={transparentBackground ? 'Transparent Background' : 'White Background'}
            >
              {transparentBackground ? <Eye size={16} /> : <EyeOff size={16} />}
              {transparentBackground ? 'Transparent' : 'White'}
            </button>
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Size:</span>
            <input
              type="range"
              min="1"
              max="30"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm w-8">{brushSize}</span>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <Palette size={20} />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={clearCanvas}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              <RotateCcw size={16} />
              Clear
            </button>
            <button
              onClick={saveDrawing}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <Download size={16} />
              Use This Drawing
            </button>
          </div>
        </div>

        {/* Color Palette */}
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border-b">
          <span className="text-sm font-medium mr-2">Quick Colors:</span>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded border-2 ${color === c ? 'border-gray-800' : 'border-gray-300'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        {/* Canvas */}
        <div className="flex justify-center p-6">
          <div className="relative">
            {/* Checkerboard background for transparency visualization */}
            {transparentBackground && (
              <div 
                className="absolute inset-0 pointer-events-none"
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
            )}
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="border-2 border-gray-300 rounded-lg cursor-crosshair relative z-10"
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                backgroundColor: transparentBackground ? 'transparent' : 'white'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 