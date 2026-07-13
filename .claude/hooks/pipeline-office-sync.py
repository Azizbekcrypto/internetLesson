#!/usr/bin/env python3
"""Claude Code hook v2: Pipeline HQ ofisining AVTO-JONI.

Nima qiladi (pipeline-office.html shu fayldan har 2s o'qiydi):
  1. darslik-* subagent boshlansa  -> o'sha rol 'A' (ishlayapti) + running
  2. darslik-* subagent tugasa     -> o'sha rol 'D' (tayyor) + lastDone + bugungi hisob
  3. AskUserQuestion ochilsa       -> gate=on  (🚦 tasdiq xonasi yonadi)
  4. AskUserQuestion yopilsa       -> gate=off
Har dars uchun 9 belgili bosqich-satri (s) TO'PLANIB boradi — asosiy agent
hech narsani qo'lda yozmaydi. Format: window.PIPELINE_LIVE v2.
"""
import json
import os
import re
import sys
import time

ROLES = ['darslik-auditor', 'darslik-ijodkor', 'darslik-quruvchi', 'darslik-dizayn',
         'darslik-animatsiya', 'darslik-jonli', 'darslik-metodist',
         'darslik-tekshiruvchi', 'darslik-verifikator']

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

tool = data.get('tool_name')
event = data.get('hook_event_name')
if tool not in ('Agent', 'Task', 'AskUserQuestion'):
    sys.exit(0)

proj = os.environ.get('CLAUDE_PROJECT_DIR') or os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
path = os.path.join(proj, 'pipeline-live.js')

# ── B: fayl-qulf — parallel launch'larda read-modify-write yo'qolmasin ──
import fcntl
_lock = open(path + '.lock', 'w')
fcntl.flock(_lock, fcntl.LOCK_EX)  # jarayon tugaguncha ushlab turiladi

# ── eski holatni o'qish (v2 bo'lmasa toza boshlaymiz) ──
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
# V3: running — XARITA (bir vaqtda bir nechta qavatda parallel ish)
run = state.get('running')
if not isinstance(run, dict) or 'role' in (run or {}):
    run = {}
# eskirgan yozuvlarni tozalash (>2 soat)
state['running'] = {k: v for k, v in run.items()
                    if isinstance(v, dict) and now - v.get('since', 0) < 7200}
state.setdefault('gate', None)
state.setdefault('lastDone', None)
state.setdefault('activeLesson', None)
if not isinstance(state.get('today'), dict) or state['today'].get('date') != today:
    state['today'] = {'date': today, 'done': 0}

def set_stage(lesson, role_idx, code):
    if not lesson:
        return
    rec = state['lessons'].setdefault(lesson, {'s': 'I' * 9})
    s = (rec.get('s') or 'I' * 9).ljust(9, 'I')[:9]
    rec['s'] = s[:role_idx] + code + s[role_idx + 1:]
    rec['touched'] = now
    state['activeLesson'] = lesson

def hist(ev, role=None, lesson=None):
    h = state.setdefault('history', [])
    h.append({'t': now, 'ev': ev, 'role': role, 'lesson': lesson})
    del h[:-80]

if tool == 'AskUserQuestion':
    # human-gate: savol ochiq ekan tasdiq xonasi yonadi; TV'da savol MATNI ko'rinadi
    if event == 'PreToolUse':
        q = ''
        try:
            qs = (data.get('tool_input') or {}).get('questions') or []
            q = (qs[0] or {}).get('question') or ''
        except Exception:
            pass
        state['gate'] = {'since': now, 'q': q[:200]}
        hist('gate')
    else:
        state['gate'] = None
else:
    ti = data.get('tool_input') or {}
    sub = (ti.get('subagent_type') or '').strip()
    if sub not in ROLES:
        sys.exit(0)
    ri = ROLES.index(sub)
    m = re.search(r'([A-Za-z][A-Za-z0-9_]*\.jsx)', ti.get('prompt') or '')
    lesson = m.group(1) if m else (state.get('activeLesson') or '')
    key = f"{lesson or '?'}:{ri}"
    # FON-AGENT (A-tuzatish 2026-07-11): run_in_background=true bilan ishga tushgan
    # agentda PostToolUse = faqat "launched" kvitansiyasi, TUGASH EMAS. Haqiqiy tugash
    # hook'ka umuman kelmaydi (asosiy agent office-mark.py bilan qo'lda belgilaydi).
    # B-tuzatish (2026-07-11): fon-launch'da tool_response hookka BO'SH keladi —
    # bo'sh javob ham kvitansiya. run_in_background bermay (default fon) ishga
    # tushirilganda ham shu holat. Faqat TO'LIQ natija matni kelgandagina D.
    if event == 'PostToolUse':
        tr = data.get('tool_response')
        resp = json.dumps(tr or '')
        if (not tr or ti.get('run_in_background')
                or 'Async agent launched' in resp or 'agentId' in resp):
            sys.exit(0)  # holatga tegmaymiz — PreToolUse allaqachon A/running yozgan
    if event == 'PreToolUse':
        state['running'][key] = {'role': ri, 'agent': sub, 'lesson': lesson, 'since': now}
        set_stage(lesson, ri, 'A')
        hist('start', ri, lesson)
    elif event == 'PostToolUseFailure':
        # XATO-RADAR: agent buzilib tugadi -> rol E, zona qizil yonadi
        was = state['running'].pop(key, None)
        set_stage(lesson, ri, 'E')
        state['lastError'] = {'role': ri, 'agent': sub, 'lesson': lesson, 'at': now}
        hist('fail', ri, lesson)
    else:
        was = state['running'].pop(key, None)
        state['lastDone'] = {'role': ri, 'agent': sub, 'lesson': lesson, 'at': now}
        set_stage(lesson, ri, 'D')
        # bosqich DAVOMIYLIGI (soniya) — stend/kartada ko'rinadi
        if lesson and was and was.get('since'):
            state['lessons'][lesson].setdefault('t', {})[str(ri)] = now - was['since']
        state['today']['done'] += 1
        hist('done', ri, lesson)

state['epoch'] = now
state['updated'] = time.strftime('%H:%M')

with open(path, 'w') as f:
    f.write('window.PIPELINE_LIVE=' + json.dumps(state, ensure_ascii=False) + ';\n')

# ═══ BULUT-SINXRON (Supabase) — telefonda/istalgan qurilmada jonli ko'rish ═══
# office-cloud.json bo'lsa holatni office_sync RPC'ga jo'natadi (2s timeout,
# oflaynda JIM o'tadi — lokal ish hech qachon buzilmaydi).
try:
    import urllib.request
    cfg_path = os.path.join(proj, '.claude', 'supabase', 'office-cloud.json')
    with open(cfg_path) as f:
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
sys.exit(0)
