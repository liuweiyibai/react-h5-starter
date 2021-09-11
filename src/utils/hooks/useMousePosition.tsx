import { useState, useEffect, RefObject } from 'react';

// https://github.com/jaredLunde/react-hook/blob/master/packages/mouse-position/src/index.tsx
function useMousePosition<T extends HTMLElement = HTMLElement>(
  domRef: RefObject<T>,
) {
  const [position, setPosition] = useState([0, 0]);

  useEffect(() => {
    function handleScroll() {
      setPosition([domRef.current.scrollLeft, domRef.current.scrollTop]);
    }

    domRef.current.addEventListener('scroll', handleScroll, false);
    return () => {};
  }, []);

  return {
    position,
  };
}

export default useMousePosition;
