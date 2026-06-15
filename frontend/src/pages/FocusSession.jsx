import React, { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle2, XCircle, RotateCcw, Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, Brain, Coffee } from 'lucide-react';

export default function FocusSession() {
  const [mode, setMode] = useState("focus"); // 'focus', 'shortBreak', 'longBreak'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  // Music Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const playerRef = useRef(null);

  const lofiStreams = [
    { 
      url: "https://cdn.chosic.com/wp-content/uploads/2022/01/Lofi-Study-Music.mp3", 
      title: "Lofi Study Music", subtitle: "Deep Focus", cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80" 
    },
    { 
      url: "https://cdn.chosic.com/wp-content/uploads/2021/04/And-So-It-Begins-Inspired-By-Crush-Sometimes.mp3", 
      title: "And So It Begins", subtitle: "Chillhop", cover: "https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=400&q=80" 
    },
    { 
      url: "https://cdn.chosic.com/wp-content/uploads/2021/07/purrple-cat-equinox.mp3", 
      title: "Equinox", subtitle: "Relaxing Beats", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80" 
    },
    { 
      url: "https://cdn.chosic.com/wp-content/uploads/2021/07/The-Ambient-LoFi.mp3", 
      title: "The Ambient LoFi", subtitle: "Late Night Study", cover: "https://images.unsplash.com/photo-1619983081563-430f63602796?w=400&q=80" 
    }
  ];
  const [streamIndex, setStreamIndex] = useState(0);
  const currentStream = lofiStreams[streamIndex];
  
  // Sync native audio element with React state
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume = volume;
      playerRef.current.muted = isMuted;
      
      if (isPlaying) {
        playerRef.current.play().catch(e => console.log("Audio play error:", e));
      } else {
        playerRef.current.pause();
      }
    }
  }, [isPlaying, volume, isMuted, streamIndex]);

  // Modes config
  const modes = {
    focus: { time: 25 * 60, label: "Focus Time", icon: <Brain size={20} />, color: "text-[#3b8ea0]", bg: "bg-[#d0f6e3]" },
    shortBreak: { time: 5 * 60, label: "Short Break", icon: <Coffee size={20} />, color: "text-orange-500", bg: "bg-orange-100" },
    longBreak: { time: 15 * 60, label: "Long Break", icon: <Coffee size={20} />, color: "text-blue-500", bg: "bg-blue-100" },
  };

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished! Play a sound
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
      audio.play().catch(e => console.log("Audio play blocked by browser."));
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(modes[mode].time);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(modes[newMode].time);
  };

  // Format time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalTime = modes[mode].time;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    setIsMuted(!isMuted);
    if (isMuted && volume === 0) setVolume(0.5);
  };

  const nextSong = (e) => {
    e.stopPropagation();
    setStreamIndex((prev) => (prev + 1) % lofiStreams.length);
    setIsPlaying(true);
  };

  const prevSong = (e) => {
    e.stopPropagation();
    setStreamIndex((prev) => (prev - 1 + lofiStreams.length) % lofiStreams.length);
    setIsPlaying(true);
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] w-full relative">
      
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-6 animate-in">
        {/* Header */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-main">Focus Session</h1>
        </div>

        {/* Main Container */}
        <div className="flex flex-col items-center gap-10 w-full relative z-10">
          
          {/* Timer Section */}
          <div className="card w-full max-w-md flex flex-col items-center p-8 relative overflow-hidden">
            
            {/* Mode Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full mb-8 w-full relative z-10">
              {Object.keys(modes).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    mode === m 
                      ? `bg-white dark:bg-slate-700 shadow-sm ${modes[m].color}` 
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <span className="hidden sm:inline">{modes[m].icon}</span>
                  {modes[m].label}
                </button>
              ))}
            </div>

            {/* Circular Timer Display */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray="753.98"
                  strokeDashoffset={753.98 - (753.98 * progress) / 100}
                  className={`${modes[mode].color} transition-all duration-1000 ease-linear`}
                />
              </svg>
              <div className="text-6xl font-bold tracking-tighter text-main">
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTimer}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-md ${
                  isActive ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 'bg-[#4eb7b3] hover:bg-[#3b8ea0] shadow-[#4eb7b3]/20'
                }`}
              >
                {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                {isActive ? "PAUSE" : "START"}
              </button>

              <button 
                onClick={resetTimer}
                className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-muted hover:text-main hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                aria-label="Reset Timer"
              >
                <RotateCcw size={24} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Expandable Mini Player Widget */}
      <div 
         onClick={() => setIsPlayerExpanded(!isPlayerExpanded)}
         className={`absolute bottom-6 right-6 z-50 rounded-full overflow-hidden shadow-2xl backdrop-blur-3xl bg-[#1c1c1e]/90 border border-white/10 hidden sm:flex items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer group hover:-translate-y-1 hover:shadow-black/40 ${
           isPlayerExpanded ? "w-[280px] p-2 gap-3" : "w-14 h-14 p-1 gap-0"
         }`}
         title={isPlayerExpanded ? "Click to collapse" : "Click to expand player"}
      >
        
        {/* Album Cover Icon (Slightly larger default state, shrinks slightly when expanded to fit nicely) */}
        <div className={`rounded-full overflow-hidden shadow-md relative shrink-0 bg-black transition-all duration-300 ${isPlayerExpanded ? "w-10 h-10" : "w-12 h-12"}`}>
          
          {/* The actual native HTML5 audio element */}
          <audio
            ref={playerRef}
            src={currentStream.url}
            loop={false}
            onEnded={nextSong}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="hidden"
          />

          <img 
            src={currentStream.cover} 
            alt="Album Cover"
            className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300 ${isPlayerExpanded ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
          />
          {/* Overlay play/pause icon when collapsed */}
          {!isPlayerExpanded && (
             <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isPlaying ? <Pause size={18} color="white" fill="white" /> : <Play size={18} color="white" fill="white" className="ml-1" />}
             </div>
          )}
        </div>

        {/* Expanded Controls Container (fade in/out and resize width) */}
        <div className={`flex items-center justify-between overflow-hidden transition-all duration-300 ${isPlayerExpanded ? "w-full opacity-100 pr-1" : "w-0 opacity-0"}`}>
           
           {/* Track Info */}
           <div className="flex flex-col justify-center px-1 w-20 shrink-0">
             <h3 className="text-white font-semibold text-[11px] leading-tight truncate">{currentStream.title}</h3>
             <p className="text-white/50 text-[9px] mt-px truncate">{currentStream.subtitle}</p>
           </div>

           {/* Playback Controls */}
           <div className="flex items-center gap-2 shrink-0">
             <button onClick={prevSong} className="text-white/70 hover:text-white transition-colors active:scale-95 p-1">
                <SkipBack size={14} fill="currentColor" />
             </button>
             
             <button 
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-md"
             >
                {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
             </button>

             <button onClick={nextSong} className="text-white/70 hover:text-white transition-colors active:scale-95 p-1">
                <SkipForward size={14} fill="currentColor" />
             </button>
           </div>

           {/* Volume Toggle */}
           <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors shrink-0 ml-1">
             {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
           </button>
        </div>

      </div>
      
      {/* Mobile-friendly Audio Toggle */}
      <div className="w-full max-w-md mt-10 sm:hidden px-6 pb-6">
         <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-full bg-[#1c1c1e] text-white p-4 rounded-2xl flex items-center justify-between border border-white/10 shadow-lg active:scale-95 transition-transform"
         >
            <div className="flex items-center gap-3">
               <img src={currentStream.cover} alt="Lofi" className="w-12 h-12 rounded-lg object-cover" />
               <div className="text-left overflow-hidden max-w-[150px]">
                  <h4 className="font-semibold text-sm truncate">{currentStream.title}</h4>
                  <p className="text-xs text-white/60 truncate">{currentStream.subtitle}</p>
               </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
               {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </div>
         </button>
      </div>

    </div>
  );
}
