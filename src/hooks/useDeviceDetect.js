import { useState, useEffect, useCallback, useRef } from 'react';
import UAParser from 'ua-parser-js';

/**
 * Custom hook for detecting the type of device (mobile, tablet, or desktop).
 * Includes specific checks for popular devices like iPad, Samsung Galaxy Tab, and Kindle Fire.
 */
const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLoading, setLoading] = useState(true);

  const initialDeviceType = useRef(null);

  /**
   * Detects the device type using UAParser, screen dimensions, and touch capabilities.
   */
  const detectDevice = useCallback(() => {
    const parser = new UAParser();
    const result = parser.getResult();

    const { device, os, cpu } = result;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;

    // Detect touch capabilities
    const isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

    /**
     * Detect if the device is a desktop.
     */
    const isDefinitelyDesktop = () => {
      return (
        (os.name === 'Windows' && (!userAgent.includes('touch') || !isTouchDevice)) ||
        (os.name === 'Mac OS' && !isTouchDevice) ||
        (os.name === 'Linux' && !userAgent.includes('android') && !isTouchDevice) ||
        cpu.architecture === 'amd64' ||
        cpu.architecture === 'x86_64'
      );
    };

    /**
     * Detect if the device is mobile.
     */
    const isMobileDevice = (() => {
      if (isDefinitelyDesktop()) return false;
      if (device.type === 'mobile') return true;
      if (/mobile|mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) return true;
      if (os.name === 'Android' && screenWidth < 600) return true;
      if (os.name === 'iOS' && !userAgent.includes('ipad')) return true;
      return screenWidth < 600;
    })();

    /**
     * Detect if the device is a tablet, including iPads, Samsung Galaxy Tab, and Kindle Fire devices.
     */
    const isTabletDevice = (() => {
      if (isDefinitelyDesktop()) return false;
      if (device.type === 'tablet') return true;

      // Detect Samsung Galaxy Tab S8, S9, and other common tablets
      const isSamsungGalaxyTab = /samsung|sm-t/i.test(userAgent); // Matches "Samsung" and "SM-T" (common model identifier)
      if (isSamsungGalaxyTab) {
        const isS8orS9 = /sm-x70[0-9]|sm-x80[0-9]/i.test(userAgent); // SM-X70* (Tab S8) or SM-X80* (Tab S9)
        return isS8orS9 || isSamsungGalaxyTab;
      }

      // Detect Kindle Fire devices
      const isKindleFire = /kf[a-z]+/i.test(userAgent); // Matches "KF" model number in Kindle Fire user agent
      if (isKindleFire) return true; // Kindle Fire should always be classified as a tablet

      // General tablet detection
      if (/ipad|playbook|silk|tablet|kindle|galaxy-tab/i.test(userAgent)) return true; // Other tablet identifiers
      if (os.name === 'Android' && screenWidth >= 600 && screenWidth < 1200) return true;
      if (os.name === 'iOS' && userAgent.includes('ipad')) return true;
      if (os.name === 'Windows' && userAgent.includes('touch')) return true;
      return screenWidth >= 600 && screenWidth < 1200;
    })();

    return {
      isMobileDevice,
      isTabletDevice,
      isDefinitelyDesktop: isDefinitelyDesktop(),
    };
  }, []);

  const setDevice = useCallback(() => {
    setLoading(true);

    const { isMobileDevice, isTabletDevice, isDefinitelyDesktop } = detectDevice();

    // Store the initial device type (desktop, mobile, or tablet) to ensure consistent classification
    if (initialDeviceType.current === null) {
      initialDeviceType.current = isDefinitelyDesktop ? 'desktop' : (isTabletDevice ? 'tablet' : 'mobile');
    }

    // Always consider the device as desktop if initially detected as such
    if (initialDeviceType.current === 'desktop') {
      setIsMobile(false);
      setIsTablet(false);
    } else {
      // Adjust based on screen width for mobile/tablet
      if (window.innerWidth < 600) {
        setIsMobile(true);
        setIsTablet(false);
      } else if (window.innerWidth >= 600 && window.innerWidth < 1200) {
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setIsMobile(false);
        setIsTablet(false);
      }
    }

    setLoading(false); // Mark loading as complete once device detection is done
  }, [detectDevice]);

  useEffect(() => {
    // Initial device detection on component mount
    setDevice();

    // Update the device type on window resize or orientation changes
    window.addEventListener('resize', setDevice);
    window.addEventListener('orientationchange', setDevice);

    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('resize', setDevice);
      window.removeEventListener('orientationchange', setDevice);
    };
  }, [setDevice]);

  return {
    isMobile,               // Boolean indicating if the device is a mobile phone
    isTablet,               // Boolean indicating if the device is a tablet
    isMobileOrTablet: isMobile || isTablet,  // Combined flag for mobile or tablet detection
    isDesktop: !isMobile && !isTablet,       // Boolean indicating if the device is a desktop
    isLoading,              // Boolean to indicate if device detection is still in progress
  };
};

export default useDeviceDetect;
