/*
  This file is the workhorse of the application.
  It handles and tracks all the mouse movement of the crop guides
  and generates the image copy of the area selected to crop.

  Once a copy of the image is loaded via onImageLoad, all the MouseDown
  functions monitor the image area contained in the crop guides. MouseMove
  keeps a record of the crop guide location while MouseUp and MouseLeave stop
  recording and remove crop guide respectively.

  There are also a series of functions to track the crop guide/area. The
  majority of these functions are prefixed with 'get'. 
*/

import React, { PureComponent } from 'react';
import clsx from 'clsx';
import { convertCropToPixel, containCrop, cropAspect, getCoordinates, getCoordinateValues, isCropValid, resolveCrop } from './CropHelper';
import { cropImgDefaultProps, cropImgPropTypes } from './CropImgProps';

class CropImage extends PureComponent {
  constructor(props) {
    super(props);
    this.window = typeof window !== 'undefined' ? window : {};
    this.document = typeof document !== 'undefined' ? document : {};
    this.state = {};
  }

  componentDidMount() {
    if (this.document.addEventListener) {
      this.document.addEventListener('mousemove', this.onHandleMouseMove);
      this.document.addEventListener('mouseup', this.onHandleMouseUp);
    }
  }

  componentWillUnmount() {
    if (this.document.removeEventListener) {
      this.document.removeEventListener('mousemove', this.onHandleMouseMove);
      this.document.removeEventListener('mouseup', this.onHandleMouseUp);
    }
  }

  onHandleCropMouseDown = (event) => {
    const { crop } = this.props;
    const { width, height } = this.componentDimensions;
    const pixelCrop = convertCropToPixel(crop, width, height);

    event.preventDefault();

    const clientPos = getCoordinates(event);
    const { ord } = event.target.dataset;
    const xInversed = ord === 'nw' || ord === 'w' || ord === 'sw';
    const yInversed = ord === 'nw' || ord === 'n' || ord === 'ne';

    let cropOffset;
    if (pixelCrop.aspect) {
      cropOffset = this.getElementOffset(this.cropSelectRef);
    }

    this.eventData = {
      clientStartX: clientPos.x,
      clientStartY: clientPos.y,
      cropStartWidth: pixelCrop.width,
      cropStartHeight: pixelCrop.height,
      cropStartX: xInversed ? pixelCrop.x + pixelCrop.width : pixelCrop.x,
      cropStartY: yInversed ? pixelCrop.y + pixelCrop.height : pixelCrop.y,
      xInversed,
      yInversed,
      xCrossOver: xInversed,
      yCrossOver: yInversed,
      startXCrossOver: xInversed,
      startYCrossOver: yInversed,
      isResize: event.target.dataset.ord,
      ord,
      cropOffset
    };

    this.mouseDownOnCrop = true;
    this.setState({ cropIsActive: true });
  };

  onHandleComponentMouseDown = (event) => {
    const { crop, keepSelection, onChange } = this.props;
    const componentElem = this.mediaWrapperRef.firstChild;

    if (event.target !== componentElem || !componentElem.contains(event.target)) {
      return;
    }

    if (keepSelection && isCropValid(crop)) {
      return;
    }

    event.preventDefault();

    const clientPos = getCoordinates(event);
    const imageOffset = this.getElementOffset(this.componentRef);
    const x = clientPos.x - imageOffset.left;
    const y = clientPos.y - imageOffset.top;
    const nextCrop = {
      unit: 'px',
      aspect: crop ? crop.aspect : undefined,
      x,
      y,
      width: 0,
      height: 0,
    };

    this.eventData = {
      clientStartX: clientPos.x,
      clientStartY: clientPos.y,
      cropStartWidth: nextCrop.width,
      cropStartHeight: nextCrop.height,
      cropStartX: nextCrop.x,
      cropStartY: nextCrop.y,
      xInversed: false,
      yInversed: false,
      xCrossOver: false,
      yCrossOver: false,
      startXCrossOver: false,
      startYCrossOver: false,
      isResize: true,
      ord: 'nw',
    };

    this.mouseDownOnCrop = true;
    const { width, height } = this.componentDimensions;
    onChange(convertCropToPixel(nextCrop, width, height));
    this.setState({ cropIsActive: true, newCropIsBeingDrawn: true });
  };

  onHandleCropMouseLeave = (event) => {
    event.preventDefault();
    let crop = document.querySelector('.CropImage__crop-selection');
    crop.style.display = 'none';
  }

