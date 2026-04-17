import { Download, Image as ImageIcon, Loader2, Plus, Send, Sparkles } from 'lucide-react';

function HomeDashboard({
  fileInputRef,
  generateImage,
  handleDownload,
  handleReferenceFileChange,
  imageCaption,
  loading,
  loadingElapsedSeconds,
  prompt,
  promptSuggestion,
  referencePreview,
  result,
  setPrompt,
  suggestingPrompt,
}) {
  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.85fr] gap-6">
        <div className="rounded-[2.75rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(13,16,30,0.92),rgba(9,10,18,0.98))] shadow-[0_0_45px_rgba(59,130,246,0.08)] p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-300/70 to-pink-400/0"></div>
          <div className="flex justify-between items-center mb-5">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.32em] flex items-center gap-2">
              <ImageIcon size={14} />
              Preview Image
            </span>
            <button onClick={() => fileInputRef.current.click()} className="text-gray-500 hover:text-white transition-all">
              <Plus size={20} />
            </button>
          </div>
          <div className="rounded-[2rem] p-[2px] bg-[linear-gradient(90deg,rgba(34,211,238,0.9),rgba(56,189,248,0.35),rgba(244,114,182,0.9),rgba(163,230,53,0.85))] shadow-[0_0_40px_rgba(96,165,250,0.2)]">
            <div
              className="h-[min(42vh,360px)] rounded-[calc(2rem-2px)] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),transparent_30%),linear-gradient(180deg,#0b0d17_0%,#090b12_100%)] border border-white/5 flex items-center justify-center overflow-hidden cursor-pointer relative"
              onClick={() => fileInputRef.current.click()}
            >
              {referencePreview ? (
                <img src={referencePreview} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center opacity-25">
                  <ImageIcon size={58} />
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-4">Upload Input</p>
                </div>
              )}
              <div className="absolute top-4 right-4 px-4 py-2 rounded-full border border-white/10 bg-black/35 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.22em] text-white/80">
                Click to browse
              </div>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleReferenceFileChange}
          />

          {(suggestingPrompt || promptSuggestion) && (
            <div className="mt-5 rounded-[1.7rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(9,11,18,0.95))] p-5 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-cyan-300 uppercase tracking-[0.28em]">Prompt Suggestion</p>
                  <p className="mt-2 text-sm text-gray-400">
                    {suggestingPrompt
                      ? 'Analyzing your reference image and building a suggested prompt...'
                      : imageCaption
                        ? `AI image analysis: ${imageCaption}`
                        : 'A suggested prompt is ready for this image.'}
                  </p>
                </div>
                {promptSuggestion && (
                  <button
                    type="button"
                    onClick={() => setPrompt(promptSuggestion)}
                    className="shrink-0 rounded-full bg-cyan-400/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200 transition-all hover:bg-cyan-400/25"
                  >
                    Use Suggestion
                  </button>
                )}
              </div>
              <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-gray-200">
                {suggestingPrompt ? (
                  <div className="flex items-center gap-3 text-cyan-200">
                    <Loader2 className="animate-spin" size={18} />
                    <span>Generating a prompt suggestion...</span>
                  </div>
                ) : (
                  promptSuggestion
                )}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#0d1019]/90 backdrop-blur-2xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] flex items-center gap-3 group focus-within:border-cyan-300/40 transition-all">
            <input
              className="flex-1 bg-transparent px-5 py-3 outline-none italic text-xl placeholder:text-slate-600 text-white"
              placeholder="change the color flower to red flower..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  e.preventDefault();
                  generateImage();
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-3 rounded-full border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-wide text-gray-300 hover:bg-white/10 transition-all"
            >
              Browse File
            </button>
            <button
              onClick={generateImage}
              disabled={loading}
              className="bg-blue-600 text-white p-4 rounded-full hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_26px_rgba(59,130,246,0.28)]"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
            </button>
          </div>

          <div className="mt-6 rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.28em]">Editing Workflow</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                '1. Upload a reference image',
                '2. Review or apply the suggested prompt',
                '3. Press Enter or click send to generate a new result',
              ].map((step) => (
                <div key={step} className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-gray-300">
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[2.75rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(13,16,30,0.92),rgba(9,10,18,0.98))] shadow-[0_0_45px_rgba(236,72,153,0.08)] p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-5">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.32em] flex items-center gap-2">
              <Sparkles size={14} />
              Final Output
            </span>
            {result && (
              <button onClick={() => handleDownload(result)} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500 transition-all shadow-lg">
                <Download size={18} />
              </button>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 min-h-[420px] flex items-center justify-center overflow-hidden">
            {loading ? (
              <div className="text-center">
                <Loader2 className="animate-spin text-blue-500 mx-auto" size={42} />
                <p className="text-[10px] font-black uppercase text-blue-500 mt-4">Processing</p>
                <p className="mt-3 text-sm text-gray-400">{loadingElapsedSeconds}s elapsed</p>
              </div>
            ) : result ? (
              <img src={result} className="w-full h-full max-h-[420px] object-contain animate-in zoom-in-95 duration-500" />
            ) : (
              <div className="text-center opacity-10">
                <Sparkles size={60} className="mx-auto" />
                <p className="text-xs font-bold uppercase tracking-widest mt-4">Waiting for Prompt</p>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.28em]">Output Notes</p>
            <p className="mt-4 text-sm leading-7 text-gray-300">
              Upload a clear reference image and write a specific prompt for the best result. Mention the subject, the change you want, and the desired style or mood.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;
