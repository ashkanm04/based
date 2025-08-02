"use client";

import { useEffect, useState } from "react";
import { useMiniKit, useAddFrame, useAuthenticate } from "@coinbase/onchainkit/minikit";

interface FarcasterContext {
  interactor?: {
    verified_accounts?: Array<{
      display_name?: string;
      avatar_url?: string;
      username?: string;
      created_at?: string;
      verified_addresses?: string[];
      is_pro_user?: boolean;
    }>;
    custody_address?: string;
  };
  client?: {
    added?: boolean;
  };
  user?: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    verifications?: string[];
    custodyAddress?: string;
    created_at?: string;
    followerCount?: number;
    followers_count?: number;
    is_pro_user?: boolean;
    proStatus?: boolean;
  };
}

interface UserInfo {
  displayName: string;
  avatar: string;
  username: string;
  createdAt: string;
  custodyAddress: string;
  verifiedWallets: string[];
  proStatus: boolean;
  baseWallets: WalletInfo[];
  farcasterWallets: FarcasterWalletInfo[];
  custodyWallet: WalletInfo | null;
  followerCount: number;
  starLevel: string;
  highestDiscordRole: string;
}

interface FarcasterWalletInfo {
  address: string;
  network: string;
  firstTransactionDate: string;
  hasSmartWallet: boolean;
  gelReceived: number;
  transactionCount: number;
  isLinked: boolean;
  bnsName?: string;
  talentScore: number;
  discordRole?: string;
}

interface WalletInfo {
  address: string;
  firstTransactionDate: string;
  hasSmartWallet: boolean;
  gelReceived: number;
  transactionCount: number;
  bnsName?: string;
  isCustody?: boolean;
  talentScore: number;
  discordRole?: string;
}

