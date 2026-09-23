from pathlib import Path

p = Path("voice-assistant.js")
s = p.read_text(encoding="utf-8-sig")

start = s.index("  function renderLangList(container, onPick) {")
end = s.index("  /* ===================================================================", start)

new_block = """  function renderLangList(container, onPick) {
    container.innerHTML = '';
    LANGUAGES.forEach(function (lang) {
      var btn = document.createElement('button');
      btn.className = 'kq-lang-option' + (lang.sttMode === 'text-only' ? ' kq-lang-textonly' : '');

      var badge = lang.sttMode === 'text-only'
        ? '\\\\u2328\\\\uFE0F Type'
        : '\\\\uD83C\\\\uDFA4 Voice';

      btn.innerHTML =
        '<span class="kq-lang-native">' + lang.name + '</span>' +
        '<span class="kq-lang-eng">' + lang.engName + '</span>' +
        '<span class="kq-lang-badge' +
          (lang.sttMode === 'voice' ? ' kq-lang-badge-voice' : '') +
        '">' + badge + '</span>';

      btn.addEventListener('click', function () {
        onPick(lang.code);
      });

      container.appendChild(btn);
    });
  }

"""
fixed = s[:start] + new_block + s[end:]

p.write_text(fixed, encoding="utf-8-sig", newline="")
print("LANGUAGE BADGES FIXED")
