#!/usr/bin/env python3
"""Claude Code hook: darslik-* subagent boshlansa/tugasa -> pipeline-live.js yangilanadi.

Pipeline HQ ofisi (pipeline-office.html) shu faylni har 2s o'qib, qaysi rol-agent
hozir REAL ishlayotganini "AVTO" belgisi bilan ko'rsatadi. PreToolUse -> running,
PostToolUse -> running=null + lastDone. darslik-* bo'lmagan subagentlar e'tiborsiz.
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

if data.get('tool_name') not in ('Agent', 'Task'):
    sys.exit(0)
ti = data.get('tool_input') or {}
sub = (ti.get('subagent_type') or '').strip()
if sub not in ROLES:
    sys.exit(0)

proj = os.environ.get('CLAUDE_PROJECT_DIR') or os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
m = re.search(r'([A-Za-z][A-Za-z0-9_]*\.jsx)', ti.get('prompt') or '')
lesson = m.group(1) if m else ''

live = {'updated': time.strftime('%H:%M')}
if data.get('hook_event_name') == 'PreToolUse':
    live['running'] = {'role': ROLES.index(sub), 'agent': sub,
                       'lesson': lesson, 'since': int(time.time())}
else:
    live['running'] = None
    live['lastDone'] = {'role': ROLES.index(sub), 'agent': sub,
                        'lesson': lesson, 'at': int(time.time())}

with open(os.path.join(proj, 'pipeline-live.js'), 'w') as f:
    f.write('window.PIPELINE_LIVE=' + json.dumps(live, ensure_ascii=False) + ';\n')
sys.exit(0)
