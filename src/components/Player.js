import { useRef, useState, useEffect, useCallback } from 'react';

let globalPlayer = null;

function Player({ token, _isPlaying, onPlaybackStateChange, setPlayerControls }) {
  const [isReady, setIsReady] = useState(false);
  const playerInitializedRef = useRef(false);
  const [activeDevice, setActiveDevice] = useState(null);
  const playlistId = '7FBYKQMPaOei5Fx2WcnhkU';
  const [tempo, setTempo] = useState(null);
  const lastFetchedTrackId = useRef(null);
  const audioAnalysisCache = useRef({});
  const fetchingTrackId = useRef(null);

  const fetchAudioAnalysis = useCallback(async (trackId) => {
    if (trackId === lastFetchedTrackId.current || fetchingTrackId.current === trackId) {
      return;
    }

    if (audioAnalysisCache.current[trackId]) {
      setTempo(audioAnalysisCache.current[trackId]);
      lastFetchedTrackId.current = trackId;
      return;
    }

    fetchingTrackId.current = trackId;

    try {
      const response = await fetch(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // if (response.status === 429) {
      //   console.log('Rate limit hit, retrying after delay');
      //   const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
      //   setTimeout(() => fetchAudioAnalysis(trackId), retryAfter * 1000);
      //   return;
      // }

      const data = await response.json();
      if (data && data.track && typeof data.track.tempo === 'number') {
        setTempo(data.track.tempo);
        audioAnalysisCache.current[trackId] = data.track.tempo;
        lastFetchedTrackId.current = trackId;
      } else {
        console.error('Invalid audio analysis data:', data);
        setTempo(null);
      }
    } catch (error) {
      console.error('Error fetching audio analysis:', error);
      setTempo(null);
    } finally {
      fetchingTrackId.current = null;
    }
  }, [token]);

  const initializePlayer = useCallback(() => {
    if (playerInitializedRef.current || !token || globalPlayer) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      if (globalPlayer) return;

      globalPlayer = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      globalPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setActiveDevice(device_id);
        playerInitializedRef.current = true;
        setIsReady(true);
      });

      globalPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setActiveDevice(null);
      });

      globalPlayer.addListener('player_state_changed', (state) => {
        if (!state) {
          console.log('Player State Changed: No state available');
          return;
        }

        console.log('Player State Changed:', state);
        console.log('Current Track:', state.track_window.current_track);
        onPlaybackStateChange({
          isPlaying: !state.paused,
          track: state.track_window.current_track
        });
      });

      globalPlayer.connect().then(success => {
        if (success) {
          console.log('The Web Playback SDK successfully connected to Spotify!');
        } else {
          console.log('Failed to connect to Spotify');
        }
      });
    };
  }, [token, onPlaybackStateChange]);

  useEffect(() => {
    initializePlayer();

    return () => {
      if (globalPlayer) {
        globalPlayer.disconnect();
      }
    };
  }, [initializePlayer]);

  const startPlayback = useCallback(async () => {
    if (!activeDevice) {
      console.log('No active device');
      return;
    }

    try {
      // Set shuffle mode to true
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${activeDevice}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Start playback in shuffle mode
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: `spotify:playlist:${playlistId}`,
        }),
      });
      
      console.log('Playback started in shuffle mode');
      
      // Ensure the player is playing
      globalPlayer.resume().then(() => {
        console.log("Playback ensured");
      }).catch(error => {
        console.error("Error ensuring playback:", error);
      });
    } catch (error) {
      console.error('Error starting playback in shuffle mode:', error);
    }
  }, [activeDevice, token, playlistId]);

  const playerControlsRef = useRef({
    togglePlay: async () => {
      console.log("Toggling play/pause");
      try {
        const state = await globalPlayer.getCurrentState();
        if (!state) {
          console.log('No current state, starting playback');
          await startPlayback();
        } else {
          await globalPlayer.togglePlay();
        }
        const newState = await globalPlayer.getCurrentState();
        if (newState) {
          onPlaybackStateChange({
            isPlaying: !newState.paused,
            track: newState.track_window.current_track
          });
        }
      } catch (error) {
        console.error("Error in play/pause process:", error);
      }
    },
    nextTrack: async () => {
      console.log("Next track triggered");
      try {
        await globalPlayer.nextTrack();
        const state = await globalPlayer.getCurrentState();
        if (state) {
          onPlaybackStateChange({
            isPlaying: !state.paused,
            track: state.track_window.current_track
          });
        }
      } catch (error) {
        console.error("Error changing to next track:", error);
      }
    },
    previousTrack: async () => {
      console.log("Previous track triggered");
      try {
        await globalPlayer.previousTrack();
        const state = await globalPlayer.getCurrentState();
        if (state) {
          onPlaybackStateChange({
            isPlaying: !state.paused,
            track: state.track_window.current_track
          });
        }
      } catch (error) {
        console.error("Error changing to previous track:", error);
      }
    },
    setVolume: async (volume) => {
      console.log("Setting volume to:", volume);
      try {
        await globalPlayer.setVolume(volume);
        console.log("Volume set successfully");
      } catch (error) {
        console.error("Error setting volume:", error);
      }
    },
    getTempo: () => tempo,
  });

  useEffect(() => {
    if (isReady && globalPlayer) {
      console.log("Player ready, setting controls");
      setPlayerControls(playerControlsRef.current);
    }
  }, [isReady, setPlayerControls]);

  useEffect(() => {
    playerControlsRef.current.getTempo = () => tempo;
  }, [tempo]);

  useEffect(() => {
    const handleTrackChange = async () => {
      const state = await globalPlayer.getCurrentState();
      if (state) {
        const currentTrack = state.track_window.current_track;
        if (currentTrack.id !== lastFetchedTrackId.current) {
          fetchAudioAnalysis(currentTrack.id);
        }
        
        // Remove the auto-resume logic
        onPlaybackStateChange({
          isPlaying: !state.paused, // Report actual playing state
          track: currentTrack,
          tempo: audioAnalysisCache.current[currentTrack.id] || null,
        });
      }
    };

    if (globalPlayer) {
      globalPlayer.addListener('player_state_changed', handleTrackChange);
    }

    return () => {
      if (globalPlayer) {
        globalPlayer.removeListener('player_state_changed', handleTrackChange);
      }
    };
  }, [globalPlayer, fetchAudioAnalysis, onPlaybackStateChange]);

  useEffect(() => {
    if (activeDevice) {
      console.log("Transferring playback to web player");
      fetch(`https://api.spotify.com/v1/me/player`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [activeDevice],
          play: false,
        }),
      })
      .then(() => {
        console.log("Playback transferred, enabling shuffle");
        return fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${activeDevice}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      })
      .then(() => {
        console.log("Shuffle enabled, starting playback");
        return fetch(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context_uri: `spotify:playlist:${playlistId}`,
          }),
        });
      })
      .then(() => {
        console.log('Playback transferred, shuffle enabled, and started');
      })
      .catch(error => {
        console.error('Error transferring playback, enabling shuffle, or starting playback:', error);
      });
    }
  }, [activeDevice, token, playlistId]);

  return null; // This component doesn't render anything visible
}

export default Player;