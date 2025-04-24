// CachedImage.js
import React, { useState, useEffect } from 'react';
import imageCacheService from './ImageCacheService';

const CachedImage = ({ 
  src, 
  alt, 
  className, 
  fallbackSrc = '/placeholder-book.png',
  onClick 
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadCachedImage = async () => {
      try {
        // Intenta cargar la imagen desde el servicio de caché
        const cachedImageUrl = await imageCacheService.loadImage(src);
        
        if (mounted) {
          if (cachedImageUrl) {
            setImageSrc(cachedImageUrl);
            setLoading(false);
          } else {
            // Si no se pudo cargar desde la caché, marcamos como error
            setError(true);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error loading cached image:', err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadCachedImage();

    // Limpieza al desmontar
    return () => {
      mounted = false;
      // Revocar URL de objeto si existe para evitar fugas de memoria
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="animate-pulse w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <img 
        src={fallbackSrc} 
        alt={alt || 'Image not available'} 
        className={className}
        onClick={onClick}
      />
    );
  }

  return (
    <img 
      src={imageSrc} 
      alt={alt} 
      className={className} 
      onClick={onClick}
      onError={(e) => {
        console.error(`Error displaying cached image: ${src}`);
        setError(true);
        // Limpiar el URL del objeto si es un blob
        if (imageSrc && imageSrc.startsWith('blob:')) {
          URL.revokeObjectURL(imageSrc);
        }
      }}
    />
  );
};

export default CachedImage;