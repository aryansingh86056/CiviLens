import { useState, ChangeEvent, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  MapPin, 
  Sparkles, 
  Send, 
  Loader2, 
  Compass, 
  ArrowLeft, 
  CheckCircle,
  AlignLeft,
  LayoutGrid,
  Home,
  CircleMinus,
  Building,
  Trash2,
  HelpCircle,
  UploadCloud,
  ChevronLeft,
  Shield,
  X,
  AlertTriangle
} from 'lucide-react';

export default function ReportIssuePage() {
  const { addIssue, theme } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Roads & Sidewalks');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);

  // Loading/Simulated UI states
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  // Real multi-stage AI check states
  const [imgStatus, setImgStatus] = useState<'pending' | 'loading' | 'success' | 'failed'>('pending');
  const [locStatus, setLocStatus] = useState<'pending' | 'loading' | 'success' | 'failed'>('pending');
  const [matchStatus, setMatchStatus] = useState<'pending' | 'loading' | 'success' | 'failed'>('pending');
  const [validationError, setValidationError] = useState<string | null>(null);

  const categoriesList = [
    { name: 'Roads & Sidewalks', icon: Home },
    { name: 'Water & Pipelines', icon: CircleMinus },
    { name: 'Infrastructure', icon: Building },
    { name: 'Sanitation', icon: Trash2 },
    { name: 'Custom / Other', icon: HelpCircle },
  ];

  const isLight = theme === 'light';

  // Real GPS Geolocation with reverse-geocoding
  const handleUseGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser. Using fallback address.");
      setLocation("Connaught Place, New Delhi, Delhi 110001");
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode via OpenStreetMap's free Nominatim API with an explicit English language header
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'CiviLensCivicIssueReportingApp/1.0'
              }
            }
          );
          
          if (!response.ok) {
            throw new Error("Geocoding service error");
          }
          
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            const road = addr.road || addr.suburb || addr.neighbourhood || '';
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
            const state = addr.state || '';
            const postcode = addr.postcode || '';
            
            // Build a nicely formatted and professional location address string
            const parts = [];
            if (road) parts.push(road);
            if (city) parts.push(city);
            if (state) parts.push(state);
            if (postcode) parts.push(postcode);
            
            const formattedLocation = parts.join(', ');
            if (formattedLocation) {
              setLocation(formattedLocation);
            } else {
              setLocation(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
            }
          } else {
            setLocation(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          setGpsError("Address translation failed. Fallback loaded.");
          setLocation("Connaught Place, New Delhi, Delhi 110001");
        } finally {
          setIsGpsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGpsError("Using default location due to browser permission / offline status.");
        setLocation("Connaught Place, New Delhi, Delhi 110001");
        setIsGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // AI enhancement
  const handleEnhanceWithAi = async () => {
    if (!description.trim()) {
      alert('Please enter a basic description first to enhance!');
      return;
    }
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!response.ok) {
        throw new Error('Failed to enhance description with AI');
      }
      const data = await response.json();
      if (data.enhanced) {
        setDescription(data.enhanced);
      }
    } catch (err: any) {
      alert(err.message || 'Error enhancing description');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle file select
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoName(file.name);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !description.trim()) {
      alert('Please fill out all fields before submitting.');
      return;
    }

    if (!photoData) {
      alert('Please upload a photo of the issue to allow AI verification.');
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setImgStatus('loading');
    setLocStatus('pending');
    setMatchStatus('pending');

    try {
      // CHECK 1: Image Verification
      const imgRes = await fetch('/api/ai/validate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photoData }),
      });
      if (!imgRes.ok) throw new Error('Image verification request failed');
      const imgData = await imgRes.json();
      if (!imgData.valid) {
        setImgStatus('failed');
        setValidationError(`Invalid Image: ${imgData.reason}`);
        return;
      }
      setImgStatus('success');

      // CHECK 2: Civic Issue Details & Location Verification
      setLocStatus('loading');
      const locRes = await fetch('/api/ai/validate/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location }),
      });
      if (!locRes.ok) throw new Error('Civic issue validation request failed');
      const locData = await locRes.json();
      if (!locData.valid) {
        setLocStatus('failed');
        setValidationError(`Details Error: ${locData.reason}`);
        return;
      }
      setLocStatus('success');

      // CHECK 3: Description-Image Match
      setMatchStatus('loading');
      const matchRes = await fetch('/api/ai/validate/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photoData, description }),
      });
      if (!matchRes.ok) throw new Error('Description-image matching request failed');
      const matchData = await matchRes.json();
      if (!matchData.valid) {
        setMatchStatus('failed');
        setValidationError(`Mismatch: ${matchData.reason}`);
        return;
      }
      setMatchStatus('success');

      // Choose random color theme for issue visual preview fallback
      const gradients = [
        'from-amber-600/40 to-amber-900/40',
        'from-blue-600/40 to-blue-900/40',
        'from-emerald-600/40 to-emerald-900/40',
        'from-purple-600/40 to-purple-900/40',
      ];
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

      await addIssue({
        title,
        category,
        location,
        description,
        imageUrl: photoData || undefined,
        imageColor: photoData ? undefined : randomGradient,
      });
      setIsValidating(false);
      navigate('/dashboard');

    } catch (err: any) {
      setImgStatus('failed');
      setValidationError(err.message || 'Verification error');
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Container simulating a phone screen for the precise Instagram/Mockup vibe */}
      <div className={`border rounded-[32px] overflow-hidden relative shadow-2xl transition-colors duration-250 ${
        isLight ? 'bg-white border-slate-200/80' : 'bg-[#0a0a0c] border-zinc-900/60'
      }`}>
        
        {/* Header Row */}
        <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
          isLight ? 'border-slate-100 bg-white/95' : 'border-zinc-900/65 bg-[#0a0a0c]/95'
        } backdrop-blur-md`}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-1 font-semibold text-sm cursor-pointer transition-colors ${
              isLight ? 'text-slate-500 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <span className={`text-base font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-zinc-200'}`}>
            Add Report
          </span>

          <div className="w-16"></div> {/* Spacer for perfect centering */}
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
          
          {/* 1. TITLE Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlignLeft className="h-4.5 w-4.5 text-blue-500 stroke-[2.5]" />
              <label className={`text-[10px] font-black font-mono tracking-widest uppercase transition-colors ${
                isLight ? 'text-slate-800' : 'text-zinc-300'
              }`}>
                TITLE
              </label>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken streetlight on Main St."
              className={`w-full border rounded-2xl px-4 py-3.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  : 'bg-[#121214] border-zinc-900 text-zinc-100 placeholder-zinc-600'
              }`}
            />
          </div>

          {/* 2. CATEGORY Section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4.5 w-4.5 text-blue-500 stroke-[2.5]" />
              <label className={`text-[10px] font-black font-mono tracking-widest uppercase transition-colors ${
                isLight ? 'text-slate-800' : 'text-zinc-300'
              }`}>
                CATEGORY
              </label>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categoriesList.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/50 text-blue-600 border-blue-500 dark:bg-blue-950/20 dark:border-blue-500 dark:text-blue-400 font-bold'
                        : isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                          : 'bg-[#121214] border-zinc-900 hover:border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CatIcon className={`h-4 w-4 ${isSelected ? 'text-blue-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. UPLOAD IMAGE Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Camera className="h-4.5 w-4.5 text-blue-500 stroke-[2.5]" />
              <label className={`text-[10px] font-black font-mono tracking-widest uppercase transition-colors ${
                isLight ? 'text-slate-800' : 'text-zinc-300'
              }`}>
                UPLOAD IMAGE
              </label>
            </div>
            
            {photoData ? (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-blue-500/20 bg-black">
                <img src={photoData} alt="Evidence" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoName(null);
                    setPhotoData(null);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white cursor-pointer transition-colors"
                  title="Remove Photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center group cursor-pointer transition-all ${
                  isLight
                    ? 'border-slate-200/80 hover:border-blue-400 bg-slate-50/40 hover:bg-blue-50/10'
                    : 'border-zinc-900/85 hover:border-blue-500 bg-[#121214]/30 hover:bg-blue-950/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <UploadCloud className={`h-10 w-10 mb-2 transition-colors ${
                  isLight ? 'text-slate-300 group-hover:text-blue-500' : 'text-zinc-600 group-hover:text-blue-400'
                }`} />
                
                <div className="space-y-1">
                  <p className={`text-xs font-bold transition-colors ${
                    isLight ? 'text-slate-700 group-hover:text-blue-600' : 'text-zinc-300 group-hover:text-blue-400'
                  }`}>
                    Tap to upload or take a photo with your camera
                  </p>
                  <p className="text-[10px] text-slate-400/80 dark:text-zinc-500 font-mono">
                    Supports JPG/PNG files, drag & drop, or direct camera captures
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 4. LOCATION Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-blue-500 stroke-[2.5]" />
              <label className={`text-[10px] font-black font-mono tracking-widest uppercase transition-colors ${
                isLight ? 'text-slate-800' : 'text-zinc-300'
              }`}>
                LOCATION
              </label>
            </div>
            
            <div className="flex gap-2.5 items-center">
              <input
                type="text"
                required
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (gpsError) setGpsError(null);
                }}
                placeholder="Enter address or area..."
                className={`flex-1 border rounded-2xl px-4 py-3.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-[#121214] border-zinc-900 text-zinc-100 placeholder-zinc-600'
                }`}
              />
              
              <button
                type="button"
                onClick={handleUseGps}
                disabled={isGpsLoading}
                className="px-4 py-3.5 rounded-2xl border border-blue-500 text-blue-600 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-950/20 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900/30 flex items-center gap-1.5 font-bold text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50 h-11"
              >
                {isGpsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Compass className="h-4 w-4" />
                )}
                <span>Use GPS</span>
              </button>
            </div>

            {gpsError && (
              <div className={`mt-1.5 px-3 py-2 rounded-xl text-xs flex items-center gap-2 border font-sans ${
                isLight 
                  ? 'bg-amber-50/60 border-amber-100 text-amber-700' 
                  : 'bg-amber-950/15 border-amber-900/30 text-amber-300'
              }`}>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}
          </div>

          {/* 5. DESCRIPTION Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-blue-500 stroke-[2.5]" />
                <label className={`text-[10px] font-black font-mono tracking-widest uppercase transition-colors ${
                  isLight ? 'text-slate-800' : 'text-zinc-300'
                }`}>
                  DESCRIPTION
                </label>
              </div>
              
              <button
                type="button"
                onClick={handleEnhanceWithAi}
                disabled={isEnhancing}
                className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 flex items-center gap-1.5 transition-colors uppercase tracking-wider font-mono cursor-pointer"
              >
                {isEnhancing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>Enhance with AI</span>
              </button>
            </div>
            
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly — what, where, and how severe..."
              className={`w-full border rounded-2xl px-4 py-3.5 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  : 'bg-[#121214] border-zinc-900 text-zinc-100 placeholder-zinc-600'
              }`}
            ></textarea>
          </div>

          {/* Submit Action Block */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/15 cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <Shield className="h-4.5 w-4.5" />
              <span>Verify and Report</span>
            </button>
          </div>

        </form>
      </div>

      {/* AI Validation Overlay Screen */}
      <AnimatePresence>
        {isValidating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 animate-pulse"></div>

              {/* Icon & Glow */}
              <div className={`relative mx-auto w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-300 ${
                validationError 
                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                  : 'bg-blue-950/40 border-blue-500/20 text-blue-400'
              }`}>
                {validationError ? (
                  <AlertTriangle className="h-8 w-8 text-rose-400 animate-pulse" />
                ) : (
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {validationError ? "Verification Failed" : "Validating with AI..."}
                </h3>
                <p className="text-xs text-slate-400">
                  {validationError 
                    ? "CiviLens AI identified an issue with your report. Please check the details below." 
                    : "Please stand by. CiviLens AI is verifying your civic hazard report against our regional database."}
                </p>
              </div>

              {/* Status checklist steps */}
              <div className="space-y-3.5 text-left max-w-xs mx-auto border-t border-slate-800/80 pt-5">
                {/* Step 1: Image Authenticity */}
                <div className="flex items-center gap-3">
                  {imgStatus === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                  {imgStatus === 'failed' && <X className="h-4 w-4 text-rose-500" />}
                  {imgStatus === 'loading' && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
                  {imgStatus === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-slate-800"></div>}
                  <span className={`text-xs ${imgStatus === 'success' ? 'text-slate-200 font-medium' : imgStatus === 'failed' ? 'text-rose-400 font-medium' : imgStatus === 'loading' ? 'text-blue-400 font-medium animate-pulse' : 'text-slate-600'}`}>
                    {imgStatus === 'success' ? "Verifying Uploaded Image ✓" : imgStatus === 'failed' ? "Verifying Uploaded Image ✗" : "Verifying Uploaded Image..."}
                  </span>
                </div>

                {/* Step 2: Reads Title and Description */}
                <div className="flex items-center gap-3">
                  {locStatus === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                  {locStatus === 'failed' && <X className="h-4 w-4 text-rose-500" />}
                  {locStatus === 'loading' && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
                  {locStatus === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-slate-800"></div>}
                  <span className={`text-xs ${locStatus === 'success' ? 'text-slate-200 font-medium' : locStatus === 'failed' ? 'text-rose-400 font-medium' : locStatus === 'loading' ? 'text-blue-400 font-medium animate-pulse' : 'text-slate-600'}`}>
                    {locStatus === 'success' ? "Analysing Title and description ✓" : locStatus === 'failed' ? "Analysing Title and description ✗" : "Analysing Title and description..."}
                  </span>
                </div>

                {/* Step 3: Verify Both Image and Description */}
                <div className="flex items-center gap-3">
                  {matchStatus === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                  {matchStatus === 'failed' && <X className="h-4 w-4 text-rose-500" />}
                  {matchStatus === 'loading' && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
                  {matchStatus === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-slate-800"></div>}
                  <span className={`text-xs ${matchStatus === 'success' ? 'text-slate-200 font-medium' : matchStatus === 'failed' ? 'text-rose-400 font-medium' : matchStatus === 'loading' ? 'text-blue-400 font-medium animate-pulse' : 'text-slate-600'}`}>
                    {matchStatus === 'success' ? "Report Verified ✓" : matchStatus === 'failed' ? "Finalising Verification ✗" : "Finalising Verification..."}
                  </span>
                </div>

                {/* Error Banner */}
                {validationError && (
                  <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-[11px] text-rose-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>

              {/* Close Button when validation fails */}
              {validationError && (
                <button
                  type="button"
                  onClick={() => setIsValidating(false)}
                  className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-slate-700/80 flex items-center justify-center gap-1.5"
                >
                  <X className="h-4 w-4 text-slate-400" />
                  <span>Close & Edit Report</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
