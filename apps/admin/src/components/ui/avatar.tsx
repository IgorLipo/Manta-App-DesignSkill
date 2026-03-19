import * as React from 'react';
import { cn } from './cn';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200',
        className
      )}
      {...props}
    >
      {src ? (
        <img className="aspect-square h-full w-full" src={src} alt={alt} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary text-white text-sm font-medium">
          {fallback}
        </div>
      )}
    </div>
  )
);
Avatar.displayName = 'Avatar';

export { Avatar };
