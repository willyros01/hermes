// FIDUNIO launcher: generate native density assets from the unchanged FIDUNIO PNG.
import java.awt.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.File;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
public class AndroidIcons {
  static BufferedImage render(BufferedImage src,int size,boolean foreground,boolean round) {
    BufferedImage dest=new BufferedImage(size,size,BufferedImage.TYPE_INT_ARGB);
    Graphics2D g=dest.createGraphics();
    g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
    if(round)g.setClip(new java.awt.geom.Ellipse2D.Double(0,0,size,size));
    if(!foreground){g.setColor(Color.WHITE);g.fillRect(0,0,size,size);}
    int margin=foreground?size/5:0;
    g.drawImage(src,margin,margin,size-2*margin,size-2*margin,null);
    g.dispose();
    return dest;
  }
  public static void main(String[] args)throws Exception {
    if(args.length!=2)throw new IllegalArgumentException("Usage: java build/AndroidIcons.java source.png android/app/src/main/res");
    BufferedImage src=ImageIO.read(new File(args[0]));
    if(src==null||src.getWidth()<192||src.getHeight()<192)throw new IllegalArgumentException("Invalid FIDUNIO launcher source");
    File res=new File(args[1]);
    String[] suffix={"mdpi","hdpi","xhdpi","xxhdpi","xxxhdpi"};
    int[] sizes={48,72,96,144,192};
    for(int i=0;i<sizes.length;i++){
      File dir=new File(res,"mipmap-"+suffix[i]);dir.mkdirs();
      ImageIO.write(render(src,sizes[i],false,false),"png",new File(dir,"ic_launcher.png"));
      ImageIO.write(render(src,sizes[i],false,true),"png",new File(dir,"ic_launcher_round.png"));
      ImageIO.write(render(src,(int)(sizes[i]*2.25),true,false),"png",new File(dir,"ic_launcher_foreground.png"));
    }
    File adaptive=new File(res,"mipmap-anydpi-v26");adaptive.mkdirs();
    String xml="<?xml version=\"1.0\" encoding=\"utf-8\"?><adaptive-icon xmlns:android=\"http://schemas.android.com/apk/res/android\"><background android:drawable=\"@android:color/white\"/><foreground android:drawable=\"@mipmap/ic_launcher_foreground\"/></adaptive-icon>";
    Files.writeString(new File(adaptive,"ic_launcher.xml").toPath(),xml,StandardCharsets.UTF_8);
    Files.writeString(new File(adaptive,"ic_launcher_round.xml").toPath(),xml,StandardCharsets.UTF_8);
    System.out.println("PASS: FIDUNIO PNG-based native launcher icons");
  }
}
