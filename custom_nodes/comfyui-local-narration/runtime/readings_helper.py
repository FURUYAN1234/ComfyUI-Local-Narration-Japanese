import sys,json,re
from pykakasi import kakasi
k=kakasi()
letters=dict(zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ',['えー','びー','しー','でぃー','いー','えふ','じー','えいち','あい','じぇー','けー','える','えむ','えぬ','おー','ぴー','きゅー','あーる','えす','てぃー','ゆー','ぶい','だぶりゅー','えっくす','わい','ぜっと']))
def convert_plain(text):
 text=re.sub(r'(?<![A-Za-z])[A-Z]{2,}(?![A-Za-z])',lambda m:''.join(letters[c] for c in m.group()),text)
 return ''.join(p['hira'] for p in k.convert(text))
def convert_with_dictionary(text,dictionary):
 if not dictionary:return convert_plain(text)
 terms=sorted(dictionary,key=lambda term:(-len(term),term))
 pattern=re.compile('|'.join(re.escape(term) for term in terms))
 parts=[];start=0
 for match in pattern.finditer(text):
  parts.append(convert_plain(text[start:match.start()]))
  parts.append(dictionary[match.group()])
  start=match.end()
 parts.append(convert_plain(text[start:]))
 return ''.join(parts)
if __name__=='__main__':
 request=json.load(sys.stdin)
 rows=request if isinstance(request,list) else request['rows']
 dictionary={} if isinstance(request,list) else request.get('dictionary',{})
 print(json.dumps([convert_with_dictionary(row,dictionary) for row in rows],ensure_ascii=False))
