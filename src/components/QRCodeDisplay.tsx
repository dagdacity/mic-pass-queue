import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  roomId: string;
}

export function QRCodeDisplay({ roomId }: QRCodeDisplayProps) {
  const joinUrl = `${window.location.origin}/join/${roomId}`;

  return (
    <div className="glass-card p-6 rounded-2xl animate-scale-in">
      <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
        Scan to Join Queue
      </h3>
      <div className="bg-white p-4 rounded-xl">
        <QRCodeSVG
          value={joinUrl}
          size={180}
          level="H"
          includeMargin={false}
          bgColor="white"
          fgColor="#0a0f14"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center break-all max-w-[200px]">
        {joinUrl}
      </p>
    </div>
  );
}
