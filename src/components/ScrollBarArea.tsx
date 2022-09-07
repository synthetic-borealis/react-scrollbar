import React, { ReactNode, useCallback, useEffect, useRef, useState, } from 'react';
import PropTypes from 'prop-types';
import './ScrollBarArea.scss';

interface IScrollBarAreaProps {
  children?: ReactNode;
}

function ScrollBarArea({ children }: IScrollBarAreaProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const scrollThumbRef = useRef<HTMLDivElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const [thumbHeight, setThumbHeight] = useState<number>(20);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [scrollStartPosition, setScrollStartPosition] = useState<number>(0);
  const [initialScrollTop, setInitialScrollTop] = useState<number>(0);

  function handleResize(ref: HTMLDivElement, trackSize: number) {
    const { clientHeight, scrollHeight } = ref;
    setThumbHeight(Math.max((clientHeight / scrollHeight) * trackSize, 20));
  }

  function handleWheel(evt: React.WheelEvent) {
    evt.stopPropagation();
    if (contentRef.current) {
      contentRef.current.scrollBy({
        top: evt.deltaY,
        behavior: 'smooth',
      });
    }
  }

  const handleThumbPosition = useCallback(
    () => {
      if (
        !contentRef.current ||
        !scrollTrackRef.current ||
        !scrollThumbRef.current
      ) {
        return;
      }
      const {
        scrollTop: contentTop,
        scrollHeight: contentHeight,
      } = contentRef.current;
      const {
        clientHeight: trackHeight,
      } = scrollTrackRef.current;
      const newTop = Math.min(
        (contentTop / contentHeight) * trackHeight,
        trackHeight - thumbHeight,
      );
      const thumb = scrollThumbRef.current;

      thumb.style.top = `${newTop}px`;
    },
    [thumbHeight]
  );

  const handleTrackClick = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
      const [
        { current: trackCurrent },
        { current: contentCurrent }
      ] = [scrollTrackRef, contentRef];

      if (trackCurrent && contentCurrent) {
        const { clientY } = evt;
        const target = evt.target as HTMLDivElement;
        const rect = target.getBoundingClientRect();
        const trackTop = rect.top;
        const thumbOffset = -(thumbHeight / 2);
        const clickRatio = (clientY - trackTop + thumbOffset) / trackCurrent.clientHeight;
        const scrollAmount = Math.floor(clickRatio * contentCurrent.scrollHeight);
        contentCurrent.scrollTo({
          top: scrollAmount,
          behavior: 'smooth',
        });
      }
    },
    [thumbHeight]
  );

  const handleThumbPointerDown = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      if (!(evt.pointerType === 'mouse' && evt.button !== 0)) {
        evt.preventDefault();
        evt.stopPropagation();
        setScrollStartPosition(evt.clientY);
        if (contentRef.current) {
          setInitialScrollTop(contentRef.current.scrollTop);
        }
        setIsDragging(true);
      }
    },
    []
  );

  const handleThumbPointerUp = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      if (!(evt.pointerType === 'mouse' && evt.button !== 0) || evt.type === 'pointerleave') {
        evt.preventDefault();
        evt.stopPropagation();
        if (isDragging) {
          setIsDragging(false);
        }
      }
    },
    [isDragging]
  );

  const handleThumbPointerMove = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (isDragging && contentRef.current) {
        const {
          scrollHeight: contentScrollHeight,
          offsetHeight: contentOffsetHeight,
        } = contentRef.current;
        const deltaY = (evt.clientY - scrollStartPosition) * (contentOffsetHeight / thumbHeight);
        contentRef.current.scrollTop = Math.min(
          initialScrollTop + deltaY,
          contentScrollHeight - contentOffsetHeight
        );
      }
    },
    [isDragging, scrollStartPosition, thumbHeight, initialScrollTop]
  );

  useEffect(() => {
    if (contentRef.current && scrollTrackRef.current) {
      const ref = contentRef.current;
      const { clientHeight: trackSize } = scrollTrackRef.current;
      observer.current = new ResizeObserver(() => {
        handleResize(ref, trackSize);
      });
      observer.current?.observe(ref);
      ref.addEventListener('scroll', handleThumbPosition);
      return () => {
        observer.current?.unobserve(ref);
        ref.removeEventListener('scroll', handleThumbPosition);
      };
    }
    return () => {
    };
  });

  return (
    <div
      className="scroll-bar-area"
      onWheel={handleWheel}
      onPointerLeave={handleThumbPointerUp}
      onPointerMove={handleThumbPointerMove}
      onPointerUp={handleThumbPointerUp}
    >
      <div className="scroll-bar-area__content" ref={contentRef}>
        {children}
      </div>
      <div className="scroll-bar-area__scrollbar">
        <div
          className="scroll-bar-area__scrollbar-track"
          ref={scrollTrackRef}
          onClick={handleTrackClick}
          role="none"
        />
        <div
          className="scroll-bar-area__scrollbar-thumb"
          onPointerDown={handleThumbPointerDown}
          ref={scrollThumbRef}
          style={{
            height: thumbHeight,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        />
      </div>
    </div>
  );
}

ScrollBarArea.defaultProps = {
  children: PropTypes.node,
};

export default ScrollBarArea;
