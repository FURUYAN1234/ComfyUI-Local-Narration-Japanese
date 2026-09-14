import sys,json,re
from pykakasi import kakasi
k=kakasi()
rows=json.load(sys.stdin)
letters=dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ',['えー','びー','しー','でぃー','いー','えふ','じー','えいち','あい','じぇー','けー','える','えむ','えぬ','おー','ぴー','きゅー','あーる','えす','てぃー','ゆー','ぶい','だぶりゅー','えっくす','わい','ぜっと']))
result=[]
for row in rows:
 row=re.sub(r'(?<![A-Za-z])[A-Z]{2,}(?![A-Za-z])',lambda m:''.join(letters[c] for c in m.group()),row)
 result.append(''.join(p['hira'] for p in k.convert(row)))
print(json.dumps(result,ensure_ascii=False))
