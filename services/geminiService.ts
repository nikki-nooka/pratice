
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { AnalysisResult, LocationAnalysisResult, Facility, PrescriptionAnalysisResult, HealthForecast, MentalHealthResult, SymptomAnalysisResult, Page, BotCommandResponse, Alert, AlertSource, CityHealthSnapshot, AlertCategory } from '../types';
import * as cache from './cacheService';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await apiCall();
        } catch (error: any) {
            const isRateLimitError = error.toString().includes('429') || error.toString().includes('RESOURCE_EXHAUSTED');
            if (isRateLimitError && attempt < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, attempt);
                await sleep(delay);
                attempt++;
            } else {
                throw error;
            }
        }
    }
    throw new Error('Exceeded maximum retries.');
}

/**
 * Robust string extractor to prevent React Error #31.
 * Recursively extracts text from potential response objects.
 */
export const safeString = (val: any, fallback: string = ''): string => {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return fallback;
    
    if (typeof val === 'object') {
        // High priority keys for geocoding and location results
        const keys = ['area', 'name', 'label', 'cityName', 'locationName', 'address', 'full_address', 'formatted_address', 'specific_neighborhoods', 'text', 'display_name'];
        for (const key of keys) {
            if (val[key]) {
                const inner = safeString(val[key]);
                if (inner && typeof inner === 'string') return inner;
            }
        }
        
        if (Array.isArray(val)) {
            return val.map(v => safeString(v)).filter(Boolean).join(', ');
        }

        // Final fallback if we can't find a logical string property
        try {
            const str = JSON.stringify(val);
            // If it's a small object, return as string, else fallback
            return str.length < 200 ? str : fallback;
        } catch {
            return fallback;
        }
    }
    return String(val);
};

const locationAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING },
        hazards: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    hazard: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["hazard", "description"]
            }
        },
        diseases: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    cause: { type: Type.STRING },
                    precautions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "cause", "precautions"]
            }
        },
        summary: { type: Type.STRING }
    },
    required: ["locationName", "hazards", "diseases", "summary"]
};

const geocodeSchema = {
    type: Type.OBJECT,
    properties: {
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER },
        foundLocationName: { type: Type.STRING }
    },
    required: ["lat", "lng", "foundLocationName"]
};

const cleanJsonString = (str: string): string => {
    return str.replace(/```json\n?|```/g, '').trim();
};

export const analyzeLocationByCoordinates = async (lat: number, lng: number, language: string, knownLocationName?: string): Promise<{ analysis: LocationAnalysisResult, imageUrl: string | null }> => {
    const cacheKey = `loc_v8_${lat.toFixed(4)}_${lng.toFixed(4)}_${language}`;
    const cachedItem = cache.get<{ analysis: LocationAnalysisResult, imageUrl: string | null }>(cacheKey);
    if (cachedItem) return cachedItem;

    const contents = `Perform environmental health analysis for coordinates ${lat}, ${lng} (Context: ${safeString(knownLocationName)}). Return JSON.`;

    const [analysisResult, imageResult] = await Promise.allSettled([
        callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: { responseMimeType: "application/json", responseSchema: locationAnalysisSchema }
        })),
        callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: `High-resolution medical satellite biometric map of a region at latitude ${lat}, longitude ${lng}. HUD technical interface overlay.`,
        }))
    ]);

    if (analysisResult.status === 'rejected') throw new Error("Analysis failed");

    let analysis = JSON.parse(cleanJsonString(analysisResult.value.text || '{}'));
    
    // Explicitly sanitize all text fields to avoid React Error #31
    analysis.locationName = safeString(analysis.locationName, knownLocationName || 'Selected Area');
    analysis.summary = safeString(analysis.summary);
    if (Array.isArray(analysis.hazards)) {
        analysis.hazards = analysis.hazards.map((h: any) => ({
            hazard: safeString(h.hazard),
            description: safeString(h.description)
        }));
    }
    if (Array.isArray(analysis.diseases)) {
        analysis.diseases = analysis.diseases.map((d: any) => ({
            name: safeString(d.name),
            cause: safeString(d.cause),
            precautions: Array.isArray(d.precautions) ? d.precautions.map((p: any) => safeString(p)) : []
        }));
    }

    let imageUrl: string | null = null;
    if (imageResult.status === 'fulfilled') {
        for (const part of imageResult.value.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }
    
    const result = { analysis, imageUrl };
    cache.set(cacheKey, result, 30);
    return result;
};

