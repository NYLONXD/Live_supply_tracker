// client/src/components/common/Logo.jsx
import { Link } from 'react-router-dom';
import logoImg from '../../../assets/TrackEdge1.png';

export default function Logo({
  size = 'lg',
  showText = true,
  linkTo,
  className = '',
  dark = false,
}) {
  const sizeMap = {
    sm: { box: 'w-7 h-7', text: 'text-xs' },
    md: { box: 'w-9 h-9', text: 'text-base' },
    lg: { box: 'w-12 h-12', text: 'text-xl' },
  };
  const { box, text } = sizeMap[size] || sizeMap.md;

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className={`${box} flex items-center justify-center rounded-sm overflow-hidden bg-black shrink-0`}>
        <img
          src={logoImg}
          alt="TrackEdge logo"
          className="w-full h-full object-contain p-0.5"
          draggable={false}
        />
      </span>
      {showText && (
        <span
          className={`font-bold tracking-tight ${text} ${
            dark ? 'text-white' : 'text-black'
          }`}
        >
          SUPPLY TRACKER
        </span>
      )}
    </span>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex items-center">
        {inner}
      </Link>
    );
  }

  return inner;
}