"use client";

import Image from 'next/image';
import { useState } from 'react';

export default function ComparePage() {
  const [ogImageError, setOgImageError] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          مقایسه تصاویر
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Example Image */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 text-center">
              تصویر نمونه
            </h2>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <Image
                src="/example.png"
                alt="Example Image"
                width={600}
                height={400}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>
          </div>

          {/* Generated OG Image */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 text-center">
              تصویر OG تولید شده
            </h2>
            <div className="bg-white rounded-lg shadow-lg p-4">
              {!ogImageError ? (
                <Image
                  src="/api/image-og"
                  alt="Generated OG Image"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-lg"
                  priority
                  onError={() => setOgImageError(true)}
                />
              ) : (
                <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">🖼️</div>
                    <p className="text-gray-600">تصویر OG در دسترس نیست</p>
                    <button 
                      onClick={() => setOgImageError(false)}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      تلاش مجدد
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Info */}
        <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            اطلاعات مقایسه
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">تصویر نمونه:</h4>
              <ul className="space-y-1">
                <li>• ابعاد: 600 × 400 پیکسل</li>
                <li>• منبع: فایل example.png</li>
                <li>• نوع: تصویر استاتیک</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">تصویر OG:</h4>
              <ul className="space-y-1">
                <li>• ابعاد: 600 × 400 پیکسل</li>
                <li>• منبع: API endpoint</li>
                <li>• نوع: تصویر داینامیک</li>
                <li>• بکگراند: گرادیان بنفش-آبی</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Direct Link */}
        <div className="mt-8 text-center">
          <a 
            href="/api/image-og" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            مشاهده مستقیم تصویر OG
          </a>
        </div>
      </div>
    </div>
  );
} 