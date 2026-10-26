import Image from "next/image";

export function BrandMark() {
  return <span className="brand-icon"><Image src="/logo-mark.png" width={30} height={30} alt="" unoptimized /></span>;
}
