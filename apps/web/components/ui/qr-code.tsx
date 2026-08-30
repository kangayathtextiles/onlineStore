"use client";

import * as React from "react";
import { QRCodeSVG as RealQRCodeSVG } from "qrcode.react";

interface QRCodeSVGProps extends React.SVGProps<SVGSVGElement> {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export function QRCodeSVG({
  value,
  size = 128,
  fgColor = "#000000",
  bgColor = "#ffffff",
  className,
  ...props
}: QRCodeSVGProps) {
  return (
    <RealQRCodeSVG
      value={value || "KGY-QR-EMPTY"}
      size={size}
      fgColor={fgColor}
      bgColor={bgColor}
      level="M" // Medium error correction (15%) for optimal scan reliability vs data density
      className={className}
      includeMargin={false}
      {...props}
    />
  );
}
