import json,os,socket,struct,subprocess,urllib.request,shutil
from pathlib import Path
def endpoint():
 if os.environ.get('LOCAL_NARRATION_LM_ENDPOINT'):return os.environ['LOCAL_NARRATION_LM_ENDPOINT'].rstrip('/')
 for line in Path('/proc/net/route').read_text().splitlines()[1:]:
  fields=line.split()
  if fields[1]=='00000000': return 'http://'+socket.inet_ntoa(struct.pack('<L',int(fields[2],16)))+':1234'
 raise RuntimeError('WSLのWindows側アドレスを取得できません。')
def cli_path():
 configured=os.environ.get('LOCAL_NARRATION_LMS_CLI')
 if configured:
  if not Path(configured).is_file():raise RuntimeError('LOCAL_NARRATION_LMS_CLIの実行ファイルがありません。')
  return configured
 ps=shutil.which('powershell.exe')
 if ps:
  r=subprocess.run([ps,'-NoProfile','-Command',"[Environment]::GetFolderPath('LocalApplicationData')"],capture_output=True,timeout=15,check=True)
  windows=r.stdout.decode(errors='replace').strip()
  base=subprocess.check_output(['wslpath','-u',windows],text=True,timeout=5).strip()
  candidate=Path(base)/'Programs/LM Studio/resources/app/.webpack/lms.exe'
  if candidate.is_file():return str(candidate)
 found=shutil.which('lms') or shutil.which('lms.exe')
 if found:return found
 raise RuntimeError('LM Studio CLIがありません。WindowsにLM Studioを導入し、READMEのCLI確認を実行してください。')
def cli(*args,timeout=180):
 exe=cli_path()
 r=subprocess.run([exe,*args],stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout)
 if r.returncode: raise RuntimeError('LM Studio: '+r.stderr.decode(errors='replace')[-700:])
 return r.stdout.decode(errors='replace')
def api(base,path,data=None,timeout=180):
 req=urllib.request.Request(base+path,data=None if data is None else json.dumps(data,ensure_ascii=False).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=timeout) as response:return json.load(response)
