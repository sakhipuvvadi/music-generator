import { useState } from "react";
import "../styles/transcribe.css";

export default function LyricsGenerator() {
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!file) {
      alert("Please upload a song");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-video", {
        method: "POST",
        body: formData,
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setVideoUrl(url); // 👈 show video instead of only download

    } catch (err) {
      console.error(err);
      alert("Failed to generate video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="transcribe-card">
      <h2>Lyrics Video Generator 🎬</h2>
      <p>Upload a song → get timed lyrics video</p>

      {/* Upload */}
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files[0])}
      />

      {/* Button */}
      <button
        className="primary-btn"
        onClick={handleGenerate}
        disabled={loading}
        style={{ marginTop: "16px" }}
      >
        {loading ? "Processing..." : "Generate Video"}
      </button>

      {/* 🎥 Video Preview */}
      {videoUrl && (
        <div style={{ marginTop: "20px" }}>
          <video width="100%" controls src={videoUrl}></video>

          {/* Optional Download */}
          <a href={videoUrl} download="lyrics_video.mp4">
            Download Video
          </a>
        </div>
      )}
    </section>
  );
}