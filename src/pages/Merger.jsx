import { useState } from "react";

export default function Merger() {
  const [files, setFiles] = useState([]);
  const [mergedUrl, setMergedUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
    setMergedUrl(null);
  };

  const mergeAudio = async () => {
    if (files.length < 2) {
      alert("Please select at least 2 audio files");
      return;
    }

    setLoading(true);

    const audioContext = new AudioContext();
    const buffers = [];

    for (let file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      buffers.push(audioBuffer);
    }

    const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);

    const mergedBuffer = audioContext.createBuffer(
      buffers[0].numberOfChannels,
      totalLength,
      buffers[0].sampleRate
    );

    let offset = 0;
    buffers.forEach((buffer) => {
      for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        mergedBuffer
          .getChannelData(ch)
          .set(buffer.getChannelData(ch), offset);
      }
      offset += buffer.length;
    });

    const wavBlob = bufferToWave(mergedBuffer);
    setMergedUrl(URL.createObjectURL(wavBlob));
    setLoading(false);
  };

  return (
    <div className="merger-page">
      <div className="merger-card">
        <h1>Audio Merger</h1>
        <p className="subtitle">
          Merge multiple audio files into one seamless track
        </p>

        {/* Upload */}
        <label className="upload-box">
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileChange}
            hidden
          />
          <span>Click to upload audio files</span>
        </label>

        {/* File list */}
        {files.length > 0 && (
          <ul className="file-list">
            {files.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        )}

        {/* Merge button */}
        <button
          className="primary-btn"
          onClick={mergeAudio}
          disabled={loading}
        >
          {loading ? "Merging..." : "Merge Audio"}
        </button>

        {/* Result */}
        {mergedUrl && (
          <div className="result">
            <audio controls src={mergedUrl}></audio>

            <a
              className="download-btn"
              href={mergedUrl}
              download="merged-audio.wav"
            >
              Download Merged Audio
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
function bufferToWave(buffer) {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length * numChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  let offset = 0;

  const writeString = (str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset++, str.charCodeAt(i));
    }
  };

  writeString("RIFF");
  view.setUint32(offset, length - 8, true); offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, buffer.sampleRate, true); offset += 4;
  view.setUint32(offset, buffer.sampleRate * numChannels * 2, true); offset += 4;
  view.setUint16(offset, numChannels * 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeString("data");
  view.setUint32(offset, buffer.length * numChannels * 2, true); offset += 4;

  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