export const geocodeLocation = async (query: string): Promise<{ lat: number, lng: number, foundLocationName: string }> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Geocode "${query}". Return JSON with lat, lng, and a simple string foundLocationName.`,
        config: { responseMimeType: "application/json", responseSchema: geocodeSchema }
    });
    const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
    return {
        lat: Number(parsed.lat) || 0,
        lng: Number(parsed.lng) || 0,
        foundLocationName: safeString(parsed.foundLocationName, query)
    };
};

export const analyzeImage = async (base64ImageData: string, language: string): Promise<AnalysisResult> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } },
                { text: `Analyze for health hazards. Lang: ${language}. JSON.` }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: locationAnalysisSchema
        }
    });

    const result = JSON.parse(cleanJsonString(response.text || '{}'));
    return {
        hazards: Array.isArray(result.hazards) ? result.hazards.map((h: any) => ({
            hazard: safeString(h.hazard),
            description: safeString(h.description)
        })) : [],
        diseases: Array.isArray(result.diseases) ? result.diseases.map((d: any) => ({
            name: safeString(d.name),
            cause: safeString(d.cause),
            precautions: Array.isArray(d.precautions) ? d.precautions.map((p: any) => safeString(p)) : []
        })) : [],
        summary: safeString(result.summary)
    };
};

export const findFacilitiesByCoordinates = async (coords: { lat: number; lng: number }): Promise<Omit<Facility, 'distance'>[]> => {
    const searchResponse = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find medical facilities near ${coords.lat}, ${coords.lng}. Use Maps.`,
        config: { 
            tools: [{ googleMaps: {} }],
            toolConfig: { retrievalConfig: { latLng: { latitude: coords.lat, longitude: coords.lng } } }
        }
    }));

    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const structureResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Convert to JSON array: ${JSON.stringify(groundingChunks)}.`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT, 
                    properties: { 
                        name: { type: Type.STRING }, 
                        type: { type: Type.STRING, enum: ['Hospital', 'Clinic', 'Pharmacy'] }, 
                        lat: { type: Type.NUMBER }, 
                        lng: { type: Type.NUMBER },
                        url: { type: Type.STRING }
                    }, 
                    required: ["name", "type", "lat", "lng"] 
                } 
            } 
        }
    });

    const results = JSON.parse(cleanJsonString(structureResponse.text || '[]'));
    return results.map((f: any) => ({
        ...f,
        name: safeString(f.name, 'Medical Center')
    }));
};

export const analyzePrescription = async (base64ImageData: string, language: string): Promise<PrescriptionAnalysisResult> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64ImageData } }, { text: "Extract medical data. JSON." }] },
        config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(cleanJsonString(response.text || '{}'));
    return {
        summary: safeString(result.summary),
        medicines: Array.isArray(result.medicines) ? result.medicines.map((m: any) => ({ name: safeString(m.name), dosage: safeString(m.dosage) })) : [],
        precautions: Array.isArray(result.precautions) ? result.precautions.map((p: any) => safeString(p)) : [],
        videos: Array.isArray(result.videos) ? result.videos.map((v: any) => ({ title: safeString(v.title), url: safeString(v.url) })) : []
    };
};

export const analyzeMentalHealth = async (answers: Record<string, string>, language: string): Promise<MentalHealthResult> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Perform wellness reflection: ${JSON.stringify(answers)}. JSON.`,
        config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(cleanJsonString(response.text || '{}'));
    return {
        summary: safeString(result.summary),
        potentialConcerns: Array.isArray(result.potentialConcerns) ? result.potentialConcerns.map((c: any) => ({ name: safeString(c.name), explanation: safeString(c.explanation) })) : [],
        copingStrategies: Array.isArray(result.copingStrategies) ? result.copingStrategies.map((s: any) => ({ title: safeString(s.title), description: safeString(s.description) })) : [],
        recommendation: safeString(result.recommendation)
    };
};

