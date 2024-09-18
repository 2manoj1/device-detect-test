import React from 'react';
import { QRCode } from 'react-qrcode-logo'; // Library for QR code
import useDeviceDetect from '../hooks/useDeviceDetect'; // Import the custom hook

const DeviceSpecificContent = () => {
  const { isMobileOrTablet, isDesktop, isMobile, isLoading } =
    useDeviceDetect();
  const url = 'https://example.com'; // Replace with your actual URL

  if (isLoading) return <p>Loading</p>;
  return (
    <div>
      {isMobileOrTablet ? (
        // For Mobile and Tablet users, display the open URL link
        <div>
          <p>You're using a {isMobile ? 'mobile' : 'tablet'} device.</p>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open Link
          </a>
        </div>
      ) : isDesktop ? (
        // For Desktop users, show a QR code
        <div>
          <p>You're using a desktop device.</p>
          <QRCode value={url} size={150} />
        </div>
      ) : (
        <p>Device type not detected</p>
      )}
    </div>
  );
};

export default DeviceSpecificContent;
