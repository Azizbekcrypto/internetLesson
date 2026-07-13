#!/usr/bin/env python3
"""Pipeline HQ — haqiqiy tugash belgisi (fon-agentlar uchun).

Fon-agent tugashi hookka kelmaydi (task-notification tool-chaqiruv emas),
shu sabab asosiy agent (orkestrator) har notification kelganda shuni chaqiradi:

    python3 .claude/hooks/office-mark.py done  <rol> <Dars.jsx> [davomiylik_s]
    python3 .claude/hooks/office-mark.py fail  <rol> <Dars.jsx>
    python3 .claude/hooks/office-mark.py start <rol> <Dars.jsx>   # holat-korreksiya
    python3 .claude/hooks/office-mark.py skip  <rol> <Dars.jsx>   # bosqich kerak emas (K)

<rol> — indeks (0-8) yoki nom (masalan: darslik-verifikator / verifikator).
pipeline-live.js formati pipeline-office-sync.py bilan bir xil (v3).
"""
import fcntl
import json
import os
import re
import sys
import time

ROLES = ['darslik-auditor', 'darslik-ijodkor', 'darslik-quruvchi', 'darslik-dizayn',
         'darslik-animatsiya', 'darslik-jonli', 'darslik-metodist',
         'darslik-tekshiruvchi', 'darslik-verifikator']

if len(sys.argv) < 4 or sys.argv[1] not in ('done', 'fail', 'start', 'skip'):
    print(__doc__)
    sys.exit(1)

ev, role_arg, lesson = sys.argv[1], sys.argv[2], sys.argv[3]
dur = int(sys.argv[4]) if len(sys.argv) > 4 else None

if role_arg.isdigit():
    ri = int(role_arg)
else:
    matches = [i for i, r in enumerate(ROLES) if role_arg in r]
    if len(matches) != 1:
        print(f"rol topilmadi/noaniq: {role_arg}")
        sys.exit(1)
    ri = matches[0]
if not 0 <= ri < 9:
    print(f"rol indeksi 0-8 bo'lsin: {ri}")
    sys.exit(1)

proj = os.environ.get('CLAUDE_PROJECT_DIR') or os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = os.path.join(proj, 'pipeline-live.js')

_lock = open(path + '.lock', 'w')
fcntl.flock(_lock, fcntl.LOCK_EX)

state = {}
try:
    raw = open(path).read()
    m = re.search(r'window\.PIPELINE_LIVE\s*=\s*(\{.*\})\s*;?\s*$', raw, re.S)
    if m:
        old = json.loads(m.group(1))
        if old.get('v') in (2, 3):
            state = old
except Exception:
    pass

now = int(time.time())
today = time.strftime('%Y-%m-%d')
state['v'] = 3
state.setdefault('lessons', {})
run = state.get('running')
if not isinstance(run, dict) or 'role' in (run or {}):
    run = {}
state['running'] = {k: v for k, v in run.items()
                    if isinstance(v, dict) and now - v.get('since', 0) < 7200}
state.setdefault('gate', None)
state.setdefault('lastDone', None)
state.setdefault('activeLesson', None)
if not isinstance(state.get('today'), dict) or state['today'].get('date') != today:
    state['today'] = {'date': today, 'done': 0}

def set_stage(role_idx, code):
    rec = state['lessons'].setdefault(lesson, {'s': 'I' * 9})
    s = (rec.get('s') or 'I' * 9).ljust(9, 'I')[:9]
    rec['s'] = s[:role_idx] + code + s[role_idx + 1:]
    rec['touched'] = now
    state['activeLesson'] = lesson

def hist(e):
    h = state.setdefault('history', [])
    h.append({'t': now, 'ev': e, 'role': ri, 'lesson': lesson})
    del h[:-80]

sub = ROLES[ri]
key = f"{lesson}:{ri}"
if ev == 'start':
    state['running'][key] = {'role': ri, 'agent': sub, 'lesson': lesson, 'since': now}
    set_stage(ri, 'A')
    hist('start')
elif ev == 'fail':
    state['running'].pop(key, None)
    set_stage(ri, 'E')
    state['lastError'] = {'role': ri, 'agent': sub, 'lesson': lesson, 'at': now}
    hist('fail')
elif ev == 'skip':
    state['running'].pop(key, None)
    set_stage(ri, 'K')
    hist('skip')
else:  # done
    was = state['running'].pop(key, None)
    state['lastDone'] = {'role': ri, 'agent': sub, 'lesson': lesson, 'at': now}
    set_stage(ri, 'D')
    d = dur if dur is not None else (now - was['since'] if was and was.get('since') else None)
    if d is not None:
        state['lessons'][lesson].setdefault('t', {})[str(ri)] = d
    state['today']['done'] += 1
    hist('done')

state['epoch'] = now
state['updated'] = time.strftime('%H:%M')

with open(path, 'w') as f:
    f.write('window.PIPELINE_LIVE=' + json.dumps(state, ensure_ascii=False) + ';\n')

# Bulut-sinxron (bo'lsa) — oflaynda jim o'tadi
try:
    import urllib.request
    with open(os.path.join(proj, '.claude', 'supabase', 'office-cloud.json')) as f:
        cfg = json.load(f)
    body = json.dumps({'p_secret': cfg['secret'], 'p_state': state}).encode()
    req = urllib.request.Request(
        cfg['url'] + '/rest/v1/rpc/office_sync', data=body, method='POST',
        headers={'apikey': cfg['anon_key'],
                 'Authorization': 'Bearer ' + cfg['anon_key'],
                 'Content-Type': 'application/json'})
    urllib.request.urlopen(req, timeout=2).read()
except Exception:
    pass
print(f"OK {ev} {sub} {lesson}" + (f" ({dur}s)" if dur else ''))
