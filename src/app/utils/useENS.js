import { useState, useEffect, useCallback, useRef } from 'react';
import { formatAddressWithENS, batchResolveENSNames } from './ensUtils';

/**
 * Custom hook for ENS resolution with caching
 * @param {string} providerUrl - RPC provider URL for ENS resolution
 * @returns {Object} - Object containing ENS resolution functions and state
 */
export function useENS(providerUrl = 'https://ethereum.publicnode.com') {
  const [ensCache, setEnsCache] = useState(new Map());
  const [loading, setLoading] = useState(new Set());
  const abortControllerRef = useRef(null);

  // Cleanup function for abort controller
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Resolve a single address to ENS name
   * @param {string} address - Ethereum address to resolve
   * @returns {Promise<string>} - ENS name or truncated address
   */
  const resolveAddress = useCallback(async (address) => {
    if (!address) return 'Unknown';
    
    // Check cache first
    if (ensCache.has(address)) {
      return ensCache.get(address);
    }

    // Check if already loading
    if (loading.has(address)) {
      return `${address.substring(0, 10)}...`;
    }

    // Set loading state
    setLoading(prev => new Set(prev).add(address));

    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      const ensName = await formatAddressWithENS(address, 10, providerUrl);
      
      // Update cache
      setEnsCache(prev => new Map(prev).set(address, ensName));
      
      return ensName;
    } catch (error) {
      if (error.name === 'AbortError') {
        return `${address.substring(0, 10)}...`;
      }
      console.error('Error resolving ENS for address:', address, error);
      return `${address.substring(0, 10)}...`;
    } finally {
      // Remove loading state
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(address);
        return newSet;
      });
    }
  }, [ensCache, loading, providerUrl]);

  /**
   * Batch resolve multiple addresses
   * @param {string[]} addresses - Array of Ethereum addresses
   * @returns {Promise<Map<string, string>>} - Map of address to ENS name
   */
  const batchResolve = useCallback(async (addresses) => {
    if (!addresses || addresses.length === 0) {
      return new Map();
    }

    // Filter out addresses already in cache
    const uncachedAddresses = addresses.filter(addr => !ensCache.has(addr));
    
    if (uncachedAddresses.length === 0) {
      // All addresses are cached
      const result = new Map();
      addresses.forEach(addr => {
        result.set(addr, ensCache.get(addr));
      });
      return result;
    }

    try {
      const newResults = await batchResolveENSNames(uncachedAddresses, providerUrl);
      
      // Update cache with new results
      setEnsCache(prev => {
        const newCache = new Map(prev);
        newResults.forEach((ensName, address) => {
          if (ensName) {
            newCache.set(address, ensName);
          } else {
            // Cache truncated address for addresses without ENS names
            newCache.set(address, `${address.substring(0, 10)}...`);
          }
        });
        return newCache;
      });

      // Return combined results
      const result = new Map();
      addresses.forEach(addr => {
        if (ensCache.has(addr)) {
          result.set(addr, ensCache.get(addr));
        } else if (newResults.has(addr)) {
          result.set(addr, newResults.get(addr) || `${addr.substring(0, 10)}...`);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error in batch ENS resolution:', error);
      
      // Return cached results for addresses we have, truncated for others
      const result = new Map();
      addresses.forEach(addr => {
        if (ensCache.has(addr)) {
          result.set(addr, ensCache.get(addr));
        } else {
          result.set(addr, `${addr.substring(0, 10)}...`);
        }
      });
      
      return result;
    }
  }, [ensCache, providerUrl]);

  /**
   * Clear the ENS cache
   */
  const clearCache = useCallback(() => {
    setEnsCache(new Map());
  }, []);

  /**
   * Remove a specific address from cache
   * @param {string} address - Address to remove from cache
   */
  const removeFromCache = useCallback((address) => {
    setEnsCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(address);
      return newCache;
    });
  }, []);

  /**
   * Check if an address is currently being resolved
   * @param {string} address - Address to check
   * @returns {boolean} - True if address is being resolved
   */
  const isResolving = useCallback((address) => {
    return loading.has(address);
  }, [loading]);

  return {
    resolveAddress,
    batchResolve,
    clearCache,
    removeFromCache,
    isResolving,
    cache: ensCache,
    loading: loading.size > 0
  };
}

/**
 * Hook for resolving a single address with automatic updates
 * @param {string} address - Ethereum address to resolve
 * @param {string} providerUrl - RPC provider URL
 * @returns {Object} - Object containing resolved name and loading state
 */
export function useENSName(address, providerUrl = 'https://ethereum.publicnode.com') {
  const [ensName, setEnsName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resolveAddress } = useENS(providerUrl);

  useEffect(() => {
    if (!address) {
      setEnsName('Unknown');
      return;
    }

    let isMounted = true;
    
    const resolveName = async () => {
      setIsLoading(true);
      try {
        const name = await resolveAddress(address);
        if (isMounted) {
          setEnsName(name);
        }
      } catch (error) {
        if (isMounted) {
          setEnsName(`${address.substring(0, 10)}...`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    resolveName();

    return () => {
      isMounted = false;
    };
  }, [address, resolveAddress]);

  return {
    ensName,
    isLoading,
    isENS: ensName && !ensName.includes('...') && ensName !== 'Unknown'
  };
}
