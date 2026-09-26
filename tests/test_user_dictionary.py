import ast
import re
from pathlib import Path

root=Path(__file__).resolve().parents[1]/'custom_nodes/comfyui-local-narration'
tree=ast.parse((root/'reading_review.py').read_text(encoding='utf-8'))
names={'valid_dictionary_entry','initial_readings'}
keep=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in names]
scope={'re':re,'convert_rows':lambda rows,dictionary:['変換:'+str(dictionary) for _ in rows]}
exec(compile(ast.Module(body=keep,type_ignores=[]),'dictionary-functions','exec'),scope)
valid=scope['valid_dictionary_entry']
initial=scope['initial_readings']
assert valid('星雲','せいうん')
assert valid('AI','えーあい')
for word,reading in [('','せいうん'),(' 星雲','せいうん'),('星雲','セイウン'),('星雲','星雲'),('星雲','')]:
 assert not valid(word,reading),(word,reading)
assert initial(['星雲が光る。','空が光る。'],{'星雲が光る。':'旧記憶','空が光る。':'保存済み'}, {'星雲':'せいうん'})==["変換:{'星雲': 'せいうん'}",'保存済み']
assert initial(['空が光る。'],{'空が光る。':'保存済み'}, {})==['保存済み']
helper_tree=ast.parse((root/'runtime/readings_helper.py').read_text(encoding='utf-8'))
helper=[n for n in helper_tree.body if isinstance(n,ast.FunctionDef) and n.name=='convert_with_dictionary']
helper_scope={'re':re,'convert_plain':lambda text:text}
exec(compile(ast.Module(body=helper,type_ignores=[]),'dictionary-conversion','exec'),helper_scope)
convert=helper_scope['convert_with_dictionary']
assert convert('星雲と星を見る。',{'星雲':'せいうん','星':'ほし'})=='せいうんとほしを見る。'
assert convert('星雲と星を見る。',{})=='星雲と星を見る。'
assert convert('星雲と星を見る。',{'星雲':'せいうん'})=='せいうんと星を見る。'
print('PASS dictionary validation, longest match and priority over stale full-sentence memory')
