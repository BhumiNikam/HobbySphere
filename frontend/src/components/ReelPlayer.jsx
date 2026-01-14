import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

const ReelPlayer = ({ reel, isActive, onView }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef(null);
  const viewCounted = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().then(() => {
        setIsPlaying(true);
        // Count view after 2 seconds of playback
        setTimeout(() => {
          if (!viewCounted.current) {
            onView(reel._id);
            viewCounted.current = true;
          }
        }, 2000);
      }).catch(err => console.log('Autoplay prevented:', err));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, reel._id, onView]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleVideoClick = () => {
    togglePlayPause();
    setShowControls(true);
    setTimeout(() => setShowControls(false), 2000);
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={reel.video.url}
        loop
        muted={isMuted}
        playsInline
        onClick={handleVideoClick}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {!isPlaying && (
            <div className="bg-black bg-opacity-50 rounded-full p-4">
              <Play size={48} className="text-white" />
            </div>
          )}
        </div>
      )}

      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2 text-white hover:bg-opacity-70 z-10"
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      {/* Video Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent text-white pointer-events-none">
        <div className="flex items-center mb-2">
          <img
            src={reel.author.profileImage || '/default-avatar.png'}
            alt={reel.author.username}
            className="w-10 h-10 rounded-full mr-3 pointer-events-auto cursor-pointer"
          />
          <div>
            <p className="font-semibold">{reel.author.username}</p>
            <p className="text-sm text-gray-300">{reel.author.fullName}</p>
          </div>
        </div>
        {reel.caption && (
          <p className="text-sm mb-1">{reel.caption}</p>
        )}
        {reel.music && (
          <p className="text-xs text-gray-300">
            🎵 {reel.music.name} - {reel.music.artist}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReelPlayer;