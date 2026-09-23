from pathlib import Path

p = Path("voice-assistant.js")
s = p.read_text(encoding="utf-8-sig")

start = s.index("  var LANGUAGES = [")
end = s.index("  function getLangConfig(code)", start)

new_block = """  var LANGUAGES = [
    { code: 'hi-IN', name: '\\u0939\\u093f\\u0928\\u094d\\u0926\\u0940', engName: 'Hindi', sttMode: 'voice' },
    { code: 'en-IN', name: 'English', engName: 'English', sttMode: 'voice' },
    { code: 'bn-IN', name: '\\u09ac\\u09be\\u0982\\u09b2\\u09be', engName: 'Bengali', sttMode: 'voice' },
    { code: 'mr-IN', name: '\\u092e\\u0930\\u093e\\u0920\\u0940', engName: 'Marathi', sttMode: 'voice' },
    { code: 'gu-IN', name: '\\u0a97\\u09c1\\u099c\\u0930\\u09be\\u09a4\\u09c0', engName: 'Gujarati', sttMode: 'voice' },
    { code: 'pa-IN', name: '\\u0a2a\\u0a70\\u0a1c\\u0a3e\\u0x0000\\u0x0000', engName: 'Punjabi', sttMode: 'voice' },
    { code: 'ta-IN', name: '\\u0ba4\\u0bae\\u0bbf\\u0bb4\\u0bcd', engName: 'Tamil', sttMode: 'voice' },
    { code: 'te-IN', name: '\\u0c24\\u0c46\\u0c32\\u0c41\\u0c17\\u0c41', engName: 'Telugu', sttMode: 'voice' },
    { code: 'kn-IN', name: '\\u0c95\\u0ca8\\u0ccd\\u0ca8\\u0ca1', engName: 'Kannada', sttMode: 'voice' },
    { code: 'ml-IN', name: '\\u0d2e\\u0d32\\u0d2f\\u0d3e\\u0d33\\u0d02', engName: 'Malayalam', sttMode: 'voice' },
    { code: 'bho-IN', name: '\\u092d\\u094b\\u091c\\u092a\\u0941\\u0930\\u0940', engName: 'Bhojpuri', sttMode: 'text-only', note: 'Parsed using the Hindi keyword set (shared agricultural vocabulary) until a dedicated Bhojpuri model is available.' },
    { code: 'or-IN', name: '\\u0b13\\u0b21\\u0b3f\\u0b06', engName: 'Odia', sttMode: 'text-only', note: 'Needs a cloud ASR/TTS provider such as Bhashini or Google Cloud Speech.' },
    { code: 'as-IN', name: '\\u0985\\u09b8\\u09ae\\u09c0\\u09af\\u09bc\\u09be', engName: 'Assamese', sttMode: 'text-only', note: 'Needs a cloud ASR/TTS provider such as Bhashini or Google Cloud Speech.' }
  ];

"""

# Correct Punjabi Unicode escape separately because the source above uses a safe ASCII representation.
new_block = new_block.replace(
    "\\u0a2a\\u0a70\\u0a1c\\u0a3e\\u0x0000\\u0x0000",
    "\\u0a2a\\u0a70\\u0a1c\\u0abe\\u0a2c\\u0a40"
)

fixed = s[:start] + new_block + s[end:]

p.write_text(fixed, encoding="utf-8-sig", newline="")
print("LANGUAGE NAMES FIXED")
