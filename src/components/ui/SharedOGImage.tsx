import React from 'react';

interface SharedOGImageProps {
  title: string;
  label?: string;
  logoBase64?: string;
  variant?: 'brand' | 'post';
}

export default function SharedOGImage({
  title,
  label = '보상스쿨 공식 블로그',
  logoBase64,
  variant = 'post',
}: SharedOGImageProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a73e8',
        backgroundImage: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
        padding: '80px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          width: '100%',
          height: '100%',
          borderRadius: '40px',
          padding: '60px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        {variant === 'brand' ? (
          <>
            {logoBase64 ? (
              <img
                src={logoBase64}
                alt="보상스쿨 로고"
                style={{
                  height: '160px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#1a73e8' }}>
                {label}
              </div>
            )}
          </>
        ) : (
          <>
            {logoBase64 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '30px',
                }}
              >
                <img
                  src={logoBase64}
                  alt="보상스쿨 로고"
                  style={{
                    height: '80px',
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1a73e8',
                marginBottom: '40px',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: title.length > 30 ? '54px' : '64px',
                fontWeight: '900',
                color: '#111827',
                textAlign: 'center',
                lineHeight: 1.3,
                wordBreak: 'keep-all',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                marginTop: '40px',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  color: '#4b5563',
                  fontWeight: '600',
                }}
              >
                claim-works.com
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
