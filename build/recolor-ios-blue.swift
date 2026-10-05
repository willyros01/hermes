import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
    fputs("usage: recolor-ios-blue.swift <source.png> <target.png>\n", stderr)
    exit(2)
}
let sourceURL=URL(fileURLWithPath:CommandLine.arguments[1])
let targetURL=URL(fileURLWithPath:CommandLine.arguments[2])
guard let src=CGImageSourceCreateWithURL(sourceURL as CFURL,nil),
      let image=CGImageSourceCreateImageAtIndex(src,0,nil) else {
    fatalError("Could not decode PNG")
}
let width=image.width,height=image.height,bytesPerPixel=4,bytesPerRow=width*bytesPerPixel
var bytes=[UInt8](repeating:0,count:height*bytesPerRow)
let space=CGColorSpaceCreateDeviceRGB()
guard let ctx=CGContext(data:&bytes,width:width,height:height,bitsPerComponent:8,bytesPerRow:bytesPerRow,space:space,bitmapInfo:CGImageAlphaInfo.noneSkipLast.rawValue|CGBitmapInfo.byteOrder32Big.rawValue) else {
    fatalError("Could not create RGB context")
}
ctx.interpolationQuality = .high
ctx.draw(image,in:CGRect(x:0,y:0,width:width,height:height))

func rgbToHSV(_ r:Double,_ g:Double,_ b:Double)->(Double,Double,Double){
    let mx=max(r,max(g,b)),mn=min(r,min(g,b)),d=mx-mn
    var h=0.0
    if d != 0 {
        if mx == r { h=((g-b)/d).truncatingRemainder(dividingBy:6) }
        else if mx == g { h=(b-r)/d+2 }
        else { h=(r-g)/d+4 }
        h*=60;if h<0{h+=360}
    }
    return(h,mx==0 ? 0:d/mx,mx)
}
func hsvToRGB(_ h:Double,_ s:Double,_ v:Double)->(UInt8,UInt8,UInt8){
    let c=v*s,x=c*(1-abs((h/60).truncatingRemainder(dividingBy:2)-1)),m=v-c
    let p:(Double,Double,Double)
    switch h {
    case 0..<60:p=(c,x,0);case 60..<120:p=(x,c,0);case 120..<180:p=(0,c,x)
    case 180..<240:p=(0,x,c);case 240..<300:p=(x,0,c);default:p=(c,0,x)
    }
    return(UInt8(max(0,min(255,(p.0+m)*255)).rounded()),
           UInt8(max(0,min(255,(p.1+m)*255)).rounded()),
           UInt8(max(0,min(255,(p.2+m)*255)).rounded()))
}
var changed=0
for y in 0..<height {
    for x in 0..<width {
        let i=y*bytesPerRow+x*4
        let r=Double(bytes[i])/255,g=Double(bytes[i+1])/255,b=Double(bytes[i+2])/255
        let (h,s,v)=rgbToHSV(r,g,b)
        // Recolor only saturated warm gold/yellow pixels. Grayscale Hermes art is untouched.
        if h >= 24 && h <= 62 && s >= 0.32 && v >= 0.35 {
            let (nr,ng,nb)=hsvToRGB(210,max(0.72,s),max(0.62,v))
            bytes[i]=nr;bytes[i+1]=ng;bytes[i+2]=nb;changed+=1
        }
    }
}
guard changed > max(500,width*height/1000) else {
    fatalError("Expected gold ring pixels were not found; refusing to ship an unverified iOS icon transform")
}
guard let out=CGContext(data:&bytes,width:width,height:height,bitsPerComponent:8,bytesPerRow:bytesPerRow,space:space,bitmapInfo:CGImageAlphaInfo.noneSkipLast.rawValue|CGBitmapInfo.byteOrder32Big.rawValue)?.makeImage() else {
    fatalError("Could not create transformed image")
}
guard let dest=CGImageDestinationCreateWithURL(targetURL as CFURL,UTType.png.identifier as CFString,1,nil) else {
    fatalError("Could not create PNG destination")
}
CGImageDestinationAddImage(dest,out,nil)
guard CGImageDestinationFinalize(dest) else { fatalError("Could not write PNG") }
print("PASS: recolored \(changed) warm ring pixels to iOS blue in \(targetURL.lastPathComponent)")
