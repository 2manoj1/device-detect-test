import { useState, useEffect, useCallback, useRef } from 'react';
import UAParser from 'ua-parser-js';

const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const initialDeviceType = useRef(null);

  const detectDevice = useCallback(() => {
    const parser = new UAParser();
    const result = parser.getResult();

    const { device, os, cpu } = result;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    // Detect touch capabilities
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

    // Definitive desktop check
    const isDefinitelyDesktop = () => {
      return (
        (os.name === 'Windows' && !userAgent.includes('touch')) ||
        (os.name === 'Mac OS' && !isTouchDevice) ||
        (os.name === 'Linux' && !userAgent.includes('android')) ||
        cpu.architecture === 'amd64' ||
        cpu.architecture === 'x86_64'
      );
    };

    // Mobile detection
    const isMobileDevice = (() => {
      if (isDefinitelyDesktop()) return false;
      if (device.type === 'mobile') return true;
      if (
        /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(
          userAgent
        )
      )
        return true;
      if (os.name === 'Android' && screenWidth < 600) return true;
      if (os.name === 'iOS' && !userAgent.includes('ipad')) return true;
      return screenWidth < 600; // Consider small screens as mobile
    })();

    // Tablet detection
    const isTabletDevice = (() => {
      if (isDefinitelyDesktop()) return false;
      if (device.type === 'tablet') return true;
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) return true;
      if (os.name === 'Android' && screenWidth >= 600 && screenWidth < 1200)
        return true;
      if (os.name === 'iOS' && userAgent.includes('ipad')) return true;
      if (os.name === 'Windows' && userAgent.includes('touch')) return true;
      return screenWidth >= 600 && screenWidth < 1200; // Consider medium screens as tablet
    })();

    return {
      isMobileDevice,
      isTabletDevice,
      isDefinitelyDesktop: isDefinitelyDesktop(),
    };
  }, []);

  const setDevice = useCallback(() => {
    setLoading(true);

    let { isMobileDevice, isTabletDevice, isDefinitelyDesktop } =
      detectDevice();

    // If it's the initial detection, store the device type
    if (initialDeviceType.current === null) {
      initialDeviceType.current = isDefinitelyDesktop
        ? 'desktop'
        : isTabletDevice
        ? 'tablet'
        : 'mobile';
    }

    // Always consider it a desktop if initially detected as desktop
    if (initialDeviceType.current === 'desktop') {
      isMobileDevice = false;
      isTabletDevice = false;
    } else {
      // For mobile and tablet, allow responsive adjustments
      if (window.innerWidth < 600) {
        isMobileDevice = true;
        isTabletDevice = false;
      } else if (window.innerWidth >= 600 && window.innerWidth < 1200) {
        isMobileDevice = false;
        isTabletDevice = true;
      } else {
        isMobileDevice = false;
        isTabletDevice = false;
      }
    }

    setIsMobile(isMobileDevice);
    setIsTablet(isTabletDevice);
    setLoading(false);
  }, [detectDevice]);

  useEffect(() => {
    // Initial device detection
    setDevice();

    // Update device state on resize and orientation change
    window.addEventListener('resize', setDevice);
    window.addEventListener('orientationchange', setDevice);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('resize', setDevice);
      window.removeEventListener('orientationchange', setDevice);
    };
  }, [setDevice]);

  return {
    isMobile,
    isTablet,
    isMobileOrTablet: isMobile || isTablet,
    isDesktop: !isMobile && !isTablet,
    isLoading,
  };
};

export default useDeviceDetect;