  onHandleMouseMove = (event) => {
    const { crop, onChange } = this.props;

    if (!this.mouseDownOnCrop) {
      return;
    }

    event.preventDefault();

    if (!this.dragStarted) {
      this.dragStarted = true;
    }

    const { eventData } = this;
    const clientPos = getCoordinates(event);

    eventData.xDiff = clientPos.x - eventData.clientStartX;
    eventData.yDiff = clientPos.y - eventData.clientStartY;

    let nextCrop;

    if (eventData.isResize) {
      nextCrop = this.resizeCrop();
    } else {
      nextCrop = this.dragCrop();
    }

    if (nextCrop !== crop) {
      const { width, height } = this.componentDimensions;

      onChange(convertCropToPixel(nextCrop, width, height));
    }
  };

  onHandleMouseUp = (event) => {
    const { crop, onComplete, onDragEnd } = this.props;

    if (this.mouseDownOnCrop) {
      this.mouseDownOnCrop = false;
      this.dragStarted = false;
      const { width, height } = this.componentDimensions;
      onDragEnd(event);
      onComplete(convertCropToPixel(crop, width, height));
      this.setState({ cropIsActive: false, newCropIsBeingDrawn: false });
    }
  };

  onImageLoad(image) {
    const { onComplete, onChange, onImageLoaded } = this.props;
    const crop = this.makeNewCrop();
    const resolvedCrop = resolveCrop(crop, image.width, image.height);
    const result = onImageLoaded(image);

    if (result !== false) {
      const pixelCrop = convertCropToPixel(resolvedCrop, image.width, image.height);
      onChange(pixelCrop);
      onComplete(pixelCrop);
    }
  }

  get componentDimensions() {
    const { clientWidth, clientHeight } = this.componentRef;
    return { width: clientWidth, height: clientHeight };
  }

  getDocumentOffset() {
    const { clientTop = 0, clientLeft = 0 } = this.document.documentElement || {};
    return { clientTop, clientLeft };
  }

  getWindowOffset() {
    const { pageYOffset = 0, pageXOffset = 0 } = this.window;
    return { pageYOffset, pageXOffset };
  }

  getElementOffset(elem) {
    const rect = elem.getBoundingClientRect();
    const doc = this.getDocumentOffset();
    const win = this.getWindowOffset();

    const top = rect.top + win.pageYOffset - doc.clientTop;
    const left = rect.left + win.pageXOffset - doc.clientLeft;

    return { top, left };
  }

  getCropStyle() {
    const crop = this.makeNewCrop('px');

    return {
      top: `${crop.y}${crop.unit}`,
      left: `${crop.x}${crop.unit}`,
      width: `${crop.width}${crop.unit}`,
      height: `${crop.height}${crop.unit}`,
    };
  }

  getNewSize() {
    const { crop, minWidth, maxWidth, minHeight, maxHeight } = this.props;
    const { eventData } = this;
    const { width, height } = this.componentDimensions;

    let newWidth = eventData.cropStartWidth + eventData.xDiff;

    if (eventData.xCrossOver) {
      newWidth = Math.abs(newWidth);
    }
    newWidth = getCoordinateValues(newWidth, minWidth, maxWidth || width);

    let newHeight;

    if (crop.aspect) {
      newHeight = newWidth / crop.aspect;
    } else {
      newHeight = eventData.cropStartHeight + eventData.yDiff;
    }

    if (eventData.yCrossOver) {
      newHeight = Math.min(Math.abs(newHeight), eventData.cropStartY);
    }

    newHeight = getCoordinateValues(newHeight, minHeight, maxHeight || height);

    if (crop.aspect) {
      newWidth = getCoordinateValues(newHeight * crop.aspect, 0, width);
    }

    return {
      width: newWidth,
      height: newHeight,
    };
  }

  dragCrop() {
    const nextCrop = this.makeNewCrop();
    const { eventData } = this;
    const { width, height } = this.componentDimensions;

    nextCrop.x = getCoordinateValues(eventData.cropStartX + eventData.xDiff, 0, width - nextCrop.width);
    nextCrop.y = getCoordinateValues(eventData.cropStartY + eventData.yDiff, 0, height - nextCrop.height);

    return nextCrop;
  }

  resizeCrop() {
    const { eventData } = this;
    const nextCrop = this.makeNewCrop();
    const { ord } = eventData;

    if (eventData.xInversed) {
      eventData.xDiff -= eventData.cropStartWidth * 2;
      eventData.xDiffPc -= eventData.cropStartWidth * 2;
    }
    if (eventData.yInversed) {
      eventData.yDiff -= eventData.cropStartHeight * 2;
      eventData.yDiffPc -= eventData.cropStartHeight * 2;
    }

    const newSize = this.getNewSize();

    let newX = eventData.cropStartX;
    let newY = eventData.cropStartY;

    if (eventData.xCrossOver) {
      newX = nextCrop.x + (nextCrop.width - newSize.width);
    }

    if (eventData.yCrossOver) {
      if (eventData.lastYCrossover === false) {
        newY = nextCrop.y - newSize.height;
      } else {
        newY = nextCrop.y + (nextCrop.height - newSize.height);
      }
    }

    const { width, height } = this.componentDimensions;
    const containedCrop = containCrop(
      this.props.crop,
      {
        unit: nextCrop.unit,
        x: newX,
        y: newY,
        width: newSize.width,
        height: newSize.height,
        aspect: nextCrop.aspect,
      },
      width,
      height
    );

    if (nextCrop.aspect || CropImage.xyOrds.indexOf(ord) > -1) {
      nextCrop.x = containedCrop.x;
      nextCrop.y = containedCrop.y;
      nextCrop.width = containedCrop.width;
      nextCrop.height = containedCrop.height;
    } else if (CropImage.xOrds.indexOf(ord) > -1) {
      nextCrop.x = containedCrop.x;
      nextCrop.width = containedCrop.width;
    } else if (CropImage.yOrds.indexOf(ord) > -1) {
      nextCrop.y = containedCrop.y;
      nextCrop.height = containedCrop.height;
    }

    eventData.lastYCrossover = eventData.yCrossOver;
    this.crossOverCheck();

    return nextCrop;
  }

