export function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      background: 'linear-gradient(135deg, #10B981, #059669)',
      borderRadius: '35% 65% 65% 35% / 35% 35% 65% 65%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
      flexShrink: 0,
    }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M12 4L20 18H4L12 4Z" fill="white" opacity="0.9"
              stroke="white" strokeWidth="1" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
