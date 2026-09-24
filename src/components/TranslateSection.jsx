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
    if (inputType === "audio") {
  if (!audio) {
    alert("Upload audio file");
    return;
  }

  setLoading(true);

  try {
    // 🔥 STEP 1: Transcribe audio
    const formData = new FormData();
    formData.append("file", audio);

    const transcribeRes = await fetch("http://127.0.0.1:8000/transcribe-audio", {
      method: "POST",
      body: formData
    });

    const transcribeData = await transcribeRes.json();
    const transcribedText = transcribeData.text;

    // 🔥 STEP 2: Translate text
    const translateRes = await fetch("http://127.0.0.1:8000/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: transcribedText,
        fromLang: "auto",
        toLang: toLang
      })
    });

    const translateData = await translateRes.json();

    // 🎯 Final output
    setOutput(translateData.translation);
    setDetectedLang(translateData.detected_language);

  } catch (err) {
    console.error(err);
    alert("Audio translation failed");
  } finally {
    setLoading(false);
  }

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

      {inputType === "audio" && (
  <>
    {/* 🔥 Language selection for audio */}
    <div className="lang-select-bar">
      <div className="lang-box">
        <span className="lang-text">
          {detectedLang
            ? LANGUAGE_MAP[detectedLang] || detectedLang
            : "Detect language"}
        </span>
      </div>

      <div className="swap-icon">⇄</div>

      <select
        className="lang-box select-box"
        value={toLang}
        onChange={(e) => setToLang(e.target.value)}
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="te">Telugu</option>
        <option value="ta">Tamil</option>
      </select>
    </div>

    {/* 🔥 Upload box */}
    <label className="upload-box">
      <input
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => {
          setAudio(e.target.files[0]);
          setOutput("");
        }}
      />
      <span>{audio ? audio.name : "Upload audio file"}</span>
    </label>

    {/* 🔥 Output box */}
    <textarea
      className="output-text"
      placeholder="Translated text will appear here"
      value={output}
      readOnly
      style={{ marginTop: "16px" }}
    />
  </>
)}
{inputType === "text" && (
  <div className="text-grid">

    {/* 🔥 LEFT SIDE (INPUT + LANGUAGE) */}
    <div>
      <select
        className="lang-box select-box"
        value={fromLang}
        onChange={(e) => setFromLang(e.target.value)}
      >
        <option value="auto">Detect language</option>
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="te">Telugu</option>
        <option value="ta">Tamil</option>
      </select>

      <textarea
        className="input-text"
        placeholder="Enter text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ marginTop: "10px" }}
      />
    </div>

    {/* 🔥 RIGHT SIDE (OUTPUT + LANGUAGE) */}
    <div>
      <select
        className="lang-box select-box"
        value={toLang}
        onChange={(e) => setToLang(e.target.value)}
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="te">Telugu</option>
        <option value="ta">Tamil</option>
      </select>

      <textarea
        className="output-text"
        placeholder="Translation appears here"
        value={output}
        readOnly
        style={{ marginTop: "10px" }}
      />
    </div>

  </div>
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