export const getBotCommand = async (prompt: string, language: string, availablePages: Page[]): Promise<BotCommandResponse> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
            systemInstruction: `Assistant. Pages: [${availablePages.join(', ')}]. JSON.`,
            responseMimeType: "application/json"
        }
    });
    const result = JSON.parse(cleanJsonString(response.text || '{}'));
    return {
        action: result.action === 'navigate' ? 'navigate' : 'speak',
        page: result.page as Page,
        responseText: safeString(result.responseText)
    };
};

export const getHealthForecast = async (coords: { lat: number; lng: number }, language: string): Promise<HealthForecast> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Health briefing for ${coords.lat}, ${coords.lng}. JSON.`,
        config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(cleanJsonString(response.text || '{}'));
    return {
        locationName: safeString(result.locationName, 'Current Area'),
        summary: safeString(result.summary),
        riskFactors: Array.isArray(result.riskFactors) ? result.riskFactors.map((r: any) => ({ name: safeString(r.name), level: r.level, description: safeString(r.description) })) : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations.map((r: any) => safeString(r)) : []
    };
};

export const analyzeSymptoms = async (symptoms: string, language: string): Promise<SymptomAnalysisResult> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze symptoms: "${symptoms}". JSON.`,
        config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(cleanJsonString(response.text || '{}'));
    return {
        summary: safeString(result.summary),
        triageRecommendation: safeString(result.triageRecommendation),
        potentialConditions: Array.isArray(result.potentialConditions) ? result.potentialConditions.map((c: any) => ({ name: safeString(c.name), description: safeString(c.description) })) : [],
        nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps.map((s: any) => safeString(s)) : [],
        disclaimer: safeString(result.disclaimer),
        videos: Array.isArray(result.videos) ? result.videos.map((v: any) => ({ title: safeString(v.title), url: safeString(v.url) })) : []
    };
};

export const getLiveHealthAlerts = async (forceRefresh: boolean = false): Promise<Alert[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "List current major health alerts. Search Grounding.",
        config: { tools: [{ googleSearch: {} }] }
    });
    const structure = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Format to Alert JSON array: ${response.text}`,
        config: { responseMimeType: "application/json" }
    });
    const list = JSON.parse(cleanJsonString(structure.text || '[]'));
    return list.map((a: any) => ({
        ...a,
        title: safeString(a.title),
        location: safeString(a.location),
        detailedInfo: safeString(a.detailedInfo),
        threatAnalysis: safeString(a.threatAnalysis)
    }));
};

export const getLocalHealthAlerts = async (lat: number, lng: number, forceRefresh: boolean = false): Promise<Alert[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Local health alerts at ${lat}, ${lng}. Search Grounding.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    const structure = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Format to Alert JSON array: ${response.text}`,
        config: { responseMimeType: "application/json" }
    });
    const list = JSON.parse(cleanJsonString(structure.text || '[]'));
    return list.map((a: any) => ({
        ...a,
        title: safeString(a.title),
        location: safeString(a.location),
        detailedInfo: safeString(a.detailedInfo),
        threatAnalysis: safeString(a.threatAnalysis)
    }));
};

export const getCityHealthSnapshot = async (cityName: string, country: string, language: string): Promise<CityHealthSnapshot> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Health snapshot for ${cityName}. Search Grounding.`,
        config: { tools: [{ googleSearch: {} }] }
    });
    const structure = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Format to CityHealthSnapshot JSON. Data: "${response.text}". City: "${cityName}".`,
        config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(cleanJsonString(structure.text || '{}'));
    return {
        ...result,
        cityName: safeString(result.cityName, cityName),
        overallSummary: safeString(result.overallSummary),
        diseases: Array.isArray(result.diseases) ? result.diseases.map((d: any) => ({
            ...d,
            name: safeString(d.name),
            summary: safeString(d.summary)
        })) : []
    };
};
