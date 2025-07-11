"use client";

import React, { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';

interface ImageUploadProps {
  onImageAdd: (file: File) => void;
  images: File[];
  onImageRemove: (index: number) => void;
}

export default function ImageUpload({ onImageAdd, images, onImageRemove }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageAdd(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(image)}
                alt={`Preview ${index + 1}`}
                className="w-20 h-20 object-cover rounded-lg border border-gray-300"
              />
              <button
                onClick={() => onImageRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Eliminar imagen"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload button */}
      <button
        type="button"
        onClick={handleButtonClick}
        className="absolute left-12 top-1/2 transform -translate-y-1/2 p-2 text-primary-violet hover:bg-gray-100 rounded-lg transition-colors z-20"
        title="Agregar imagen"
      >
        <ImagePlus size={18} />
      </button>
    </>
  );
}
