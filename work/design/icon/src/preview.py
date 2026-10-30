from PIL import Image, ImageDraw, ImageFont
O='/home/claude/wsm/work/design/icon/'
opts=['opt1','opt2','opt3']
def mask(size,shape):
    S=size*4; m=Image.new('L',(S,S),0); d=ImageDraw.Draw(m)
    if shape=='circle': d.ellipse((0,0,S-1,S-1),255)
    else: d.rounded_rectangle((0,0,S-1,S-1),radius=int(S*0.22),fill=255)
    return m.resize((size,size),Image.LANCZOS)
def icon(n,size,shape):
    src=Image.open(O+f'{n}_512.png').convert('RGBA').resize((size,size),Image.LANCZOS)
    src.putalpha(mask(size,shape)); return src
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',16); Fs=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
W,H=1200,860
im=Image.new('RGB',(W,H),'#1a1a1a'); d=ImageDraw.Draw(im)
for pi,(name,bgc,tc) in enumerate([('DARK home','#121417','#e6e6e6'),('LIGHT home','#EDEFF2','#222')]):
    x0=pi*600; d.rectangle((x0,0,x0+599,420),fill=bgc)
    d.text((x0+20,14),name+'  (circle / rounded square, 96px & 48px)',fill=tc,font=F)
    for ri,shape in enumerate(['circle','squircle']):
        y=50+ri*180
        for ci,n in enumerate(opts):
            cx=x0+40+ci*185
            i=icon(n,96,shape); im.paste(i,(cx,y),i)
            i=icon(n,48,shape); im.paste(i,(cx+110,y+24),i)
            d.text((cx,y+106),f'{n} {shape}',fill=tc,font=Fs)
d.text((20,440),'Adaptive fg+bg (432): pink = 264px safe circle, grey = 288px visible area',fill='#ddd',font=F)
for ci,n in enumerate(opts):
    bg=Image.open(O+f'{n}_bg_432.png').convert('RGBA'); fg=Image.open(O+f'{n}_fg_432.png').convert('RGBA')
    c=Image.alpha_composite(bg,fg).resize((270,270),Image.LANCZOS); dd=ImageDraw.Draw(c); k=270/432
    dd.ellipse(((216-132)*k,(216-132)*k,(216+132)*k,(216+132)*k),outline='#ff4dd2',width=2)
    dd.rectangle((72*k,72*k,360*k,360*k),outline='#888',width=1)
    im.paste(c,(40+ci*390,475))
    d.text((40+ci*390,752),n,fill='#ddd',font=Fs)
# 48px actual-size strip at 1x and 2x nearest for legibility check
d.text((20,780),'48px actual:',fill='#ddd',font=Fs)
for ci,n in enumerate(opts):
    i=Image.open(O+f'{n}_48.png').convert('RGB'); im.paste(i,(130+ci*70,795))
im.save(O+'preview_all.png'); print('ok')
