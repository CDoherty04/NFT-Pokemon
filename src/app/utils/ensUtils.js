import { ethers } from 'ethers';

// ENS Registry contract address on Ethereum mainnet
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

// ENS Registry ABI (minimal for name resolution)
const ENS_REGISTRY_ABI = [
  'function resolver(bytes32 node) external view returns (address)',
];

// ENS Resolver ABI (minimal for address resolution)
const ENS_RESOLVER_ABI = [
  'function addr(bytes32 node) external view returns (address)',
  'function name(bytes32 node) external view returns (string)',
];

// ENS Name ABI (for reverse resolution)
const ENS_NAME_ABI = [
  'function name(bytes32 node) external view returns (string)',
];

/**
 * Convert an Ethereum address to an ENS name
 * @param {string} address - The Ethereum address to resolve
 * @param {string} providerUrl - RPC provider URL (defaults to Ethereum mainnet)
 * @returns {Promise<string|null>} - The ENS name or null if not found
 */
export async function addressToENSName(address, providerUrl = 'https://ethereum.publicnode.com') {
  try {
    if (!ethers.isAddress(address)) {
      return null;
    }

    const provider = new ethers.JsonRpcProvider(providerUrl);
    
    // Create ENS Registry contract instance
    const ensRegistry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
    
    // Get the reverse node hash for the address
    const reverseNode = ethers.namehash(`${address.slice(2).toLowerCase()}.addr.reverse`);
    
    // Get the resolver for the reverse node
    const resolverAddress = await ensRegistry.resolver(reverseNode);
    
    if (resolverAddress === ethers.ZeroAddress) {
      return null;
    }
    
    // Create resolver contract instance
    const resolver = new ethers.Contract(resolverAddress, ENS_NAME_ABI, provider);
    
    // Get the name from the resolver
    const name = await resolver.name(reverseNode);
    
    return name || null;
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return null;
  }
}

/**
 * Convert an ENS name to an Ethereum address
 * @param {string} name - The ENS name to resolve
 * @param {string} providerUrl - RPC provider URL (defaults to Ethereum mainnet)
 * @returns {Promise<string|null>} - The Ethereum address or null if not found
 */
export async function ensNameToAddress(name, providerUrl = 'https://ethereum.publicnode.com') {
  try {
    if (!name || typeof name !== 'string') {
      return null;
    }

    const provider = new ethers.JsonRpcProvider(providerUrl);
    
    // Create ENS Registry contract instance
    const ensRegistry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ENS_REGISTRY_ABI, provider);
    
    // Get the node hash for the name
    const node = ethers.namehash(name);
    
    // Get the resolver for the node
    const resolverAddress = await ensRegistry.resolver(node);
    
    if (resolverAddress === ethers.ZeroAddress) {
      return null;
    }
    
    // Create resolver contract instance
    const resolver = new ethers.Contract(resolverAddress, ENS_RESOLVER_ABI, provider);
    
    // Get the address from the resolver
    const address = await resolver.addr(node);
    
    return address !== ethers.ZeroAddress ? address : null;
  } catch (error) {
    console.error('Error resolving ENS address:', error);
    return null;
  }
}

/**
 * Format an address with ENS name if available, otherwise truncate
 * @param {string} address - The Ethereum address to format
 * @param {number} truncateLength - Length to truncate address if no ENS name (default: 10)
 * @param {string} providerUrl - RPC provider URL
 * @returns {Promise<string>} - Formatted address with ENS name or truncated address
 */
export async function formatAddressWithENS(address, truncateLength = 10, providerUrl) {
  if (!address) return 'Unknown';
  
  try {
    const ensName = await addressToENSName(address, providerUrl);
    if (ensName) {
      return ensName;
    }
    
    // Fallback to truncated address
    return `${address.substring(0, truncateLength)}...`;
  } catch (error) {
    console.error('Error formatting address with ENS:', error);
    return `${address.substring(0, truncateLength)}...`;
  }
}

/**
 * Batch resolve multiple addresses to ENS names
 * @param {string[]} addresses - Array of Ethereum addresses to resolve
 * @param {string} providerUrl - RPC provider URL
 * @returns {Promise<Map<string, string>>} - Map of address to ENS name
 */
export async function batchResolveENSNames(addresses, providerUrl) {
  const results = new Map();
  
  try {
    const promises = addresses.map(async (address) => {
      const ensName = await addressToENSName(address, providerUrl);
      return { address, ensName };
    });
    
    const resolved = await Promise.allSettled(promises);
    
    resolved.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { address, ensName } = result.value;
        results.set(address, ensName);
      }
    });
  } catch (error) {
    console.error('Error in batch ENS resolution:', error);
  }
  
  return results;
}

/**
 * Check if a string is a valid ENS name
 * @param {string} name - String to check
 * @returns {boolean} - True if valid ENS name format
 */
export function isValidENSName(name) {
  if (!name || typeof name !== 'string') return false;
  
  // Basic ENS name validation
  const ensPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return ensPattern.test(name) && name.includes('.');
}
