import { useState } from 'react';
import { Image, ImageProps } from 'react-native';

interface PortfolioImageProps extends Omit<ImageProps, 'source'> {
  imageUrl: string;
  imageId: string;
  onError?: () => void;
}

export default function PortfolioImageWithFallback({ 
  imageUrl, 
  imageId,
  onError,
  style,
  ...props 
}: PortfolioImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return null;
  }

  return (
    <Image
      {...props}
      source={{ uri: imageUrl }}
      style={style}
      onError={handleImageError}
    />
  );
}
