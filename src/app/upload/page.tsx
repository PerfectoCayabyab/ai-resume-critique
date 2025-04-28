'use client';

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('resume', file);

    const res = await fetch('/api/critique', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    setFeedback(data.feedback);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Resume Critique</h1>

      <div className="flex flex-col items-center gap-4">
        <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
        <button 
          onClick={handleSubmit} 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Submit Resume"}
        </button>
      </div>

      {feedback && (
        <div className="mt-10 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Critique Feedback</h2>
          {feedback.split('\n\n').map((section, idx) => (
            <div key={idx} className="mb-6">
              <p className="text-gray-800 whitespace-pre-line">{section}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
