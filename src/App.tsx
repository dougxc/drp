import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bike, Flag, Trophy, RefreshCw, ChevronRight, Globe, Volume2, VolumeX } from 'lucide-react';
import data from './data.json';
import auData from './au_data.json';
import fullPathData from './full_path.json';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Doctor P Icon
const doctorPIcon = new L.DivIcon({
  html: `<div class="w-15 h-15 rounded-full border-2 border-white shadow-2xl overflow-hidden bg-black flex items-center justify-center">
           <img src="doctor_p_small.png" className="w-full h-full object-cover object-center scale-110" />
         </div>`,
  className: '',
  iconSize: [60, 60],
  iconAnchor: [30, 30],
});

// Kilometer Waypoint Icon
const kmIcon = (km: number) => new L.DivIcon({
  html: `<div class="w-10 h-10 rounded-full border-2 border-red-600 bg-white flex items-center justify-center shadow-lg font-black text-red-600 text-xs">
           ${km}
         </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

type Language = 'de' | 'en' | 'es';

const uiTranslations: Record<Language, any> = {
  de: {
    startTitle: "Hoi Doctor P!",
    startCongrat: "Herzliche Gratulation zum 50. Geburtstag!",
    startDesc: "Bist du bereit für den Madrid Rock'n'Roll Kurs? Beweise deine Spanisch-Kenntnisse (und ein bisschen Aussie-Wissen), um ans Ziel zu kommen!",
    startButton: "Lauf Starten",
    finishedTitle: "Gratulation, Doctor P!",
    finishedDesc: "Du hast den Madrid Kurs geschafft und bist ein wahrer Kenner von Spanien (und Australien)!",
    questionsNeeded: "Benötigte Fragen",
    playAgain: "Nochmals spielen",
    giftDesc: "\"Dein Geschenk wartet: Ein entspannter Lauf um den Pfäffikersee, bei dem wir über die Vorzüge von KI-basierten Geburtstags-Apps diskutieren ;-)\"",
    tourQuestions: "Kurs-Fragen",
    aussieBonus: "Aussie Bonus!",
    unmute: "Stummschaltung aufheben",
    mute: "Stummschalten",
    gday: "G'day Doctor P!",
    tourTitle: "Doctor P's Madrid Run",
    currentLocation: "Aktueller Standort",
    progress: "Fortschritt",
    questions: "Fragen",
    correct: "Richtig! ✅",
    bonus: "Crikey! +2 Felder! 🇦🇺🚀",
    back: "Oje! Zurück... ↩️",
    hoppla: "Hoppla! ❌",
    onTheWay: "Unterwegs zu..."
  },
  en: {
    startTitle: "Hi Doctor P!",
    startCongrat: "Happy 50th Birthday!",
    startDesc: "Are you ready for the Madrid Rock'n'Roll course? Prove your Spanish knowledge (and a bit of Aussie wisdom) to reach the goal!",
    startButton: "Start the Run",
    finishedTitle: "Congratulations, Doctor P!",
    finishedDesc: "You've finished the Madrid course and are a true connoisseur of Spain (and Australia)!",
    questionsNeeded: "Questions Needed",
    playAgain: "Play Again",
    giftDesc: "\"Your gift awaits: A relaxing run around Pfäffikersee where we discuss the merits of AI based birthday apps ;-)\"",
    tourQuestions: "Course Questions",
    aussieBonus: "Aussie Bonus!",
    unmute: "Unmute",
    mute: "Mute",
    gday: "G'day Doctor P!",
    tourTitle: "Doctor P's Madrid Run",
    currentLocation: "Current Location",
    progress: "Progress",
    questions: "Questions",
    correct: "Correct! ✅",
    bonus: "Crikey! +2 spaces! 🇦🇺🚀",
    back: "Ouch! Going back... ↩️",
    hoppla: "Hoppla! ❌",
    onTheWay: "On the way to..."
  },
  es: {
    startTitle: "¡Hola Doctor P!",
    startCongrat: "¡Feliz 50 cumpleaños!",
    startDesc: "¿Estás listo para el recorrido del Madrid Rock'n'Roll? ¡Demuestra tus conocimientos sobre España (y un poco de sabiduría australiana) para llegar a la meta!",
    startButton: "Empezar la carrera",
    finishedTitle: "¡Felicidades, Doctor P!",
    finishedDesc: "¡Has terminado el recorrido de Madrid y eres un verdadero experto en España (y Australia)!",
    questionsNeeded: "Preguntas necesarias",
    playAgain: "Jugar de nuevo",
    giftDesc: "\"Tu regalo te espera: Una carrera relajante alrededor del Pfäffikersee donde discutiremos los méritos de las aplicaciones de cumpleaños basadas en IA ;-)\"",
    tourQuestions: "Preguntas del recorrido",
    aussieBonus: "¡Bonus Aussie!",
    unmute: "Activar sonido",
    mute: "Silenciar",
    gday: "¡G'day Doctor P!",
    tourTitle: "La carrera de Doctor P en Madrid",
    currentLocation: "Ubicación actual",
    progress: "Progreso",
    questions: "Preguntas",
    correct: "¡Correcto! ✅",
    bonus: "¡Crikey! ¡+2 casillas! 🇦🇺🚀",
    back: "¡Ay! Retrocedes... ↩️",
    hoppla: "¡Hoppla! ❌",
    onTheWay: "De camino a..."
  }
};

const getBrowserLanguage = (): Language => {
  const browserLang = navigator.language.split('-')[0];
  const supportedLangs: Language[] = ['es', 'en', 'de'];
  return supportedLangs.includes(browserLang as Language) ? (browserLang as Language) : 'de';
};

// Animated Marker Component that also scrolls the map
function AnimatedMarker({ position, icon, children }: { position: [number, number], icon: any, children?: React.ReactNode }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: false });
  }, [position, map]);

  return (
    <Marker position={position} icon={icon}>
      {children}
    </Marker>
  );
}

// Component to set initial map bounds to first two points
function InitialMapBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const hasSetRef = useRef(false);

  useEffect(() => {
    if (!hasSetRef.current && points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], animate: false });
      hasSetRef.current = true;
    }
  }, [map, points]);

  return null;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(getBrowserLanguage);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
  const [shuffledSpain, setShuffledSpain] = useState(() => shuffleArray(data.questions));
  const [shuffledAu, setShuffledAu] = useState(() => shuffleArray(auData.questions));
  const [spainIdx, setSpainIdx] = useState(0);
  const [auIdx, setAuIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [targetStageIdx, setTargetStageIdx] = useState(0);
  const [currentPathIdx, setCurrentPathIdx] = useState(0);
  const [consecutiveWrongs, setConsecutiveWrongs] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | 'back' | 'bonus' | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const t = uiTranslations[language];

  const routePoints = data.route.map((p, i) => ({
    ...p,
    lat: (fullPathData.fullPath as [number, number][])[fullPathData.stageIndices[i]][0],
    lng: (fullPathData.fullPath as [number, number][])[fullPathData.stageIndices[i]][1],
  }));

  const isMovingRef = useRef(false);
  const bikingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Biking sound effect
  useEffect(() => {
    const targetPathIdx = fullPathData.stageIndices[targetStageIdx];
    const isMoving = currentPathIdx !== targetPathIdx;

    if (isMoving && !bikingAudioRef.current) {
      bikingAudioRef.current = new Audio('sounds/biking.mp3');
      bikingAudioRef.current.loop = true;
    }

    if (isMoving && !isMuted) {
      bikingAudioRef.current?.play().catch(e => console.error("Biking sound failed", e));
    } else {
      if (bikingAudioRef.current) {
        bikingAudioRef.current.pause();
        bikingAudioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (!isMoving && bikingAudioRef.current) {
        bikingAudioRef.current.pause();
      }
    };
  }, [currentPathIdx, targetStageIdx, isMuted]);

  // Effect to move currentPathIdx towards stageIndices[targetStageIdx]
  useEffect(() => {
    const targetPathIdx = fullPathData.stageIndices[targetStageIdx];
    if (currentPathIdx === targetPathIdx) {
      const wasMoving = isMovingRef.current;
      isMovingRef.current = false;
      setCurrentStageIdx(targetStageIdx);
      
      if (wasMoving && showFeedback) {
        setTimeout(() => {
          const answeredAu = (attempts > 0 && (attempts + 1) % 4 === 0);
          setShowFeedback(null);
          setSelectedOption(null);
          if (answeredAu) setAuIdx(i => i + 1);
          else setSpainIdx(i => i + 1);
          setAttempts(a => a + 1);
        }, 1000);
      }

      if (targetStageIdx === routePoints.length - 1 && gameState === 'playing') {
        setGameState('finished');
      }
      return;
    }

    const direction = targetPathIdx > currentPathIdx ? 1 : -1;
    
    // Slow down for the "struggling" effect
    // We want to cover the distance between stages in about 4 seconds
    const currentTargetStageIdx = direction > 0 
      ? routePoints.findIndex((_, i) => fullPathData.stageIndices[i] > currentPathIdx)
      : routePoints.findLastIndex((_, i) => fullPathData.stageIndices[i] < currentPathIdx);
    
    const prevStagePathIdx = fullPathData.stageIndices[Math.max(0, currentTargetStageIdx - 1)];
    const nextStagePathIdx = fullPathData.stageIndices[currentTargetStageIdx];
    const pointsInLeg = Math.abs(nextStagePathIdx - prevStagePathIdx);
    
    const baseInterval = 4000 / (pointsInLeg || 1);
    const interval = Math.max(baseInterval, 1); // Don't go faster than 1ms per point

    const timer = setTimeout(() => {
      setCurrentPathIdx(prev => prev + direction);
    }, interval);
    
    return () => clearTimeout(timer);
  }, [currentPathIdx, targetStageIdx, gameState, routePoints, fullPathData.stageIndices]);

  // Interleaving logic: 3 Swiss, 1 Australian
  const isAuQuestion = (attempts > 0 && (attempts + 1) % 4 === 0);
  const currentQuestion: any = isAuQuestion 
    ? shuffledAu[auIdx % shuffledAu.length] 
    : shuffledSpain[spainIdx % shuffledSpain.length];

  const currentCoords: [number, number] = (fullPathData.fullPath as [number, number][])[currentPathIdx];
  const polylinePoints = fullPathData.fullPath as [number, number][];

  const handleAnswer = (optionIdx: number) => {
    if (showFeedback || gameState !== 'playing' || currentPathIdx !== fullPathData.stageIndices[targetStageIdx]) return;
    
    setSelectedOption(optionIdx);
    const isCorrect = optionIdx === currentQuestion.answer;
    
    // Sound Effects Logic
    if (!isMuted) {
      if (!isAuQuestion) {
        if (isCorrect) {
          const audio = new Audio('sounds/SBB Chime.m4a');
          audio.play().catch(e => console.error("Audio play failed", e));
        } else {
          const audio = new Audio('sounds/oh-yeah.mp3');
          audio.play().catch(e => console.error("Audio play failed", e));
        }
      } else {
        if (isCorrect) {
          const audio = new Audio('sounds/good-boy.mp3');
          audio.play().catch(e => console.error("Audio play failed", e));
          const auAudio = new Audio('sounds/down-under.mp3');
          auAudio.play().catch(e => console.error("Audio play failed", e));
        } else {
          const audio = new Audio('sounds/sorry-mate.mp3');
          audio.play().catch(e => console.error("Audio play failed", e));
        }
      }
    }

    let nextFeedback: 'correct' | 'incorrect' | 'back' | 'bonus' | null = null;
    if (isAuQuestion) {
      nextFeedback = isCorrect ? 'bonus' : 'incorrect';
    } else {
      if (isCorrect) {
        nextFeedback = 'correct';
        setConsecutiveWrongs(0);
      } else {
        const nextWrongs = consecutiveWrongs + 1;
        if (nextWrongs >= 2) {
          nextFeedback = 'back';
          setConsecutiveWrongs(0);
        } else {
          nextFeedback = 'incorrect';
          setConsecutiveWrongs(nextWrongs);
        }
      }
    }
    setShowFeedback(nextFeedback);

    // Trigger movement immediately with the sound
    if (isCorrect) {
      const moveAmount = isAuQuestion ? 2 : 1;
      isMovingRef.current = true;
      setTargetStageIdx(prev => Math.min(prev + moveAmount, routePoints.length - 1));
    } else if (nextFeedback === 'back') {
      isMovingRef.current = true;
      setTargetStageIdx(prev => Math.max(prev - 1, 0));
    } else {
      // Wrong answer, stay put. 
      // Delay clearing feedback and transitioning.
      const answeredAu = isAuQuestion;
      setTimeout(() => {
        setShowFeedback(null);
        setSelectedOption(null);
        if (answeredAu) setAuIdx(i => i + 1);
        else setSpainIdx(i => i + 1);
        setAttempts(a => a + 1);
      }, 4000); // 4 seconds of feedback
    }
  };

  const resetGame = () => {
    setShuffledSpain(shuffleArray(data.questions));
    setShuffledAu(shuffleArray(auData.questions));
    setSpainIdx(0);
    setAuIdx(0);
    setAttempts(0);
    setCurrentStageIdx(0);
    setTargetStageIdx(0);
    setCurrentPathIdx(0);
    setConsecutiveWrongs(0);
    setGameState('playing');
  };

  const getLocalizedQuestion = () => {
    return currentQuestion.question[language] || currentQuestion.question['en'];
  };

  const getLocalizedOptions = () => {
    return currentQuestion.options[language] || currentQuestion.options['en'];
  };

  if (gameState === 'start') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-500 to-red-700">
        <div className="spain-card max-w-lg w-full p-8 text-center space-y-6 relative">
          <div className="absolute top-4 right-4 flex bg-gray-100 rounded-full p-1 flex-wrap justify-end gap-1">
            {(['es', 'en', 'de'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${language === l ? 'bg-white shadow-sm text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-red-100 shadow-xl overflow-hidden bg-red-600">
              <img src="doctor_p.png" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900 leading-tight">
            {t.startTitle}<br />
            <span className="text-red-600">{t.startCongrat.split('!')[0]}!</span><br />
            {t.startCongrat.split('!')[1]}
          </h1>
          <p className="text-lg text-gray-600">
            {t.startDesc}
          </p>
          <button 
            onClick={() => setGameState('playing')}
            className="btn-spain w-full text-xl py-4 flex items-center justify-center gap-2 group"
          >
            {t.startButton} <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-500 to-red-700">
        <div className="spain-card max-w-lg w-full p-8 text-center space-y-8">
          <div className="flex justify-center">
            <div className="bg-yellow-100 p-6 rounded-full relative">
              <Trophy className="w-16 h-16 text-yellow-600" />
              <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                ZIEL!
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900">
            {t.finishedTitle}
          </h1>
          <p className="text-xl text-gray-600">
            {t.finishedDesc}
          </p>
          <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-2">{t.questionsNeeded}</p>
            <p className="text-5xl font-black text-red-600">{attempts}</p>
          </div>
          <div className="space-y-4">
            <p className="italic text-gray-600">
              {t.giftDesc}
            </p>
            <button 
              onClick={resetGame}
              className="flex items-center justify-center gap-2 mx-auto text-red-600 font-bold hover:underline"
            >
              <RefreshCw className="w-4 h-4" /> {t.playAgain}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row md:h-screen md:overflow-hidden landscape:flex-row landscape:h-screen landscape:overflow-hidden">
      {/* Quiz Section */}
      <div className="w-full h-[60vh] md:h-auto md:w-1/3 landscape:w-1/3 landscape:h-auto p-6 flex flex-col justify-between overflow-y-auto bg-white shadow-2xl z-10">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {isAuQuestion ? <Globe className="text-blue-600 w-6 h-6" /> : <Flag className="text-red-600 w-6 h-6" />}
              <span className="font-bold text-gray-500 uppercase tracking-widest text-sm">
                {isAuQuestion ? t.aussieBonus : t.tourQuestions}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                title={isMuted ? t.unmute : t.mute}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="flex bg-gray-100 rounded-full p-1 flex-wrap justify-end gap-1">
                {(['es', 'en', 'de'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${language === l ? 'bg-white shadow-sm text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className={`px-3 py-1 rounded-full font-bold text-sm ${isAuQuestion ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                {isAuQuestion ? t.gday : t.tourTitle}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {currentPathIdx === fullPathData.stageIndices[targetStageIdx] || !!showFeedback ? (
              <>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                  {getLocalizedQuestion()}
                </h2>
                
                <div className="flex flex-col gap-2">
                  {getLocalizedOptions().map((option: string, idx: number) => (
                    <button
                      key={idx}
                      disabled={!!showFeedback}
                      onClick={() => handleAnswer(idx)}
                      className={`btn-option ${
                        selectedOption === idx 
                          ? (showFeedback === 'correct' || showFeedback === 'bonus' ? 'correct scale-102 border-green-500 bg-green-50 shadow-md' : 'incorrect scale-102 border-red-500 bg-red-50 shadow-md') 
                          : (showFeedback && showFeedback !== 'correct' && showFeedback !== 'bonus' && idx === currentQuestion.answer ? 'correct border-green-500' : '')
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:border-red-600 group-hover:text-red-600">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 font-semibold text-gray-700 text-sm">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 space-y-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 animate-pulse">
                <Bike className="w-16 h-16 text-red-600 animate-bounce" />
                <div className="text-center">
                  <p className="text-xl font-black text-gray-900 uppercase tracking-wider">
                    {t.onTheWay}
                  </p>
                  <p className="text-sm text-gray-400 font-bold uppercase mt-2">
                    {routePoints[targetStageIdx].name}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Location Image */}
          <div className="mt-6 flex-1 min-h-0">
            <div className="spain-card overflow-hidden h-full border-t-0 border-b-8 border-spain-red shadow-lg group">
              <img 
                src={`images/waypoint-${routePoints[currentStageIdx].km}.jpg`} 
                alt={routePoints[currentStageIdx].name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  {t.currentLocation}: {routePoints[currentStageIdx].name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">{t.progress}</p>
              <p className="text-sm font-black text-gray-900 uppercase">{routePoints[currentStageIdx].name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">{t.questions}</p>
              <p className="text-sm font-black text-red-600 uppercase">{attempts}</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-red-600 h-full transition-all duration-1000 ease-out"
              style={{ width: `${(currentPathIdx / (polylinePoints.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="w-full h-[40vh] md:h-auto md:flex-1 landscape:flex-1 landscape:h-auto relative z-0">
        <MapContainer 
          center={currentCoords} 
          zoom={12} 
          className="w-full h-full"
          scrollWheelZoom={true}
        >
          <InitialMapBounds points={routePoints.slice(0, 2).map(p => [p.lat, p.lng])} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <Polyline 
            positions={polylinePoints} 
            color="#EF4444" 
            weight={4} 
            opacity={0.6}
            dashArray="10, 10"
          />

          {/* Waypoint Markers */}
          {routePoints.map((point, idx) => {
            return (
              <Marker 
                key={idx} 
                position={[point.lat, point.lng]} 
                icon={kmIcon(point.km as number)}
                eventHandlers={{
                  click: (e) => {
                    if (e.originalEvent.shiftKey) {
                      const newPathIdx = fullPathData.stageIndices[idx];
                      setCurrentPathIdx(newPathIdx);
                      setTargetStageIdx(idx);
                      setCurrentStageIdx(idx);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-center font-bold">
                    📍 {point.name} ({point.km} km)
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <AnimatedMarker 
            position={currentCoords} 
            icon={doctorPIcon} 
          >
            <Popup>
              <div className="text-center font-bold">
                Doctor P auf der Tour!<br />
                📍 {routePoints[currentStageIdx].name}
              </div>
            </Popup>
          </AnimatedMarker>
        </MapContainer>

        {/* Feedback Overlay */}
        {showFeedback && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none">
             <div className={`
               px-8 py-4 rounded-full shadow-2xl text-white font-black text-3xl animate-bounce flex items-center gap-4
               ${(showFeedback === 'correct' || showFeedback === 'bonus') ? 'bg-green-500' : (showFeedback === 'back' ? 'bg-orange-600' : 'bg-red-600')}
             `}>
               {showFeedback === 'correct' ? t.correct : (showFeedback === 'bonus' ? t.bonus : (showFeedback === 'back' ? t.back : t.hoppla))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
