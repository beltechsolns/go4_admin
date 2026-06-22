import brandLogo from '../../assets/brand.png'

export default function BrandLogo() {
  return (
    <div className="border-b border-[#F4F7FE] px-6 py-5">
      <img 
        src={brandLogo} 
        alt="G4 Delivery" 
        className="h-18 w-full object-contain"
      />
    </div>
  )
}