export default function BasedPage() {
  const { context, setFrameReady, isFrameReady } = useMiniKit();
  const { signIn } = useAuthenticate();
  const addFrame = useAddFrame();
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasUserContext, setHasUserContext] = useState(false);

  // Set frame ready when component mounts
  useEffect(() => {
    console.log("Frame ready status:", isFrameReady);
    if (!isFrameReady) {
      console.log("Setting frame ready...");
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const formatWalletAddress = (address: string, bnsName?: string) => {
    if (bnsName) {
      return bnsName;
    }
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

                                                                                                                                               const getRealWalletData = async () => {
      // First, try to get user data from Neynar API using FID
      const userData = (context as FarcasterContext)?.user;
      if (userData && userData.fid) {
        try {
          console.log("Getting wallet data from Neynar using FID:", userData.fid);
          const response = await fetch(`/api/neynar-user-by-fid?fid=${userData.fid}`);
          const neynarData = await response.json();
          
          if (neynarData && neynarData.verified_addresses && neynarData.verified_addresses.length > 0) {
            console.log("Found verified addresses from Neynar:", neynarData.verified_addresses);
            return neynarData.verified_addresses.map((address: string) => ({
              address: address,
              firstTransactionDate: neynarData.created_at || "2024-01-15",
              hasSmartWallet: false,
              gelReceived: 0,
              transactionCount: 0,
              bnsName: undefined,
              talentScore: 0,
              discordRole: "Member"
            }));
          }
        } catch (error) {
          console.error("Error fetching wallet data from Neynar by FID:", error);
        }
      }
      
      // Fallback: Try to get verified addresses from context
      const verifiedAddresses = (context as FarcasterContext)?.interactor?.verified_accounts?.[0]?.verified_addresses || 
                               (context as FarcasterContext)?.user?.verifications || 
                               [];
      
      console.log("Verified addresses from context:", verifiedAddresses);
      
      if (verifiedAddresses.length === 0) {
        return []; // Return empty array if no real addresses
      }
      
      // Use Neynar API to get real wallet data
      const walletPromises = verifiedAddresses.map(async (address: string) => {
        try {
          // Fetch user data from Neynar API
          const response = await fetch(`/api/neynar-user?address=${address}`);
          const userData = await response.json();
          
          if (!userData || userData.error) {
            console.error("No user data found for address:", address);
            return null;
          }
          
          return {
            address: address,
            firstTransactionDate: userData.created_at || "2024-01-15",
            hasSmartWallet: false, // Would be determined by checking contract code
            gelReceived: 0, // Would come from blockchain data
            transactionCount: 0, // Would come from blockchain data
            bnsName: undefined, // Would come from BNS API
            talentScore: 0, // Would come from Talent Protocol
            discordRole: "Member" // Would come from Discord API
          };
        } catch (error) {
          console.error("Error fetching wallet data from Neynar:", error);
          return null;
        }
      });
      
              const results = await Promise.all(walletPromises);
        return results.filter((wallet: WalletInfo | null) => wallet !== null);
    };

  const getHighestDiscordRole = (wallets: (WalletInfo | FarcasterWalletInfo)[]): string => {
    const roleHierarchy = {
      "Owner": 10,
      "Admin": 9,
      "Moderator": 8,
      "Contributor": 7,
      "Builder": 6,
      "Member": 5,
      "Custody": 4,
      "Guest": 3,
      "New": 2,
      "None": 1
    };

    let highestRole = "Member";
    let highestScore = roleHierarchy["Member"];

    wallets.forEach((wallet: WalletInfo | FarcasterWalletInfo) => {
      if (wallet.discordRole && roleHierarchy[wallet.discordRole as keyof typeof roleHierarchy] > highestScore) {
        highestRole = wallet.discordRole;
        highestScore = roleHierarchy[wallet.discordRole as keyof typeof roleHierarchy];
      }
    });

    return highestRole;
  };

  const getStarLevel = (followerCount: number): string => {
    if (followerCount >= 100000) return "⭐ Star";
    if (followerCount >= 50000) return "⭐⭐ Super Star";
    if (followerCount >= 25000) return "⭐⭐⭐ Mega Star";
    if (followerCount >= 10000) return "⭐⭐⭐⭐ Ultra Star";
    if (followerCount >= 5000) return "⭐⭐⭐⭐⭐ Legendary Star";
    if (followerCount >= 1000) return "⭐ Rising Star";
    if (followerCount >= 500) return "⭐ New Star";
    if (followerCount >= 100) return "⭐ Emerging Star";
    return "⭐ Fresh Star";
  };

               // Note: These functions are currently unused but will be implemented when real APIs are available
    // const getTalentScore = async (address: string) => {
    //   try {
    //     // This would be a real API call to Talent Protocol
    //     const response = await fetch(`https://api.talentprotocol.com/v1/passport/${address}`);
    //     const data = await response.json();
    //     return data.score || 0;
    //   } catch {
    //     console.log("Talent Protocol API not available");
    //     return 0;
    //   }
    // };

    // const getBNSName = async (address: string): Promise<string | undefined> => {
    //   try {
    //     // In a real implementation, you would call the BNS API here
    //     // const response = await fetch(`https://api.basename.service/v1/resolve/${address}`);
    //     // const data = await response.json();
    //     // return data.name || undefined;
        
    //     return undefined; // No BNS name found
    //   } catch {
    //     console.log("BNS API not available, no name found");
    //     return undefined;
    //   }
    // };

                                                                                                                                               const getCustodyWalletData = async () => {
      // First, try to get custody address from Neynar API using FID
      const userData = (context as FarcasterContext)?.user;
      if (userData && userData.fid) {
        try {
          console.log("Getting custody address from Neynar using FID:", userData.fid);
          const response = await fetch(`/api/neynar-user-by-fid?fid=${userData.fid}`);
          const neynarData = await response.json();
          
          if (neynarData && neynarData.custodyAddress) {
            console.log("Found custody address from Neynar:", neynarData.custodyAddress);
            return {
              address: neynarData.custodyAddress,
              firstTransactionDate: neynarData.created_at || "2023-10-15",
              hasSmartWallet: false, // Custody wallets are typically EOAs
              gelReceived: 0, // Would come from blockchain data
              transactionCount: 0, // Would come from blockchain data
              bnsName: undefined, // Would come from BNS API
              isCustody: true,
              talentScore: 0, // Would come from Talent Protocol
              discordRole: "Custody"
            };
          }
        } catch (error) {
          console.error("Error fetching custody wallet data from Neynar by FID:", error);
        }
      }
      
      // Fallback: Try to get custody address from context
      const custodyAddress = (context as FarcasterContext)?.interactor?.custody_address || 
                           (context as FarcasterContext)?.user?.custodyAddress;
      
      console.log("Custody address from context:", custodyAddress);
      
      if (!custodyAddress) {
        return null; // Return null if no real custody address
      }
      
      try {
        // Fetch custody wallet data from Neynar API
        const response = await fetch(`/api/neynar-user?address=${custodyAddress}`);
        const userData = await response.json();
        
        if (!userData || userData.error) {
          console.error("No user data found for custody address:", custodyAddress);
          return null;
        }
        
        return {
          address: custodyAddress,
          firstTransactionDate: userData.created_at || "2023-10-15",
          hasSmartWallet: false, // Custody wallets are typically EOAs
          gelReceived: 0, // Would come from blockchain data
          transactionCount: 0, // Would come from blockchain data
          bnsName: undefined, // Would come from BNS API
          isCustody: true,
          talentScore: 0, // Would come from Talent Protocol
          discordRole: "Custody"
        };
      } catch (error) {
        console.error("Error fetching custody wallet data from Neynar:", error);
        return null;
      }
    };

  useEffect(() => {
    const initializeUserInfo = async () => {
      // Wait a bit for context to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("=== FARCaster Context Debug ===");
      console.log("Context exists:", !!context);
      console.log("Context type:", typeof context);
      console.log("Full Context:", context);
      
                    // Check for user data in different possible locations
       const userData = (context as FarcasterContext & { user?: Record<string, unknown> })?.user || (context as FarcasterContext)?.interactor?.verified_accounts?.[0];
       const hasUserData = Boolean(userData);
       setHasUserContext(hasUserData);
       
       console.log("User data found:", userData);
       console.log("Has user context:", hasUserData);
       
       if (userData) {
         console.log("User display name:", (userData as Record<string, unknown>).display_name || (userData as Record<string, unknown>).displayName);
         console.log("User avatar:", (userData as Record<string, unknown>).avatar_url || (userData as Record<string, unknown>).pfpUrl);
         console.log("User username:", (userData as Record<string, unknown>).username);
         console.log("User creation date:", (userData as Record<string, unknown>).created_at || (userData as Record<string, unknown>).createdAt);
         console.log("User follower count:", (userData as Record<string, unknown>).followerCount || (userData as Record<string, unknown>).followers_count);
         console.log("User pro status:", (userData as Record<string, unknown>).is_pro_user || (userData as Record<string, unknown>).proStatus);
         console.log("All user data keys:", Object.keys(userData as Record<string, unknown>));
       }
      
      console.log("Context Interactor:", (context as FarcasterContext)?.interactor);
      console.log("Context Client:", (context as FarcasterContext)?.client);
      console.log("Verified Accounts:", (context as FarcasterContext)?.interactor?.verified_accounts);
      console.log("First Verified Account:", (context as FarcasterContext)?.interactor?.verified_accounts?.[0]);
      console.log("Verified Addresses:", (context as FarcasterContext)?.interactor?.verified_accounts?.[0]?.verified_addresses);
      console.log("Custody Address:", (context as FarcasterContext)?.interactor?.custody_address);
      console.log("Frame Added:", (context as FarcasterContext)?.client?.added);
      
             // Check if we're in a real Farcaster environment
       const hasRealUserData = Boolean(userData);
       console.log("Has Real User Data:", hasRealUserData);
       console.log("Environment:", hasRealUserData ? "Real Farcaster" : "Preview/Demo Mode");
      
             // Test if context has any user data at all
       if (context) {
         console.log("Context keys:", Object.keys(context));
         if ((context as FarcasterContext & { user?: Record<string, unknown> }).user) {
           console.log("User data found:", (context as FarcasterContext & { user?: Record<string, unknown> }).user);
         }
       }
      console.log("=== End Debug ===");
      
                           // Get real user data from Farcaster context
        const verifiedAccount = (context as FarcasterContext)?.interactor?.verified_accounts?.[0];
        const custodyAddress = (context as FarcasterContext)?.interactor?.custody_address;
        
        // Get user creation date from context.user
        const userCreationDate = (userData as Record<string, unknown>)?.created_at as string || 
                                (userData as Record<string, unknown>)?.createdAt as string || 
                                verifiedAccount?.created_at || 
                                "2023-10-15";
       
        // Get follower count from user data
        const followerCount = (userData as Record<string, unknown>)?.followerCount as number || 
                            (userData as Record<string, unknown>)?.followers_count as number || 
                            (userData as Record<string, unknown>)?.followersCount as number || 
                            0;
        const starLevel = getStarLevel(followerCount);
       
        const realUserInfo: UserInfo = {
          displayName: (userData as Record<string, unknown>)?.display_name as string || (userData as Record<string, unknown>)?.displayName as string || verifiedAccount?.display_name || "User",
          avatar: (userData as Record<string, unknown>)?.avatar_url as string || (userData as Record<string, unknown>)?.pfpUrl as string || verifiedAccount?.avatar_url || "/default-avatar.png",
          username: (userData as Record<string, unknown>)?.username as string || verifiedAccount?.username || "user",
          createdAt: userCreationDate,
          custodyAddress: custodyAddress || "",
          verifiedWallets: verifiedAccount?.verified_addresses || [],
          proStatus: (userData as Record<string, unknown>)?.is_pro_user as boolean || 
                    (userData as Record<string, unknown>)?.proStatus as boolean || 
                    verifiedAccount?.is_pro_user || 
                    false,
         baseWallets: await getRealWalletData(),
                   farcasterWallets: (await getRealWalletData()).map((wallet: WalletInfo) => ({
            ...wallet,
            network: "Base",
            isLinked: true
          })),
         custodyWallet: await getCustodyWalletData(),
         followerCount: followerCount,
         starLevel: starLevel,
         highestDiscordRole: "Member", // Will be calculated after wallets are created
       };
      
               // Calculate highest Discord role after all wallets are created
       const allWallets: (WalletInfo | FarcasterWalletInfo)[] = [
         ...realUserInfo.baseWallets,
         ...realUserInfo.farcasterWallets,
         ...(realUserInfo.custodyWallet ? [realUserInfo.custodyWallet] : [])
       ];
       realUserInfo.highestDiscordRole = getHighestDiscordRole(allWallets);
      
      console.log("User info:", realUserInfo);
      console.log("Base wallets:", realUserInfo.baseWallets);
      console.log("Farcaster wallets:", realUserInfo.farcasterWallets);
      console.log("Custody wallet:", realUserInfo.custodyWallet);
      console.log("Custody address:", realUserInfo.custodyAddress);
      
      setUserInfo(realUserInfo);
      setIsLoading(false);
    };

    initializeUserInfo();
  }, [context]);

  const handleAction = async (action: string) => {
    if (action === 'add-frame') {
      try {
        const result = await addFrame();
        if (result) {
          console.log('Frame added:', result.url, result.token);
          setSelectedAction(action);
          setIsOverlayVisible(true);
        }
      } catch (error) {
        console.error('Failed to add frame:', error);
      }
    } else {
      setSelectedAction(action);
      setIsOverlayVisible(true);
    }
  };

  const getBasedScore = () => {
    if (!userInfo) return 0;
    
    let score = 0;
    score += userInfo.proStatus ? 20 : 0;
    score += userInfo.baseWallets.length * 15;
    score += userInfo.baseWallets.reduce((sum, wallet: WalletInfo) => sum + wallet.transactionCount, 0) * 2;
    score += userInfo.baseWallets.reduce((sum, wallet: WalletInfo) => sum + wallet.gelReceived, 0) * 0.1;
    
    return Math.min(score, 100);
  };

     if (isLoading) {
     return (
       <div className="relative overflow-hidden rounded-xl transition-all duration-300 ease-in-out w-[695px] h-screen max-w-full">
         <div className="flex h-full flex-1 flex-col bg-muted">
           <div className="relative flex size-full min-h-0 flex-1 flex-col bg-app">
             <div className="size-full flex-1 opacity-100 bg-gradient-to-b from-blue-100 via-white to-blue-200 flex items-center justify-center">
               {/* Luminous center band effect */}
               <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 via-white/80 via-white/60 to-transparent pointer-events-none"></div>
               <div className="absolute inset-0 bg-gradient-radial from-white/40 via-transparent to-transparent pointer-events-none"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>     
               <div className="relative z-10 text-center">
                 <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600 mx-auto mb-4"></div>
                 <p className="text-blue-600 font-medium">Loading Based Profile...</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     );
   }



     return (
     <div className="relative overflow-hidden rounded-xl transition-all duration-300 ease-in-out w-[695px] h-full max-w-full">
       <div className="flex h-full flex-1 flex-col bg-muted">
         <div className="relative flex size-full min-h-0 flex-1 flex-col bg-app">
           <div className="size-full flex-1 opacity-100 bg-gradient-to-b from-blue-100 via-white to-blue-200 flex flex-col overflow-y-auto relative">
            {/* Luminous center band effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 via-white/80 via-white/60 to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-radial from-white/40 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="p-4 text-gray-800">
                                 <div className="flex items-center space-x-4 mb-6">
                   <div className="relative">
                                           {hasUserContext ? (
                        <div className="relative">
                                                     <img 
                             src={userInfo?.avatar} 
                             alt="Avatar" 
                             className="w-16 h-16 rounded-full border-2 border-white object-cover"
                           />
                                                     {userInfo?.proStatus && (
                            <img 
                              src="/icons/pro.png" 
                              alt="Pro" 
                              className="absolute -bottom-1 -right-1 w-6 h-6 drop-shadow-lg"
                            />
                          )}
                        </div>
                      ) : (
                       <div className="relative">
                                                                              <img 
                             src={userInfo?.avatar} 
                             alt="Avatar" 
                             className="w-16 h-16 rounded-full border-2 border-white opacity-50 object-cover"
                           />
                         <button
                           className="absolute inset-0 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-600 transition-colors"
                           onClick={() => setShowLoginModal(true)}
                           title="Login"
                         >
                           <span className="text-xs font-bold">Login</span>
                         </button>
                       </div>
                     )}
                   </div>
                  <div>
                                         <h1 className="text-2xl font-bold text-gray-800">{userInfo?.displayName}</h1>
                     <p className="text-gray-600">@{userInfo?.username}</p>
                     <div className="flex items-center space-x-2 mt-1">
                       {userInfo?.proStatus && (
                         <span className="text-purple-500 text-lg">✓</span>
                       )}
                       <span className="text-xs text-gray-500">Member since {new Date(userInfo?.createdAt || '').toLocaleDateString()}</span>
                     </div>
                     <div className="flex items-center space-x-2 mt-2">
                       <span className="text-yellow-500 text-sm font-medium">{userInfo?.starLevel}</span>
                       <span className="text-xs text-gray-500">({userInfo?.followerCount?.toLocaleString()} followers)</span>
                     </div>
                     <div className="flex items-center space-x-2 mt-1">
                       <span className="text-blue-500 text-sm font-medium">Discord: {userInfo?.highestDiscordRole}</span>
                     </div>
                  </div>
                </div>

                                 {/* Base Wallets Info */}
                 {(userInfo?.baseWallets?.length || 0) > 0 && (
                  <div className="space-y-4 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Base Wallets</h2>
                                         {userInfo?.baseWallets?.map((wallet, index) => (
                      <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">{formatWalletAddress(wallet.address, wallet.bnsName)}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${wallet.hasSmartWallet ? 'bg-green-500' : 'bg-gray-600'}`}>
                            {wallet.hasSmartWallet ? 'Smart Wallet' : 'EOA'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">First TX:</span>
                            <p className="text-gray-700">{new Date(wallet.firstTransactionDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">GEL:</span>
                            <p className="text-gray-700">{wallet.gelReceived.toFixed(1)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">TX Count:</span>
                            <p className="text-gray-700">{wallet.transactionCount}</p>
                          </div>
                        </div>
                        {/* Talent Score for this wallet */}
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-purple-600 font-medium">Talent Score</span>
                            <span className="text-xs text-purple-600 font-medium">{wallet.talentScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-gradient-to-r from-purple-300 to-purple-600 h-1 rounded-full transition-all duration-500"
                              style={{ width: `${wallet.talentScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                                 {/* Custody Wallet */}
                 {userInfo?.custodyWallet && (
                  <div className="space-y-4 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Farcaster Custody Wallet</h2>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border-l-4 border-orange-500 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">{formatWalletAddress(userInfo?.custodyWallet?.address || '', userInfo?.custodyWallet?.bnsName)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 rounded-full text-xs bg-orange-500 text-white">
                            Custody
                          </span>
                                                     <span className={`px-2 py-1 rounded-full text-xs ${userInfo?.custodyWallet?.hasSmartWallet ? 'bg-green-500' : 'bg-gray-600'}`}>
                             {userInfo?.custodyWallet?.hasSmartWallet ? 'Smart Wallet' : 'EOA'}
                           </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">First TX:</span>
                                                     <p className="text-gray-700">{new Date(userInfo?.custodyWallet?.firstTransactionDate || '').toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">GEL:</span>
                                                     <p className="text-gray-700">{userInfo?.custodyWallet?.gelReceived?.toFixed(1)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">TX Count:</span>
                                                     <p className="text-gray-700">{userInfo?.custodyWallet?.transactionCount}</p>
                        </div>
                      </div>
                      {/* Talent Score for custody wallet */}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-purple-600 font-medium">Talent Score</span>
                                                     <span className="text-xs text-purple-600 font-medium">{userInfo?.custodyWallet?.talentScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-gradient-to-r from-purple-300 to-purple-600 h-1 rounded-full transition-all duration-500"
                                                         style={{ width: `${userInfo?.custodyWallet?.talentScore || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                                 {/* Farcaster Linked Wallets */}
                 {(userInfo?.farcasterWallets?.length || 0) > 0 && (
                  <div className="space-y-4 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Farcaster Linked Wallets (Base)</h2>
                                         {userInfo?.farcasterWallets?.map((wallet, index) => (
                      <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border-l-4 border-purple-500 shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800">{formatWalletAddress(wallet.address, wallet.bnsName)}</span>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-500">
                              {wallet.network}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${wallet.hasSmartWallet ? 'bg-green-500' : 'bg-gray-600'}`}>
                              {wallet.hasSmartWallet ? 'Smart Wallet' : 'EOA'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${wallet.isLinked ? 'bg-blue-500' : 'bg-gray-600'}`}>
                              {wallet.isLinked ? 'Linked' : 'Not Linked'}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">First TX:</span>
                            <p className="text-gray-700">{new Date(wallet.firstTransactionDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">GEL:</span>
                            <p className="text-gray-700">{wallet.gelReceived.toFixed(1)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">TX Count:</span>
                            <p className="text-gray-700">{wallet.transactionCount}</p>
                          </div>
                        </div>
                        {/* Talent Score for Farcaster linked wallet */}
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-purple-600 font-medium">Talent Score</span>
                            <span className="text-xs text-purple-600 font-medium">{wallet.talentScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-gradient-to-r from-purple-300 to-purple-600 h-1 rounded-full transition-all duration-500"
                              style={{ width: `${wallet.talentScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Based Score */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-blue-300">New Based</span>
                    <span className="text-lg font-semibold text-blue-600">All Based</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-300 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getBasedScore()}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-6">
                  <button 
                    onClick={() => handleAction('follow')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-3 rounded-lg font-medium transition-colors text-sm flex-1"
                  >
                    Follow
                  </button>
                  <button 
                    onClick={() => handleAction('add-frame')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-3 rounded-lg font-medium transition-colors text-sm flex-1"
                  >
                    Add Frame
                  </button>
                  <button 
                    onClick={() => handleAction('share')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-3 rounded-lg font-medium transition-colors text-sm flex-1"
                  >
                    Share
                  </button>
                  <button 
                    onClick={() => handleAction('mint-nft')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-3 rounded-lg font-medium transition-colors text-sm flex-1"
                  >
                    Mint NFT
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay */}
          <div className={`absolute inset-0 z-20 animate-overlay-show items-end pointer-events-none ${isOverlayVisible ? 'flex' : 'hidden'}`}>
            <div className="h-full flex-1 animate-frame-action-content-show bg-black/90 flex items-center justify-center">
              <div className="text-center text-white p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedAction === 'follow' && 'Following...'}
                  {selectedAction === 'add-frame' && 'Adding Frame...'}
                  {selectedAction === 'share' && 'Sharing...'}
                  {selectedAction === 'mint-nft' && 'Minting NFT...'}
                </h2>
                <p className="text-gray-300 mb-4">
                  {selectedAction === 'follow' && 'You are now following this user'}
                  {selectedAction === 'add-frame' && 'Frame added to your collection'}
                  {selectedAction === 'share' && 'Profile shared successfully'}
                  {selectedAction === 'mint-nft' && 'NFT minting in progress...'}
                </p>
                <button 
                  onClick={() => setIsOverlayVisible(false)}
                  className="bg-white text-black px-6 py-2 rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2 text-center">Login</h2>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-100 to-blue-100 hover:from-pink-200 hover:to-blue-200 shadow-md font-bold text-blue-700 transition-all"
              onClick={async () => {
                if (typeof signIn !== "function") {
                  alert("Farcaster login is not available in this environment.");
                  return;
                }
                try {
                  const result = await signIn();
                  if (result) {
                    setShowLoginModal(false);
                    window.location.reload();
                  }
                } catch {
                  alert("Farcaster login failed. Please try again in a supported environment.");
                }
              }}
            >
              <span className="text-2xl">🟣</span> Farcaster Login
            </button>
            <button className="mt-2 text-gray-500 hover:text-blue-700" onClick={() => setShowLoginModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
} 