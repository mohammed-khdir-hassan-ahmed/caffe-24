"use client";   
import React from 'react';
import Image from 'next/image';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
    
      <div className="absolute inset-0 overflow-hidden">
   
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gray-100/60 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
        
      
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }} />
        
    
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gray-100/60 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '2s' }} />
        
     
        <div className="absolute -bottom-32 -right-40 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '1.5s' }} />
      </div>

   
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(180,83,9,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(180,83,9,.05)_1px,transparent_1px)] bg-size-[100px_100px] opacity-20" />
      
     
      <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 0%, rgba(255, 255, 255, 0.3) 100%)" />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center gap-4 relative z-10">
        
        {/* Modern Animated Orbs Spinner */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Outer rotating orbit */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gray-700 border-r-amber-600 animate-spin shadow-xl shadow-amber-600/20"
            style={{ animationDuration: '3s' }}
          />
          
          {/* Inner rotating orbit - reverse */}
          <div className="absolute inset-3 rounded-full border-2 border-transparent border-b-gray-700 border-l-amber-600 animate-spin shadow-lg shadow-amber-600/10"
            style={{ animationDuration: '4s', animationDirection: 'reverse' }}
          />
          
          {/* Pulsing center orb */}
          <div className="absolute w-7 h-7 rounded-full bg-linear-to-br from-gray-800/60 to-amber-600/30 animate-pulse shadow-2xl shadow-amber-600/20"
            style={{ animationDuration: '2s' }}
          />
          
          {/* Center logo with glow */}
          <div className="absolute flex items-center justify-center">
            <Image 
              src="/image/2.png" 
              alt="Logo" 
              width={28} 
              height={28}
              className="w-7 h-7 object-contain filter brightness-150 relative z-10"
              priority
              style={{
                filter: 'drop-shadow(0 0 12px rgba(180, 83, 9, 0.7))'
              }}
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <p className="text-md font-bold tracking-widest mb-3">
            <span className="bg-linear-to-r from-amber-600 via-orange-500 to-amber-700 bg-clip-text text-transparent" style={{ 
              animation: 'shimmer 2s infinite',
              backgroundSize: '200% 100%'
            }}>
              Loading
            </span>
          </p>
          
       
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full shadow-md shadow-amber-400/40 animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                animationDelay: '0s',
                animationDuration: '1.2s'
              }}
            />
            <div className="w-2 h-2 rounded-full shadow-md shadow-amber-400/40 animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                animationDelay: '0.2s',
                animationDuration: '1.2s'
              }}
            />
            <div className="w-2 h-2 rounded-full shadow-md shadow-amber-400/40 animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)',
                animationDelay: '0.4s',
                animationDuration: '1.2s'
              }}
            />
          </div>
          
        
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          50% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
