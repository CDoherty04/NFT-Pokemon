import React from 'react';
import { useENSName } from '../utils/useENS';

/**
 * Component for displaying Ethereum addresses with ENS name resolution
 * @param {Object} props - Component props
 * @param {string} props.address - Ethereum address to display
 * @param {string} props.providerUrl - RPC provider URL for ENS resolution
 * @param {number} props.truncateLength - Length to truncate address if no ENS (default: 10)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showAddress - Whether to show the full address on hover (default: true)
 * @param {boolean} props.ensFirst - Whether to show ENS name first, then address (default: true)
 * @param {Function} props.onClick - Click handler function
 * @param {Object} props.style - Additional inline styles
 */
const ENSAddress = ({
  address,
  providerUrl,
  truncateLength = 10,
  className = '',
  showAddress = true,
  ensFirst = true,
  onClick,
  style = {}
}) => {
  const { ensName, isLoading, isENS } = useENSName(address, providerUrl);

  if (!address) {
    return <span className={className} style={style}>Unknown</span>;
  }

  const displayName = ensName || `${address.substring(0, truncateLength)}...`;
  const fullAddress = address;

  const handleClick = (e) => {
    if (onClick) {
      onClick(e, { address: fullAddress, ensName, isENS });
    }
  };

  return (
    <span
      className={`ens-address ${className} ${isENS ? 'has-ens' : ''} ${isLoading ? 'loading' : ''}`}
      style={style}
      onClick={handleClick}
      title={showAddress ? fullAddress : undefined}
    >
      {isLoading ? (
        <span className="ens-loading">
          {`${address.substring(0, truncateLength)}...`}
          <span className="loading-dots">...</span>
        </span>
      ) : (
        <>
          {ensFirst ? (
            <>
              <span className="ens-name">{displayName}</span>
              {isENS && showAddress && (
                <span className="ens-address-hint">
                  ({`${address.substring(0, 6)}...${address.substring(address.length - 4)}`})
                </span>
              )}
            </>
          ) : (
            <>
              {showAddress && (
                <span className="ens-address-hint">
                  {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
                </span>
              )}
              <span className="ens-name">{displayName}</span>
            </>
          )}
        </>
      )}
      
      <style jsx>{`
        .ens-address {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          cursor: ${onClick ? 'pointer' : 'default'};
          transition: all 0.2s ease;
        }
        
        .ens-address:hover {
          opacity: 0.8;
        }
        
        .ens-address.has-ens .ens-name {
          color: #3b82f6;
          font-weight: 500;
        }
        
        .ens-address-hint {
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .ens-loading {
          opacity: 0.7;
        }
        
        .loading-dots {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </span>
  );
};

export default ENSAddress;
