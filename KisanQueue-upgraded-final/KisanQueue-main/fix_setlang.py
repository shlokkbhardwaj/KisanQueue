from pathlib import Path

p = Path("voice-assistant.js")
s = p.read_text(encoding="utf-8-sig")

start = s.index("    function setLang(code) {")
end = s.index("    renderLangList(langList, setLang);", start)

new_block = """    function setLang(code) {
      currentLang = code;
      FarmerProfileService.setLanguage(code);
      langOverlay.style.display = 'none';

      var cfg = getLangConfig(code);

      titleText.textContent =
        cfg.engName === 'English' ? 'Ask by Voice' : cfg.name;

      micFab.style.display = cfg.sttMode === 'voice' ? '' : 'none';

      stateEl.textContent =
        cfg.sttMode === 'voice'
          ? 'Press the mic to speak'
          : (cfg.note || 'Type your question below.');

      textInput.placeholder =
        cfg.sttMode === 'voice'
          ? 'Type here…'
          : 'Type your question here…';

      textSend.textContent = 'Send';

      micFab.setAttribute(
        'aria-label',
        cfg.engName === 'English' ? 'Ask by Voice' : cfg.name
      );

      micFab.setAttribute(
        'title',
        cfg.engName === 'English' ? 'Ask by Voice' : cfg.name
      );

      ui.showAssistantText(t(code, 'languagePicked'));
    }

"""

fixed = s[:start] + new_block + s[end:]

p.write_text(fixed, encoding="utf-8-sig", newline="")
print("SETLANG FIXED")
