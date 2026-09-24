import { useState } from "react";
import "../styles/transcribe.css";

export default function LyricsGenerator() {
  const [mood, setMood] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("en");
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!mood || !genre) {
      alert("Select mood and genre");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-lyrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mood,
          genre,
          language
        })
      });

      const data = await res.json();
      setLyrics(data.lyrics);

    } catch (err) {
      console.error(err);
      alert("Failed to generate lyrics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="transcribe-card">
      <h2>Lyrics Generator</h2>
      <p>Create lyrics based on mood and genre</p>

      {/* Filters */}
      <div className="lang-select-bar">

        <select
          className="lang-box select-box"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        >
          <option value="">Select Mood</option>
          <option value="happy">Happy</option>
          <option value="sad">Sad</option>
          <option value="romantic">Romantic</option>
          <option value="energetic">Energetic</option>
        </select>

        <select
          className="lang-box select-box"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">Select Genre</option>
          <option value="pop">Pop</option>
          <option value="rap">Rap</option>
          <option value="classical">Classical</option>
          <option value="lofi">Lofi</option>
        </select>

        <select
          className="lang-box select-box"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="te">Telugu</option>
          <option value="ta">Tamil</option>
        </select>

      </div>

      {/* Button */}
      <button
        className="primary-btn"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Lyrics"}
      </button>

      {/* Output */}
      <textarea
        className="output-text"
        value={lyrics}
        readOnly
        placeholder="Generated lyrics will appear here"
        style={{ marginTop: "16px" }}
      />
    </section>
  );
}