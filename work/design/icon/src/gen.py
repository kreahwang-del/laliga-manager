import math, os
OUT='/home/claude/wsm/work/design/icon'
BG='#0A0B0D'; Y='#F5D547'; G='#46D6A3'; R='#E5484D'; B='#5AB8F5'; INK='#0A0B0D'
K=math.tan(math.radians(12))

def slant(pts,H,sx,sy,ox,oy):
    # upright letter coords (0..W,0..H) -> scale, italic (top leans right), translate
    return [(ox+(x+K*(H-y))*sx, oy+y*sy) for x,y in pts]
def d(pts): return 'M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)+' Z'
def para(x0,y0,x1,y1,s):  # parallelogram leaning right, slant s px
    return d([(x0+s,y0),(x1+s,y0),(x1,y1),(x0,y1)])

W_=[(0,0),(42,0),(52,106),(74,24),(106,24),(128,106),(138,0),(180,0),(156,170),(112,170),(90,90),(68,170),(24,170)]
F_=[(0,0),(104,0),(104,36),(42,36),(42,68),(92,68),(92,102),(42,102),(42,170),(0,170)]
M_=[(0,170),(16,0),(58,0),(80,78),(102,0),(144,0),(160,170),(120,170),(112,78),(94,140),(66,140),(48,78),(40,170)]
def svg(body,size=432,defs=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">{("<defs>"+defs+"</defs>") if defs else ""}{body}</svg>\n'

def stripes(alpha=.05, step=18, extra=''):
    # 135deg thin diagonal lines across 432 canvas
    lines=''.join(f'<path d="M{x},-10 L{x-452},442" />' for x in range(0,900,step))
    return f'<rect width="432" height="432" fill="{BG}"/><g stroke="#fff" stroke-opacity="{alpha}" stroke-width="2">{lines}</g>{extra}'

# ---------- Option 1: scorebug ----------
def opt1():
    bg=stripes(extra=f'<path d="{para(-40,0,150,432,0)}" fill="#fff" fill-opacity=".025"/>')
    s=72/170; ws=[(W_,180),(F_,104),(M_,160)]; gap=22
    tot=sum(w for _,w in ws)*s+gap*s*2+K*170*s
    x=216-tot/2-2; y0=216-38; paths=''
    for p,w in ws:
        paths+=f'<path d="{d(slant(p,170,s,s,x,y0))}" fill="{INK}"/>'; x+=(w+gap)*s
    fg=(f'<path d="{para(88,164,326,268,18)}" fill="{Y}"/>'   # main yellow band
        f'<path d="{para(156,128,252,152,6)}" fill="#F2F3F5"/>'  # white clock tag
        f'<circle cx="136" cy="140" r="11" fill="{R}"/>'         # LIVE dot
        f'<path d="{para(110,282,236,294,4)}" fill="{G}"/>'       # prob bar
        f'<path d="{para(242,282,300,294,4)}" fill="#3A3F47"/>'
        +paths)
    return bg,fg
# ---------- Option 2: symbol ----------
def opt2():
    bg=stripes(extra=f'<path d="{para(240,0,470,432,0)}" fill="#fff" fill-opacity=".025"/>')
    cx,cy,r=232,224,74
    def pg(px,py,rr,rot=-90): return [(px+rr*math.cos(math.radians(rot+72*i)), py+rr*math.sin(math.radians(rot+72*i))) for i in range(5)]
    pent=pg(cx,cy-8,26)
    rim=''.join(f'<path d="{d(pg(cx+66*math.cos(math.radians(-90+72*i+36)), cy-8+66*math.sin(math.radians(-90+72*i+36)),19,-90+72*i+36+180))}" fill="{INK}"/>' for i in range(5))
    # diagonal cut through the ball (B+ wipe), upper half nudged right
    defs=('<mask id="cut"><rect width="432" height="432" fill="#fff"/>'
          f'<path d="{d([(cx-r-20,cy+60),(cx+r+20,cy+6),(cx+r+20,cy+18),(cx-r-20,cy+72)])}" fill="#000"/></mask>'
          f'<clipPath id="bc"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>')
    fg=(f'<path d="{para(96,178,150,194,6)}" fill="{G}"/>'
        f'<path d="{para(84,216,142,232,6)}" fill="{B}"/>'
        f'<path d="{para(108,254,140,270,6)}" fill="#F2F3F5" fill-opacity=".85"/>'
        f'<g><circle cx="{cx}" cy="{cy}" r="{r}" fill="{Y}"/><path d="{d(pent)}" fill="{INK}"/><g clip-path="url(#bc)">{rim}</g></g>'
        f'<circle cx="292" cy="150" r="13" fill="{R}"/>'
        f'<circle cx="292" cy="150" r="20" fill="none" stroke="{R}" stroke-opacity=".45" stroke-width="4"/>')
    return bg,fg,defs
# ---------- Option 3: letter ----------
def opt3():
    bg=stripes(extra=f'<path d="M0,432 L0,250 L432,-30 L432,432 Z" fill="#fff" fill-opacity=".03"/>')
    s=0.86; H=170; w=(180+K*H)*s; x0=216-w/2; y0=216-H*s/2-12
    Wp=slant(W_,H,s,s,x0,y0)
    # diagonal cut: dark gap from lower-left to upper-right
    defs=('<mask id="cut"><rect width="432" height="432" fill="#fff"/>'
          '<path d="M60,262 L380,178 L380,192 L60,276 Z" fill="#000"/></mask>')
    fg=(f'<path d="{d(Wp)}" fill="{Y}" mask="url(#cut)"/>'
        f'<path d="{para(222,296,296,307,4)}" fill="{G}"/>'
        f'<path d="{para(138,296,214,307,4)}" fill="#F2F3F5"/>')
    return bg,fg,defs

def write(name,s):
    open(os.path.join(OUT,name),'w').write(s)
for n,res in (('opt1',opt1()),('opt2',opt2()),('opt3',opt3())):
    bg,fg=res[0],res[1]; defs=res[2] if len(res)>2 else ''
    write(f'{n}_bg.svg',svg(bg)); write(f'{n}_fg.svg',svg(fg,defs=defs))
    # legacy full-bleed: centre 288 of adaptive canvas (= visible 72dp)
    full=svg(f'<g>{bg}</g><g>{fg}</g>',defs=defs).replace('viewBox="0 0 432 432"','viewBox="72 72 288 288"').replace('width="432" height="432" viewBox','width="512" height="512" viewBox',1)
    write(f'{n}_icon.svg',full)
print('ok')
