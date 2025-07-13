"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";

interface ImageUploadProps {
  onImageAdd: (file: File) => void;
  images: File[];
  onImageRemove: (index: number) => void;
}

export default function ImageUpload({
  onImageAdd,
  images,
  onImageRemove,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      onImageAdd(file);
      console.log("Image added:", file.name, file.type);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
        <div className="mb-3 flex flex-wrap gap-2">
          {images.map((image, index) => (
            <div key={index} className="group relative">
              <Image
                src={URL.createObjectURL(image)}
                alt={`Preview ${index + 1}`}
                width={80}
                height={80}
                className="h-20 w-20 rounded-lg border border-gray-300 object-cover"
                unoptimized // Necesario para URLs de blob
              />
              <button
                onClick={() => onImageRemove(index)}
                className="absolute -top-2 -right-2 cursor-pointer rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
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
        className="text-primary-violet mb-2 cursor-pointer rounded-lg border border-gray-300 bg-white/90 p-2 transition-colors hover:bg-gray-100"
        title="Agregar imagen"
      >
        <ImagePlus size={18} />
      </button>
    </div>
  );
}
