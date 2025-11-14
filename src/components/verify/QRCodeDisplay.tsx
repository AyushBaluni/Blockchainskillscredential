import { QRCodeCanvas } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  label?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, label }) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 rounded-lg bg-muted/50 border">
        <QRCodeCanvas value={value} size={160} includeMargin={true} level="M" />
      </div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
};

export default QRCodeDisplay;
