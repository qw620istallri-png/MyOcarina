import unicodedata
import json
d={x['id']+'|'+x['song']:x for x in json.load(open(__import__('sys').argv[1] if len(__import__('sys').argv)>1 else 'songs.json'))}
def get(song):
    for k,v in d.items():
        if k.split('|')[1]==song: return v
    raise KeyError(song)
SEL=[ # (song title in ocwalk, cat, titre FR, sous, tempo, diff)
 ("Zelda's Lullaby","zelda","Berceuse de Zelda","Version longue",90,1),
 ("Lost Woods","zelda","Chant de Saria","Bois Perdus – version complète",140,2),
 ("Song of Storms (Extended)","zelda","Chant des Tempêtes","Version complète",150,3),
 ("Song of Time","zelda","Chant du Temps","",90,1),
 ("Epona's Song","zelda","Chant d'Epona","Ranch Lon Lon",110,1),
 ("Kokiri Forest","zelda","Forêt Kokiri","Le village de départ",130,2),
 ("Great Fairy's Fountain","zelda","Fontaine des Grandes Fées","",140,2),
 ("Deku Tree","zelda","L'Arbre Mojo","",110,1),
 ("Inside a House","zelda","Dans une maison","",130,2),
 ("Market Theme","zelda","Le marché d'Hyrule","",140,3),
 ("Gerudo Valley","zelda","Vallée Gerudo","",150,3),
 ("Kaepora Gaebora","zelda","Kaepora Gaebora","Le hibou",130,3),
 ("Opening Title","zelda","Écran titre","Ocarina of Time",110,2),
 ("Minuet of Forest","zelda","Menuet des Bois","Chant de téléportation",110,1),
 ("Serenade Of Water","zelda","Sérénade de l'Eau","Chant de téléportation",100,1),
 ("Requiem of Spirit","zelda","Requiem de l'Esprit","Chant de téléportation",90,1),
 ("Song of Healing","zelda2","Chant de l'Apaisement","Majora's Mask",100,1),
 ("Ballad of the Goddess","zelda2","Ballade de la Déesse","Skyward Sword",100,1),
 ("Overworld","zelda2","Thème principal","The Legend of Zelda",140,2),
 ("Mipha's theme","zelda2","Thème de Mipha","Breath of the Wild",100,1),
 ("Stables","zelda2","Les relais","Breath of the Wild",120,2),
 ("Midna's Lament","zelda2","Lamentation de Midona","Twilight Princess",100,2),
 ("The Great Sea","zelda2","La Grande Mer","The Wind Waker",130,2),
 ("Concerning Hobbits","lotr","Concerning Hobbits","Le thème de la Comté",110,3),
 ("Misty Mountains Cold","lotr","Misty Mountains","Le chant des nains (Le Hobbit)",90,1),
 ("Evenstar","lotr","Evenstar","Le thème d'Arwen",90,2),
 ("Into the West","lotr","Into the West","",100,3),
 ("The Edge of Night","lotr","The Edge of Night","Le chant de Pippin",80,2),
 ("Overture","stardew","Ouverture","Stardew Valley – le thème principal",120,2),
]
NAMES=["C","C#","D","Eb","E","F","F#","G","G#","A","Bb","B"]
def tok(m): return NAMES[m%12]+str(m//12-1)
def parse(tabs):
    notes=[]  # [midi,dur,phrase]
    ph=0
    for sec in tabs:
        for line in sec.replace('﻿','').split('\n'):
            if not line.strip(): continue
            for c in line:
                if 'A'<=c<='U': notes.append([69+ord(c)-65,1,ph])
                elif c=='-' and notes: notes[-1][1]+=1
            ph+=1
    return notes
LO,HI=72,89
out=[]
for song,cat,titre,sous,tempo,diff in SEL:
    x=get(song); n=parse(x['tabs'])
    best=None
    for s in range(-12,13):
        ms=[m+s for m,_,_ in n]
        oor=sum(1 for m in ms if m<LO or m>HI)
        acc=sum(1 for m in ms if m%12 in (1,3,6,8,10))
        sc=oor*100+acc+abs(s)*0.05
        if best is None or sc<best[0]: best=(sc,s,oor,acc)
    _,s,oor,acc=best
    folded=0; toks=[]; last=None
    for m,dur,ph in n:
        m+=s
        while m<LO: m+=12; folded+=1
        while m>HI: m-=12; folded+=1
        if last is not None and ph!=last: toks.append('|')
        last=ph
        toks.append(tok(m)+('' if dur==1 else ':%g'%dur))
    print(f"{titre:30} shift {s:+} acc {acc} folded {folded} notes {len(n)}")
    out.append(dict(id='ow-'+unicodedata.normalize('NFKD',titre.lower()).encode('ascii','ignore').decode().replace(' ','-').replace("'",''),cat=cat,titre=titre,sous=sous,tempo=tempo,diff=min(3,diff+(1 if acc>12 else 0)),notes=' '.join(toks),src='ocwalk'))
ids=[o['id'] for o in out]; assert len(ids)==len(set(ids)),ids
js="// Mélodies transcrites d'après les tablatures d'OcWalk (https://www.ocwalk.com),\n// converties automatiquement pour l'ocarina 11 trous (Do5 → Fa6).\n// Généré par tools/convert-ocwalk.py — le rythme est approximatif.\nwindow.SONGS_OCWALK = "+json.dumps(out,ensure_ascii=False,indent=1)+";\n"
open('/home/user/ocarina/js/songs-ocwalk.js','w').write(js)
