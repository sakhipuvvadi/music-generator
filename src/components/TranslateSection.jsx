import { useState } from "react";
import "../styles/translate.css";

const LANGUAGE_MAP = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil"
};

export default function TranslateSection() {
  const [inputType, setInputType] = useState("text");
  const [audio, setAudio] = useState(null);
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromLang, setFromLang] = useState("auto");
  const [toLang, setToLang] = useState("en");
  const [detectedLang, setDetectedLang] = useState("");

  const handleTranslate = async () => {
    if (inputType !== "text") {
      alert("Audio translation not connected yet");
      return;
    }

    if (!text.trim()) {
      alert("Enter text");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text,
          fromLang,
          toLang
        })
      });

      const data = await res.json();

      setOutput(data.translation);
      setDetectedLang(data.detected_language);

    } catch (err) {
      console.error(err);
      alert("Backend connection failed");
    }

    setLoading(false);
  };

  return (
    <section className="transcribe-card">

      <h2>Translate</h2>
      <p>Translate text between languages</p>

      {/* TOGGLE */}
      <div className="toggle">
        <button
          className={inputType === "audio" ? "active" : ""}
          onClick={() => setInputType("audio")}
        >
          Audio
        </button>

        <button
          className={inputType === "text" ? "active" : ""}
          onClick={() => setInputType("text")}
        >
          Text
        </button>
      </div>

      {/* LANGUAGE BAR */}
      {inputType === "text" && (
        <div className="lang-select-bar">

          {/* DETECTED */}
          <div className="lang-box">
            <span className="lang-text">
              {detectedLang
                ? LANGUAGE_MAP[detectedLang] || detectedLang
                : "Detect language"}
            </span>
          </div>

          {/* ARROW */}
          <div className="swap-icon">⇄</div>

          {/* TARGET */}
          <select
            className="lang-box select-box"
            value={toLang}
            onChange={(e)=>setToLang(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="te">Telugu</option>
            <option value="ta">Tamil</option>
          </select>

        </div>
      )}

      {/* TEXT MODE */}
      {inputType === "text" && (
        <div className="text-grid">

          <textarea
            className="input-text"
            placeholder="Enter text"
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />

          <textarea
            className="output-text"
            placeholder="Translation appears here"
            value={output}
            readOnly
          />

        </div>
      )}

      {/* AUDIO MODE */}
      {inputType === "audio" && (
        <label className="upload-box">
          <input
            type="file"
            accept="audio/*"
            hidden
            onChange={(e)=>setAudio(e.target.files[0])}
          />
          <span>{audio ? audio.name : "Upload audio file"}</span>
        </label>
      )}

      {/* BUTTON */}
      <button
        className="primary-btn"
        onClick={handleTranslate}
        disabled={loading}
      >
        {loading ? (
          <span className="loader-dots">
            Translating<span>.</span><span>.</span><span>.</span>
          </span>
        ) : (
          "Translate"
        )}
      </button>

      {/* DETECTED TEXT */}
      {detectedLang && (
        <p style={{fontSize:18,marginTop:12}}>
          Detected language: <b>{LANGUAGE_MAP[detectedLang]}</b>
        </p>
      )}

    </section>
  );
}
