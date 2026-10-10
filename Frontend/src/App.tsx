/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ClimateProvider, useClimate } from './context/ClimateContext';
import { CommandNavigation } from './components/CommandNavigation';
import { ClimateGuardHero } from './components/ClimateGuardHero';
import { YourAreaView } from './views/YourAreaView';
import { WeatherView } from './views/WeatherView';
import { ClimateRiskView } from './views/ClimateRiskView';
import { AlertsView } from './views/AlertsView';
import { AIAssistantView } from './views/AIAssistantView';
import { ProfileView } from './views/ProfileView';

const MainShell: React.FC = () => {
  const { currentView, setCurrentView, isRegistered, coordinates, locationStatus, alerts } = useClimate();

  const renderActiveView = () => {
    switch (currentView) {
      case 'AREA':
        return <YourAreaView />;
      case 'WEATHER':
        return <WeatherView />;
      case 'RISK':
        return <ClimateRiskView />;
      case 'ALERTS':
        return <AlertsView />;
      case 'ASSISTANT':
        return <AIAssistantView />;
      case 'PROFILE':
        return <ProfileView />;
      case 'HERO':
      default:
        return <ClimateGuardHero />;
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#02040a] text-slate-100 flex flex-col justify-between overflow-x-hidden">
      <CommandNavigation
        currentView={currentView}
        onSelectView={setCurrentView}
        isRegistered={isRegistered}
        orbitalLat={coordinates.lat}
        orbitalLon={coordinates.lng}
        locationStatus={locationStatus}
        activeAlertCount={alerts.filter((a) => a.status === 'ACTIVE' && a.severity !== 'LOW' && a.severity !== 'MODERATE').length}
      />
      <div className="flex-1 w-full relative z-10 transition-opacity duration-300">
        {renderActiveView()}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ClimateProvider>
      <MainShell />
    </ClimateProvider>
  );
}
