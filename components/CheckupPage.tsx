
import React, { useState } from 'react';
import { geocodeLocation, findFacilitiesByCoordinates, safeString } from '../services/geminiService';
import { HeartPulseIcon, BuildingOfficeIcon, UserIcon, SendIcon, DirectionsIcon, MagnifyingGlassIcon, CrosshairsIcon, CheckCircleIcon, LinkIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';
import type { Facility } from '../types';
import { BackButton } from './BackButton';
import { useI18n } from './I18n';

interface CheckupPageProps {
  onBack: () => void;
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

type PaidFormStatus = 'idle' | 'sending' | 'sent';
type LocationStatus = 'idle' | 'fetching_gps' | 'geocoding' | 'finding_facilities' | 'success' | 'error';

export const CheckupPage: React.FC<CheckupPageProps> = ({ onBack }) => {
    const { t } = useI18n();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
    const [locationError, setLocationError] = useState<string | null>(null);
    const [manualLocationInput, setManualLocationInput] = useState('');
    
    const [paidFormStatus, setPaidFormStatus] = useState<PaidFormStatus>('idle');
    const [formState, setFormState] = useState({ name: '', address: '', phone: '', date: '', email: '' });
    
    const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [verifiedAddress, setVerifiedAddress] = useState<string | null>(null);

    const resetLocationState = () => {
        setFacilities([]);
        setLocationStatus('idle');
        setLocationError(null);
    };

    const findAndSetFacilities = async (coords: { lat: number, lng: number }) => {
        setLocationStatus('finding_facilities');
        setFacilities([]);
        setLocationError(null);
        try {
            const facilitiesFromApi = await findFacilitiesByCoordinates(coords);
            
            const sortedByDistance = facilitiesFromApi
                .map(f => ({
                    ...f,
                    rawDistance: getDistanceInKm(coords.lat, coords.lng, f.lat, f.lng)
                }))
                .sort((a, b) => a.rawDistance - b.rawDistance)
                .map(f => ({
                    ...f,
                    distance: `${f.rawDistance < 1 ? (f.rawDistance * 1000).toFixed(0) + ' m' : f.rawDistance.toFixed(1) + ' km'}`
                }));
            
            setFacilities(sortedByDistance);
            setLocationStatus('success');
        } catch (error: any) {
            setLocationError("Unable to retrieve real-time data. Please try another search.");
            setLocationStatus('error');
        }
    };
    
    const handleUseCurrentLocation = () => {
        resetLocationState();
        setLocationStatus('fetching_gps');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
                findAndSetFacilities(coords);
            },
            () => {
                setLocationError("GPS access denied. Please type your location manually.");
                setLocationStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleManualSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualLocationInput.trim()) return;
        resetLocationState();
        setLocationStatus('geocoding');
        try {
            const coords = await geocodeLocation(manualLocationInput);
            await findAndSetFacilities(coords);
        } catch (error) {
            setLocationError("Could not pinpoint that location.");
            setLocationStatus('error');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleVerifyAddress = async () => {
        if (!formState.address.trim()) return;
        setGeocodingStatus('loading');
        try {
            const { foundLocationName } = await geocodeLocation(formState.address);
            setVerifiedAddress(foundLocationName);
            setGeocodingStatus('success');
        } catch (error) {
            setGeocodingStatus('error');
        }
    };

  return (
    <div className="w-full min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 animate-fade-in bg-slate-50">
        <header className="w-full max-w-6xl mx-auto flex justify-start items-center">
            <BackButton onClick={onBack}>{t('back')}</BackButton>
        </header>

        <main className="flex-grow flex flex-col items-center mt-12">
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto shadow-sm mb-6 border border-green-100">
                    <HeartPulseIcon className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{t('schedule_checkup_title')}</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 font-medium">{t('schedule_checkup_subtitle')}</p>
            </div>

            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Resources Mapping Section */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200/60 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <BuildingOfficeIcon className="w-8 h-8 text-blue-600"/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('community_resources_title')}</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Verified Medical Network</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <form onSubmit={handleManualSearch} className="flex gap-3">
                             <input
                                type="text"
                                value={manualLocationInput}
                                onChange={(e) => setManualLocationInput(e.target.value)}
                                placeholder="Search neighborhood, city, or zip..."
                                className="flex-grow block w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-4 rounded-2xl transition-all shadow-lg active:scale-95 shadow-blue-100">
                               <MagnifyingGlassIcon className="w-6 h-6" />
                            </button>
                        </form>
                        <button onClick={handleUseCurrentLocation} className="w-full bg-white hover:bg-slate-50 text-slate-700 font-black py-4 px-6 rounded-2xl flex items-center justify-center transition-all border-2 border-slate-100 shadow-sm active:scale-95">
                           <CrosshairsIcon className="w-5 h-5 mr-3 text-blue-600" /> {t('use_current_location')}
                        </button>
                    </div>

                    <div className="mt-10 flex-grow min-h-[300px]">
                        {(locationStatus === 'fetching_gps' || locationStatus === 'geocoding' || locationStatus === 'finding_facilities') && (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400 animate-pulse">
                                <LoadingSpinner />
                                <span className="mt-6 font-black uppercase tracking-[0.2em] text-xs">Accessing Satellite Feed...</span>
                            </div>
                        )}
                        
                        {locationStatus === 'success' && (
                            facilities.length > 0 ? (
                                <div className="space-y-4 animate-fade-in">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Detected Network Nodes ({facilities.length})</h3>
                                    <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                                        {facilities.map((facility, index) => {
                                            const directionsUrl = facility.url || `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
                                            return (
                                            <li key={index} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200/60 rounded-3xl hover:border-blue-300 hover:bg-white transition-all group gap-4">
                                                <div className="min-w-0 pr-2">
                                                    <p className="font-black text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">{safeString(facility.name)}</p>
                                                    <div className="flex items-center gap-2.5 mt-2">
                                                        <span className="text-[10px] font-black text-blue-600 bg-blue-100/50 px-2.5 py-1 rounded-full uppercase tracking-widest">{facility.type}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{facility.distance}</span>
                                                    </div>
                                                </div>
                                                <a 
                                                    href={directionsUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex-shrink-0 w-full sm:w-auto bg-white group-hover:bg-blue-600 text-slate-700 group-hover:text-white font-black py-3 px-8 rounded-2xl flex items-center justify-center text-xs transition-all border border-slate-200 group-hover:border-blue-600 shadow-sm"
                                                >
                                                    {facility.url ? <LinkIcon className="w-4 h-4 mr-2" /> : <DirectionsIcon className="w-4 h-4 mr-2" />}
                                                    {facility.url ? 'Details' : 'Route'}
                                                </a>
                                            </li>
                                        )})}
                                    </ul>
                                </div>
                            ) : (
                                 <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active nodes found</p>
                                    <p className="text-sm text-slate-400 mt-2 font-medium px-10">Try a broader city name or manual address search.</p>
                                </div>
                            )
                        )}

                        {locationStatus === 'error' && (
                            <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 text-center">
                                <p className="text-sm text-red-600 font-bold leading-relaxed">{locationError}</p>
                                <button onClick={() => setLocationStatus('idle')} className="mt-6 text-[10px] font-black uppercase tracking-widest text-red-700 bg-red-100 px-6 py-3 rounded-xl hover:bg-red-200 transition-all">Reset Console</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Section Alignment Fixed */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200/60 h-full flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-green-50 rounded-2xl">
                            <UserIcon className="w-8 h-8 text-green-600"/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('personalized_visit_title')}</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Global Health Professional Registry</p>
                        </div>
                    </div>

                    {paidFormStatus === 'sent' ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-10 animate-fade-in">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border border-green-100">
                                <CheckCircleIcon className="w-14 h-14 text-green-500" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{t('appointment_requested')}</h3>
                            <p className="mt-4 text-slate-500 font-medium leading-relaxed px-6">Transmission complete. Check your primary email for biometric verification and node confirmation.</p>
                        </div>
                    ) : (
                        <form onSubmit={(e) => { e.preventDefault(); setPaidFormStatus('sending'); setTimeout(() => setPaidFormStatus('sent'), 1500); }} className="space-y-6 flex-grow">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5">Biological Identity (Name)</label>
                                    <input type="text" name="name" required value={formState.name} onChange={handleInputChange} className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5">Geospatial Coordinates (Address)</label>
                                    <div className="relative">
                                        <textarea name="address" rows={2} required value={formState.address} onChange={handleInputChange} className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl pr-14 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium resize-none" />
                                        <button type="button" onClick={handleVerifyAddress} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-green-600 transition-colors">
                                            {geocodingStatus === 'loading' ? <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div> : <MagnifyingGlassIcon className="w-6 h-6" />}
                                        </button>
                                    </div>
                                    {geocodingStatus === 'success' && verifiedAddress && (
                                        <p className="mt-3 text-[11px] text-green-600 font-black flex items-center gap-2 uppercase tracking-widest">
                                            <CheckCircleIcon className="w-4 h-4" /> Node Locked: {safeString(verifiedAddress)}
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5">Comms ID (Phone)</label>
                                        <input type="tel" name="phone" required value={formState.phone} onChange={handleInputChange} className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5">Node Window (Date)</label>
                                        <input type="date" name="date" required value={formState.date} onChange={handleInputChange} className="block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none font-medium"/>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" disabled={geocodingStatus !== 'success'} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-3xl disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-xl shadow-green-100 active:scale-[0.98]">
                                <SendIcon className="w-6 h-6 mr-3 inline" /> {t('form_request_button')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </main>
    </div>
  );
};
