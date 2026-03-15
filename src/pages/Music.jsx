import { useState } from "react";
import "./music.css";

export default function Music() {
  const [mood, setMood] = useState("");
  const [genre, setGenre] = useState("");
  const [tempo, setTempo] = useState("");

  const [customMood, setCustomMood] = useState("");
  const [customGenre, setCustomGenre] = useState("");
  const [customTempo, setCustomTempo] = useState("");

  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");

  const [favSongs, setFavSongs] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const handleValue = (val, setter, customSetter) => {
    setter(val);
    if (val !== "other") customSetter("");
  };

  /* ================= MUSIC GENERATION ================= */
  const generateMusic = async () => {
    setLoading(true);

    const finalMood = mood === "other" ? customMood : mood;
    const finalGenre = genre === "other" ? customGenre : genre;
    const finalTempo = tempo === "other" ? customTempo : tempo;

    try {
      const res = await fetch("http://127.0.0.1:8000/generate-music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mood: finalMood,
          genre: finalGenre,
          tempo: finalTempo
        })
      });

      if (!res.ok) throw new Error("Music generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

    } catch (err) {
      console.error(err);
      alert("Error generating music");
    }

    setLoading(false);
  };

  /* ================= SONG RECOMMENDATION ================= */
  const getRecommendations = async () => {

    if (!favSongs.trim()) {
      alert("Enter songs first");
      return;
    }

    setRecLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/recommend-songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ songs: favSongs })
      });

      if (!res.ok) throw new Error("Recommendation failed");

      const data = await res.json();
      console.log(data);
      if (data.recommendations)
        setRecommendations(data.recommendations);
      else
        alert("Invalid response from server");

    } catch (err) {
      console.error(err);
      alert("Recommendation failed");
    }

    setRecLoading(false);
  };

  /* ================= UI ================= */
  return (
<>
  {/* ========= CARD 1 ========= */}
  <div className="card">
    <h2>Generate Instrumental</h2>

    <label>Mood</label>
    <select value={mood} onChange={e => handleValue(e.target.value, setMood, setCustomMood)}>
      <option value="">Select mood</option>
      <option>Happy</option>
      <option>Sad</option>
      <option>Calm</option>
      <option>Epic</option>
      <option>Dark</option>
      <option value="other">Other</option>
    </select>

    {mood === "other" &&
      <input placeholder="Enter mood" value={customMood} onChange={e=>setCustomMood(e.target.value)}/>
    }

    <label>Genre</label>
    <select value={genre} onChange={e => handleValue(e.target.value, setGenre, setCustomGenre)}>
      <option value="">Select genre</option>
      <option>Lofi</option>
      <option>Orchestral</option>
      <option>Pop</option>
      <option>Ambient</option>
      <option>Piano</option>
      <option value="other">Other</option>
    </select>

    {genre === "other" &&
      <input placeholder="Enter genre" value={customGenre} onChange={e=>setCustomGenre(e.target.value)}/>
    }

    <label>Tempo</label>
    <select value={tempo} onChange={e => handleValue(e.target.value, setTempo, setCustomTempo)}>
      <option value="">Select tempo</option>
      <option>Slow</option>
      <option>Medium</option>
      <option>Fast</option>
      <option value="other">Other</option>
    </select>

    {tempo === "other" &&
      <input placeholder="Enter tempo" value={customTempo} onChange={e=>setCustomTempo(e.target.value)}/>
    }

    <button className="generate" onClick={generateMusic} disabled={loading}>
      {loading ? "Generating..." : "Generate Music"}
    </button>

    {audioUrl &&
      <audio controls src={audioUrl} style={{marginTop:20,width:"100%"}}/>
    }
  </div>


  {/* ========= CARD 2 ========= */}
  <div className="rec-card section">
    <h2>Song Recommendations</h2>

    <textarea
      placeholder="Enter favorite songs separated by commas"
      value={favSongs}
      onChange={e=>setFavSongs(e.target.value)}
    />

    <button className="rec-btn" onClick={getRecommendations} disabled={recLoading}>
      {recLoading ? "Finding..." : "Get Recommendations"}
    </button>

    {recommendations.length>0 && (
      <table border="1">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Artist</th>
            <th>Genre</th>
            <th>Mood</th>
            <th>Why</th>
            <th>Spotify</th>
          </tr>
        </thead>

        <tbody>
          {recommendations.map((song,i)=>(
            <tr key={i}>
              <td>{i+1}</td>
              <td>{song.title}</td>
              <td>{song.artist}</td>
              <td>{song.genre}</td>
              <td>{song.mood}</td>
              <td>{song.similarity_reason}</td>
              <td><a href={song.spotify_url} target="_blank">Open</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
</>
)

}
