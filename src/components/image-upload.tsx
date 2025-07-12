"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
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
    if (file?.type.startsWith('image/')) {
      onImageAdd(file);
      console.log('Image added:', file.name, file.type);
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
    <div className="w-full">
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
              <Image
                src={URL.createObjectURL(image)}
                alt={`Preview ${index + 1}`}
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                unoptimized // Necesario para URLs de blob
              />
              <button
                onClick={() => onImageRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
        className="mb-2 p-2 text-primary-violet hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 bg-white/90 cursor-pointer"
        title="Agregar imagen"
      >
        <ImagePlus size={18} />
      </button>
    </div>
  );
}
