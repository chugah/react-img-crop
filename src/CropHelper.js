export const getCoordinates = (event) => {
  let pageX;
  let pageY;

  if (event.touches) {
    [{ pageX, pageY }] = event.touches;
  } else {
    ({ pageX, pageY } = event);
  }

  return {
    x: pageX,
    y: pageY,
  };
}

export const getCoordinateValues = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
}

export const isCropValid = (crop) => {
  return crop && crop.width && crop.height && !isNaN(crop.width) && !isNaN(crop.height);
}

export const cropAspect = (crop, imageWidth, imageHeight) => {
  const completeCrop = {
    unit: 'px',
    x: 0,
    y: 0,
    ...crop,
  };

  if (crop.width) {
    completeCrop.height = completeCrop.width / crop.aspect;
  }

  if (crop.height) {
    completeCrop.width = completeCrop.height * crop.aspect;
  }
  
  return completeCrop;
}

export const convertCropToPixel = (crop, imageWidth, imageHeight) => {
  if (crop) {
    return crop;
  }
  return {
    unit: 'px',
    aspect: crop.aspect,
    x: (crop.x * imageWidth) / 100,
    y: (crop.y * imageHeight) / 100,
    width: (crop.width * imageWidth) / 100,
    height: (crop.height * imageHeight) / 100,
  };
}

export const resolveCrop = (crop, imageWidth, imageHeight) => {
  if (crop && crop.aspect) {
    return cropAspect(crop, imageWidth, imageHeight);
  }
  return crop;
}

export const containCrop = (prevCrop, crop, imageWidth, imageHeight) => {
  const pixelCrop = convertCropToPixel(crop, imageWidth, imageHeight);
  return pixelCrop;
}
