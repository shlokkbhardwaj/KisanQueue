from pathlib import Path

p = Path("voice-assistant.js")
s = p.read_text(encoding="utf-8-sig")

s = s.replace(
    "youSaidEl.innerHTML = '<b>à¤†à¤ªà¤¨à¥‡ à¤•à¤¹¤¾:</b> â€œ' + r.transcript + 'â€ï¸</button>';",
    "youSaidEl.textContent = 'You said: ' + r.transcript;"
)

s = s.replace(
    "stateEl.textContent = 'â³ à¤¸à¤®à¤â€¦';",
    "stateEl.textContent = 'Processing…';"
)

p.write_text(s, encoding="utf-8-sig", newline="")
print("TRANSCRIPT FIXED")