  createCropSelection() {
    const style = this.getCropStyle();

    return (
        <div
          ref={n => {
            this.cropSelectRef = n;
          }}
          style={style }
          className="CropImage__crop-selection"
          onMouseDown={this.onHandleCropMouseDown}
          onMouseLeave={this.onHandleCropMouseLeave}
          role="presentation"
        >
          {(
            <div className="CropImage__drag-elements">
              <div className="CropImage__drag-bar ord-n" data-ord="n" />
              <div className="CropImage__drag-bar ord-e" data-ord="e" />
              <div className="CropImage__drag-bar ord-s" data-ord="s" />
              <div className="CropImage__drag-bar ord-w" data-ord="w" />

              <div className="CropImage__drag-handle ord-nw" data-ord="nw" />
              <div className="CropImage__drag-handle ord-n" data-ord="n" />
              <div className="CropImage__drag-handle ord-ne" data-ord="ne" />
              <div className="CropImage__drag-handle ord-e" data-ord="e" />
              <div className="CropImage__drag-handle ord-se" data-ord="se" />
              <div className="CropImage__drag-handle ord-s" data-ord="s" />
              <div className="CropImage__drag-handle ord-sw" data-ord="sw" />
              <div className="CropImage__drag-handle ord-w" data-ord="w" />
            </div>
          )}
        </div>
    );
  }

  makeNewCrop(unit = 'px') {
    const crop = { ...CropImage.defaultCrop, ...this.props.crop };
    const { width, height } = this.componentDimensions;

    return convertCropToPixel(crop, width, height);
  }

  crossOverCheck() {
    const { eventData } = this;

    if (
      (!eventData.xCrossOver && -Math.abs(eventData.cropStartWidth) - eventData.xDiff >= 0) ||
      (eventData.xCrossOver && -Math.abs(eventData.cropStartWidth) - eventData.xDiff <= 0)
    ) {
      eventData.xCrossOver = !eventData.xCrossOver;
    }

    if (
      (!eventData.yCrossOver && -Math.abs(eventData.cropStartHeight) - eventData.yDiff >= 0) ||
      (eventData.yCrossOver && -Math.abs(eventData.cropStartHeight) - eventData.yDiff <= 0)
    ) {
      eventData.yCrossOver = !eventData.yCrossOver;
    }
  }

  render() {
    const {
      className,
      crossorigin,
      crop,
      imageAlt,
      onImageError,
      renderComponent,
      src,
      style,
      imageStyle
    } = this.props;

    const { cropIsActive, newCropIsBeingDrawn } = this.state;
    const cropSelection = isCropValid(crop) && this.componentRef ? this.createCropSelection() : null;

    const componentClasses = clsx('CropImage', className, {
      'CropImage--active': cropIsActive,
      'CropImage--new-crop': newCropIsBeingDrawn,
      'CropImage--fixed-aspect': crop && crop.aspect,
      'CropImage--crop-invisible': crop && cropIsActive && (!crop.width || !crop.height),
    });

    return (
      <div
        ref={n => {
          this.componentRef = n;
        }}
        className={componentClasses}
        style={style}
        onMouseDown={this.onHandleComponentMouseDown}
        role="presentation"
        tabIndex={1}
      >
        <div
          ref={n => { this.mediaWrapperRef = n; }}
        >
          {renderComponent || (
            <img
              ref={this.imageRef}
              crossOrigin={crossorigin}
              className="CropImage__image"
              style={imageStyle}
              src={src}
              onLoad={event => this.onImageLoad(event.target)}
              onError={onImageError}
              alt={imageAlt}
            />
          )}
        </div>
        {cropSelection}
      </div>
    );
  }
}

CropImage.propTypes = {
  ...cropImgPropTypes
};

CropImage.defaultProps = {
  ...cropImgDefaultProps
};

export { CropImage as default, CropImage as Component, cropAspect, containCrop };
