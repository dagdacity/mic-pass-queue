import { Mic } from 'lucide-react';

interface MicrophoneVisualProps {
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MicrophoneVisual({ isActive = false, size = 'lg' }: MicrophoneVisualProps) {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
  };

  const iconSizes = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      {isActive && (
        <>
          <div className={`absolute ${sizeClasses[size]} rounded-full bg-primary/10 pulse-ring`} />
          <div className={`absolute ${size === 'lg' ? 'w-72 h-72' : size === 'md' ? 'w-52 h-52' : 'w-32 h-32'} rounded-full bg-primary/5 pulse-ring animate-delay-200`} />
        </>
      )}
      
      {/* Main microphone circle */}
      <div className={`relative ${sizeClasses[size]} rounded-full glass-card flex items-center justify-center ${isActive ? 'glow-primary' : ''}`}>
        {/* Inner gradient circle */}
        <div className={`absolute inset-4 rounded-full ${isActive ? 'bg-gradient-to-br from-primary/20 to-primary/5' : 'bg-gradient-to-br from-secondary to-muted'}`} />
        
        {/* Audio waves when active */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 bg-primary rounded-full audio-wave`}
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
        
        {/* Microphone icon */}
        <Mic
          size={iconSizes[size]}
          className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
        />
      </div>
    </div>
  );
}
