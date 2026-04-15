import logoIcon from '@/assets/logo-icon.png';

export function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <img
      src={logoIcon}
      alt="Ágata"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
    />
  );
}
