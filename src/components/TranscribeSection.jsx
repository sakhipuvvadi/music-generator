import { useState } from "react";
import "../styles/transcribe.css";


const LANGUAGE_MAP = {
  te: "Telugu",
  ta: "Tamil",
  hi: "Hindi",
  roman: "Roman (English letters)"
};


export default function TranscribeSection() {
  const [inputType, setInputType] = useState("audio");
  const [audio, setAudio] = useState(null);
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetLang, setTargetLang] = useState("te");
  const [detectedLang, setDetectedLang] = useState("");



  const handleTranscribe = async () => {
    if (inputType === "audio") {
      if (!audio) {
        alert("Please upload an audio file");
        return;
      }
      setLoading(true);
        try {
    const formData = new FormData();
    formData.append("file", audio);

    const res = await fetch("http://127.0.0.1:8000/transcribe-audio", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    setOutput(data.text);
    setDetectedLang("");

  } catch (err) {
    alert("Failed to connect to backend");
    console.error(err);
  } finally {
    setLoading(false);   // 🔥 STOP loading AFTER result
  }

  return;
}


    if (!text.trim()) {
      alert("Please enter text");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("text", text);
      formData.append("targetLang", targetLang);

      const res = await fetch("http://127.0.0.1:8000/transliterate", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      setOutput(data.output);
      setDetectedLang(data.detected_language);

    } catch (err) {
      alert("Failed to connect to backend");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="transcribe-card">
      <h2>Transcribe</h2>
      <p>Convert audio or text into written lyrics</p>

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
      {inputType === "text" && (
  <div className="lang-select-bar">
    {/* Left: Auto detect */}
    <div className="lang-box">
      <span className="lang-text">
        {detectedLang
          ? LANGUAGE_MAP[detectedLang] || detectedLang
          : "Detect language"}
      </span>
      
    </div>

    {/* Middle: swap arrow */}
    <div className="swap-icon">⇄</div>

    {/* Right: target language */}
    <select
      className="lang-box select-box"
      value={targetLang}
      onChange={(e) => setTargetLang(e.target.value)}
    >
      <option value="en">English</option>
      <option value="te">Telugu</option>
      <option value="hi">Hindi</option>
      <option value="ta">Tamil</option>
    </select>
  </div>
)}

{inputType === "text" && (
  <div className="text-grid">
    <textarea
      className="input-text"
      placeholder="Enter text"
      value={text}
      onChange={(e) => setText(e.target.value)}
    />

    <textarea
      className="output-text"
      placeholder="Output will appear here"
      value={output}
      readOnly
    />
  </div>
)}


      {inputType === "audio" && (
  <>
    <label className="upload-box">
      <input
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => setAudio(e.target.files[0])}
      />
      <span>{audio ? audio.name : "Upload audio file"}</span>
    </label>

    <textarea
      className="output-text"
      placeholder="Transcribed text will appear here"
      value={output}
      readOnly
      style={{ marginTop: "16px" }}
    />
  </>
)}

      <button
        className="primary-btn"
        onClick={handleTranscribe}
        disabled={loading}
      >
        {loading ? (
          <span className="loader-dots">
            Transliterating<span>.</span><span>.</span><span>.</span>
          </span>
        ) : (
          "Transcribe"
        )}

      </button>
      {detectedLang && (
        <p style={{ fontSize: "18px", color: "#222", marginTop: "12px", fontWeight: 500 }}>
          Detected language:{" "}
          <b>{LANGUAGE_MAP[detectedLang] || detectedLang}</b>
        </p>
      )}

    </section>
  );
}
