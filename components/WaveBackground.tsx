
import React from 'react';

export const WaveBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-white">
            {/* Soft Ambient Base */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-slate-50" />

            {/* Professional Medical Grid Overlay */}
            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Depth Gradients */}
            <div 
                className="absolute top-[-20%] right-[-10%] w-[80%] h-[70%] bg-blue-100/50 rounded-full blur-[150px] animate-pulse"
                style={{ animationDuration: '15s' }}
            ></div>
            <div 
                className="absolute bottom-[-25%] left-[-15%] w-[70%] h-[60%] bg-indigo-50/70 rounded-full blur-[130px] animate-pulse"
                style={{ animationDuration: '18s' }}
            ></div>

            {/* HUD Technical Accentuation */}
            <div
                className="absolute top-[15%] left-[15%] w-full h-full opacity-[0.04]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 40v20M40 50h20' stroke='%233b82f6' stroke-width='1'/%3E%3Ccircle cx='50' cy='50' r='10' stroke='%233b82f6' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '180px 180px',
                }}
            />
            
            {/* Contextual Geographic Texture (Subtle Map) */}
             <div
                className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
                style={{
                    backgroundImage: `url('https://raw.githubusercontent.com/chrisrzhou/react-globe/main/textures/land_ocean_ice_cloud_2048.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'grayscale(100%) brightness(1.2)',
                }}
            />
        </div>
    );
};
