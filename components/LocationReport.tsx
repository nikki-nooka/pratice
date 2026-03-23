
import React, { useState } from 'react';
import type { LocationAnalysisResult, Facility } from '../types';
import { findFacilitiesByCoordinates, safeString } from '../services/geminiService';
import { HazardIcon, DiseaseIcon, PrecautionIcon, ChevronDownIcon, SummaryIcon, MapPinIcon, BuildingOfficeIcon, DirectionsIcon, MapIcon, LinkIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

interface LocationReportProps {
  result: LocationAnalysisResult;
  imageUrl: string | null;
  coords: { lat: number; lng: number };
  onFacilitiesFound: (facilities: Omit<Facility, 'distance'>[]) => void;
}

const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; 
    const rlat1 = lat1 * (Math.PI / 180);
    const rlat2 = lat2 * (Math.PI / 180);
    const difflat = rlat2 - rlat1;
    const difflon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(difflat / 2) * Math.sin(difflat / 2) +
        Math.cos(rlat1) * Math.cos(rlat2) *
        Math.sin(difflon / 2) * Math.sin(difflon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-slate-700 bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    <DiseaseIcon className="w-6 h-6 text-amber-500"/>
                    <span className="text-base">{safeString(title)}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-4 text-slate-600 border-t border-slate-200">
                         {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LocationReport: React.FC<LocationReportProps> = ({ result, imageUrl, coords, onFacilitiesFound }) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [findStatus, setFindStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [findError, setFindError] = useState<string | null>(null);

  const handleFindFacilities = async () => {
    if (!coords) return;
    setFindStatus('loading');
    setFacilities([]);
    setFindError(null);
    try {
        const facilitiesFromApi = await findFacilitiesByCoordinates(coords);
        onFacilitiesFound(facilitiesFromApi);

        const nearbyFacilities = facilitiesFromApi
            .map(facility => ({
                ...facility,
                distance: getDistanceInKm(coords.lat, coords.lng, facility.lat, facility.lng)
            }))
            .sort((a, b) => a.distance - b.distance)
            .map(f => ({
                ...f,
                distance: `${f.distance.toFixed(1)} km`
            }));
        
        setFacilities(nearbyFacilities);
        setFindStatus('success');
    } catch (error: any) {
        console.error("Facility finding error:", error);
        setFindError("Could not find facilities. The AI model might be busy or unavailable.");
        setFindStatus('error');
        onFacilitiesFound([]);
    }
  };

  const handleClearFacilities = () => {
      setFindStatus('idle');
      setFacilities([]);
      onFacilitiesFound([]);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
        <div className="space-y-4">
            {imageUrl && <img src={imageUrl} alt={`Surveillance visual`} className="rounded-lg w-full aspect-video object-cover border border-slate-200 shadow-lg" />}
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <MapPinIcon className="w-7 h-7 text-blue-500"/> 
                {safeString(result.locationName)}
            </h3>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
             <div className="flex items-start">
                <SummaryIcon className="w-6 h-6 mr-3 mt-1 text-blue-500 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-base text-blue-800">Intelligence Briefing</h4>
                    <p className="mt-1 text-sm text-blue-700 leading-relaxed font-medium">{safeString(result.summary)}</p>
                </div>
            </div>
        </div>
        
        <div className="space-y-6">
            <div>
                <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-widest text-xs"><HazardIcon className="w-5 h-5 text-rose-500"/>Identified Risk Factors</h4>
                <div className="space-y-2">
                    {result.hazards.map((h, index) => (
                        <div key={index} className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 flex items-start gap-4">
                           <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0"></div>
                           <div>
                                <strong className="block font-bold text-sm text-rose-900">{safeString(h.hazard)}</strong> 
                                <span className="text-sm text-rose-700 font-medium">{safeString(h.description)}</span>
                           </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div>
                 <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-widest text-xs"><DiseaseIcon className="w-5 h-5 text-amber-500"/>Biological Vulnerabilities</h4>
                <div className="space-y-3">
                     {result.diseases.map((d, index) => (
                        <AccordionItem 
                            key={index} 
                            title={safeString(d.name)}
                            defaultOpen={index === 0}
                        >
                            <p className="mb-4 text-sm font-medium"><strong className="font-bold text-slate-700">Root Cause:</strong> {safeString(d.cause)}</p>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <h5 className="font-bold mb-2 flex items-center text-slate-800 text-xs uppercase tracking-wider gap-2"><PrecautionIcon className="w-4 h-4 text-green-500"/>Preemptive Actions:</h5>
                                <ul className="space-y-2 pl-2 text-sm">
                                    {d.precautions.map((p, pIndex) => (
                                        <li key={pIndex} className="flex items-start gap-2.5">
                                           <span className="text-green-500 font-bold">✓</span> 
                                           <span className="font-medium">{safeString(p)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </AccordionItem>
                    ))}
                </div>
            </div>
        </div>
        <div className="border-t border-slate-200 pt-6 mt-6">
            <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="w-8 h-8 text-blue-500"/>
                <div>
                    <h4 className="text-lg font-bold text-slate-800">Supportive Logistics</h4>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Medical Facilities Locator</p>
                </div>
            </div>

            {findStatus === 'idle' && (
                <button
                    onClick={handleFindFacilities}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 shadow-blue-200"
                >
                    Retrieve Real-World Facility Data
                </button>
            )}

            <div className="mt-4">
                {findStatus === 'loading' && <div className="flex flex-col items-center justify-center py-8 text-slate-600"><LoadingSpinner /><p className="mt-3 text-sm font-bold uppercase tracking-widest text-slate-400">Scanning satellite grounding data...</p></div>}
                {findStatus === 'error' && (
                    <div className="text-center p-3 bg-red-50 rounded-md border border-red-100">
                        <p className="text-sm text-red-600 font-bold">{safeString(findError)}</p>
                        <button onClick={handleFindFacilities} className="text-sm mt-2 text-red-700 font-black hover:underline">RETRY RETRIEVAL</button>
                    </div>
                )}
                
                {findStatus === 'success' && (
                    facilities.length > 0 ? (
                        <div className="space-y-3 animate-fade-in">
                            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Validated Results ({facilities.length}):</h3>
                            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-72 overflow-y-auto">
                                {facilities.map((facility, index) => {
                                    const directionsUrl = facility.url || `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
                                    return (
                                    <li key={index} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white hover:bg-blue-50/30 transition-colors gap-3">
                                        <div className="min-w-0 pr-2">
                                            <p className="font-black text-slate-800 text-base">{safeString(facility.name)}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{facility.type} • {facility.distance}</p>
                                        </div>
                                        <a 
                                            href={directionsUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl flex items-center justify-center text-xs transition-all shadow-md active:scale-95"
                                        >
                                            {facility.url ? <LinkIcon className="w-4 h-4 mr-2" /> : <DirectionsIcon className="w-4 h-4 mr-2" />}
                                            {facility.url ? 'INFO' : 'GO'}
                                        </a>
                                    </li>
                                )})}
                            </ul>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleClearFacilities} className="flex-1 text-xs font-black uppercase tracking-widest text-center text-slate-400 hover:text-slate-600 p-2 transition-colors">
                                    Reset
                                </button>
                                <a
                                    href={`https://www.google.com/maps/search/medical+facility/@${coords.lat},${coords.lng},14z`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 text-xs font-black uppercase tracking-widest text-center text-blue-600 hover:text-blue-800 p-2 transition-colors"
                                >
                                    Global Map Link
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="p-10 mt-4 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 animate-fade-in text-center rounded-2xl" role="alert">
                            <p className="font-black uppercase tracking-[0.2em] mb-2">No Verified Matches</p>
                            <p className="text-xs font-bold leading-relaxed">No medical facilities matched the exact biometric radius in the current grounding set.</p>
                            <button onClick={handleFindFacilities} className="text-xs mt-6 bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95">
                                EXPAND SEARCH PARAMETERS
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    </div>
  );
};
