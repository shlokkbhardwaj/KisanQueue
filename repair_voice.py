from pathlib import Path

p = Path("voice-assistant.js")
s = p.read_text(encoding="utf-8-sig")

def repair(chunk):
    try:
        return chunk.encode("latin1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return chunk

parts = []
for ch in s:
    parts.append(ch)

out = []
i = 0
while i < len(parts):
    if ord(parts[i]) >= 128:
        j = i
        while j < len(parts) and ord(parts[j]) >= 128:
            j += 1
        out.append(repair("".join(parts[i:j])))
        i = j
    else:
        out.append(parts[i])
        i += 1

fixed = "".join(out)
p.write_text(fixed, encoding="utf-8-sig", newline="")
print("REPAIRED")
print("Remaining mojibake:", fixed.count("à¤"), fixed.count("â"))
