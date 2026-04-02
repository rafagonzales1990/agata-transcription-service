export function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <div style={{
      width: size,
      height: size,
      background: '#10B981',
      borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
      boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
      flexShrink: 0,
    }} />
  );
}
