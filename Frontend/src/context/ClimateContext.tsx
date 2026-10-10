import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  AddressResolutionState,
  AlertItem,
  AppView,
  ClimateConditions,
  Coordinates,
  InitPhase,
  LocationStatus,
  OperatorForm,
  RiskLevel,
  SystemRiskReport,
} from '../types/climate';

import {
  DEFAULT_CONDITIONS,
  DEFAULT_COORDINATES,
  fetchLiveClimateData,
  generateClimateAlerts,
  geocodeAddress,
  requestDeviceLocation,
  submitOperatorRegistration,
} from '../services/climateService';

import {
  chatWithBackend,
  fetchBackendAlerts,
  fetchBackendWeather,
  registerUserWithBackend,
} from '../services/backendService';

import { audioService } from '../services/audioService';

const STORAGE_KEY = 'climateguard-registration-v1';

type PersistedRegistration = {
  operator: OperatorForm;
  coordinates: Coordinates;
  report: SystemRiskReport | null;
  userId: string | null;
};

interface ClimateContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  isRegistered: boolean;
  userId: string | null;

  locationStatus: LocationStatus;
  coordinates: Coordinates;

  conditions: ClimateConditions;
  alerts: AlertItem[];

  operator: OperatorForm;
  report: SystemRiskReport | null;

  initPhase: InitPhase;
  addressState: AddressResolutionState;

  weatherError: string | null;
  registrationError: string | null;

  requestLocation: () => Promise<void>;
  updateAddress: (address: string) => void;

  registerOperator: (
    form: OperatorForm
  ) => Promise<SystemRiskReport | null>;

  cycleRisk: (newRisk: RiskLevel) => void;

  refreshWeather: () => Promise<void>;

  dismissReport: () => void;

  chat: (query: string) => Promise<string>;

  logout: () => void;
}

const ClimateContext =
  createContext<ClimateContextType | null>(null);


function readPersisted(): PersistedRegistration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const parsed =
      JSON.parse(raw) as PersistedRegistration;

    if (
      !parsed?.operator?.name ||
      !parsed?.operator?.phone ||
      !parsed?.operator?.address
    ) {
      return null;
    }

    return parsed;

  } catch {
    return null;
  }
}


function persist(
  value: PersistedRegistration | null
) {
  try {

    if (!value) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(value)
      );
    }

  } catch {
    // Storage can be unavailable in restricted/private browsing contexts.
  }
}


const LOCKED_VIEWS: AppView[] = [
  'AREA',
  'WEATHER',
  'RISK',
  'ALERTS',
  'ASSISTANT',
  'PROFILE',
];


export const ClimateProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  const persisted = readPersisted();

  const persistedHasRealLocation = Boolean(
    persisted?.coordinates &&
    (
      persisted.coordinates.lat !== 0 ||
      persisted.coordinates.lng !== 0
    ) &&
    persisted.coordinates.label !== 'Location pending'
  );


  const [currentView, setCurrentViewState] =
    useState<AppView>(
      persisted ? 'AREA' : 'HERO'
    );


  const [isRegistered, setIsRegistered] =
    useState(Boolean(persisted));


  const [userId, setUserId] =
    useState<string | null>(
      persisted?.userId ?? null
    );


  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>(
      persistedHasRealLocation
        ? 'LOCATION LOCKED'
        : 'INITIALIZING'
    );


  const [coordinates, setCoordinates] =
    useState<Coordinates>(
      persisted?.coordinates ?? {
        ...DEFAULT_COORDINATES,
        label: 'Location pending',
      }
    );


  const [conditions, setConditions] =
    useState<ClimateConditions>(
      persisted?.report?.conditions ??
      DEFAULT_CONDITIONS
    );


  const [alerts, setAlerts] =
    useState<AlertItem[]>([]);


  const [operator, setOperator] =
    useState<OperatorForm>(
      persisted?.operator ?? {
        name: '',
        phone: '',
        address: '',
      }
    );


  const [report, setReport] =
    useState<SystemRiskReport | null>(
      persisted?.report ?? null
    );


  const [initPhase, setInitPhase] =
    useState<InitPhase>(
      persisted ? 'READY' : 'IDLE'
    );


  const [addressState, setAddressState] =
    useState<AddressResolutionState>(
      'MANUAL'
    );


  const [weatherError, setWeatherError] =
    useState<string | null>(null);


  const [registrationError, setRegistrationError] =
    useState<string | null>(null);


  const setCurrentView = useCallback(
    (view: AppView) => {

      if (
        !isRegistered &&
        LOCKED_VIEWS.includes(view)
      ) {

        setCurrentViewState('HERO');

        window.setTimeout(() => {
          document
            .getElementById('secure-risk-profile')
            ?.focus();
        }, 30);

        audioService.playTick();

        return;
      }

      setCurrentViewState(view);
    },
    [isRegistered]
  );


  const loadWeather = useCallback(
    async (
      coords: Coordinates,
      nextUserId: string | null = userId
    ) => {

      setWeatherError(null);

      try {

        const data =
          await fetchBackendWeather(coords);

        setConditions(data);

        try {

          const backendAlerts =
            await fetchBackendAlerts(nextUserId);

          setAlerts(
            backendAlerts.length
              ? backendAlerts
              : generateClimateAlerts(
                  coords,
                  data
                )
          );

        } catch {

          setAlerts(
            generateClimateAlerts(
              coords,
              data
            )
          );

        }

        return data;

      } catch (backendError) {

        try {

          const data =
            await fetchLiveClimateData(
              coords
            );

          setConditions(data);

          setAlerts(
            generateClimateAlerts(
              coords,
              data
            )
          );

          setWeatherError(null);

          return data;

        } catch (directError) {

          const message =
            backendError instanceof Error
              ? backendError.message
              : directError instanceof Error
                ? directError.message
                : 'Weather service unavailable';

          setWeatherError(message);

          throw (
            directError instanceof Error
              ? directError
              : new Error(message)
          );

        }

      }

    },
    [userId]
  );


  const acquireLocation =
    useCallback(
      async (): Promise<Coordinates> => {

        setLocationStatus(
          'REQUESTING LOCATION'
        );

        try {

          const pos =
            await requestDeviceLocation();

          setCoordinates(pos);

          setLocationStatus(
            'LOCATION LOCKED'
          );

          setAddressState('LOCATED');

          audioService.playChirp();

          return pos;

        } catch {

          setLocationStatus(
            'LOCATION UNAVAILABLE'
          );

          throw new Error(
            'Location permission was denied or unavailable'
          );

        }

      },
      []
    );


  const requestLocation =
    useCallback(
      async () => {

        if (!isRegistered) return;

        try {

          const pos =
            await acquireLocation();

          await loadWeather(
            pos,
            userId
          );

        } catch {
          // UI already exposes location state.
        }

      },
      [
        acquireLocation,
        isRegistered,
        loadWeather,
        userId,
      ]
    );


  useEffect(() => {

    if (!isRegistered) {

      requestDeviceLocation()
        .then((coords) => {

          setCoordinates(coords);

          setLocationStatus(
            'LOCATION LOCKED'
          );

          setAddressState('LOCATED');

        })
        .catch(() => {
          // Location remains pending.
        });

      return;
    }


    if (
      persistedHasRealLocation &&
      persisted?.coordinates
    ) {

      loadWeather(
        persisted.coordinates,
        persisted.userId
      ).catch(() => undefined);

      return;
    }


    acquireLocation()
      .then((coords) => {

        setCoordinates(coords);

        loadWeather(
          coords,
          persisted?.userId ?? userId
        ).catch(() => undefined);

      })
      .catch(() => {

        setLocationStatus(
          'LOCATION UNAVAILABLE'
        );

      });

  }, []);


  const updateAddress =
    useCallback(
      (addressInput: string) => {

        setOperator((prev) => ({
          ...prev,
          address: addressInput,
        }));

        setAddressState(
          addressInput.trim()
            ? 'MANUAL'
            : 'MANUAL'
        );

      },
      []
    );


  const registerOperator =
    useCallback(
      async (
        form: OperatorForm
      ): Promise<SystemRiskReport | null> => {

        setOperator(form);

        setWeatherError(null);
        setRegistrationError(null);

        setInitPhase(
          'INITIALIZING'
        );


        const locationPromise =
          (async (): Promise<Coordinates | null> => {

            setInitPhase(
              'RESOLVING_LOCATION'
            );

            const hasAcquiredRealLocation =
              Number.isFinite(
                coordinates.lat
              ) &&
              Number.isFinite(
                coordinates.lng
              ) &&
              (
                coordinates.lat !== 0 ||
                coordinates.lng !== 0
              ) &&
              coordinates.label !==
                'Location pending';


            if (
              hasAcquiredRealLocation
            ) {
              return coordinates;
            }


            try {

              return await acquireLocation();

            } catch {

              setAddressState(
                'RESOLVING...'
              );

              try {

                const addressResult =
                  await geocodeAddress(
                    form.address
                  );

                if (!addressResult) {
                  return null;
                }

                setCoordinates(
                  addressResult.coordinates
                );

                setAddressState(
                  'LOCATED'
                );

                setLocationStatus(
                  'LOCATION LOCKED'
                );

                return addressResult.coordinates;

              } catch {

                return null;

              }

            }

          })();


        try {

          setInitPhase(
            'ESTABLISHING_LINK'
          );


          const registration =
            await registerUserWithBackend(
              form
            );


          const registeredUserId =
            registration.userId;


          /*
           * IMPORTANT:
           * Keep the backend user ID in React state.
           */

          setUserId(
            registeredUserId
          );


          setRegistrationError(null);


          setIsRegistered(true);

          setInitPhase('READY');

          setCurrentViewState(
            'AREA'
          );

          audioService.playChirp();


          /*
           * Persist the REAL user ID immediately.
           */

          persist({
            operator: form,

            coordinates: {
              ...DEFAULT_COORDINATES,
            },

            report: null,

            userId:
              registeredUserId,
          });


          const resolvedCoordinates =
            await locationPromise;


          if (!resolvedCoordinates) {

            setLocationStatus(
              'LOCATION UNAVAILABLE'
            );

            setAddressState(
              'UNRESOLVED'
            );

            return null;

          }


          setCoordinates(
            resolvedCoordinates
          );


          let liveConditions:
            ClimateConditions | null = null;


          try {

            liveConditions =
              await loadWeather(
                resolvedCoordinates,
                registeredUserId
              );

          } catch {
            // Console remains unlocked.
          }


          if (!liveConditions) {

            persist({

              operator: form,

              coordinates:
                resolvedCoordinates,

              report: null,

              userId:
                registeredUserId,

            });

            return null;

          }


          const result =
            await submitOperatorRegistration(
              form,
              resolvedCoordinates,
              liveConditions
            );


          setReport(result);


          persist({

            operator: form,

            coordinates:
              resolvedCoordinates,

            report: result,

            userId:
              registeredUserId,

          });


          return result;

        } catch (error) {

          const message =
            error instanceof Error
              ? error.message
              : 'ClimateGuard registration failed';


          setInitPhase('ERROR');

          setIsRegistered(false);

          setCurrentViewState(
            'HERO'
          );

          setRegistrationError(
            message
          );

          setWeatherError(
            message
          );

          return null;

        }

      },
      [
        acquireLocation,
        coordinates,
        loadWeather,
      ]
    );


  const cycleRisk =
    useCallback(
      (newRisk: RiskLevel) => {

        audioService.playTick();

        setConditions((prev) => {

          const updated = {
            ...prev,
            risk: newRisk,
          };

          setAlerts(
            generateClimateAlerts(
              coordinates,
              updated
            )
          );

          return updated;

        });

      },
      [coordinates]
    );


  const refreshWeather =
    useCallback(
      async () => {

        await loadWeather(
          coordinates,
          userId
        );

      },
      [
        coordinates,
        loadWeather,
        userId,
      ]
    );


  const dismissReport =
    useCallback(
      () => {

        setReport(null);

        setInitPhase(
          isRegistered
            ? 'READY'
            : 'IDLE'
        );

      },
      [isRegistered]
    );


  /*
   * ============================================================
   * AI ASSISTANT
   * ============================================================
   *
   * IMPORTANT:
   * Personalized queries require the backend user_id.
   *
   * The previous version directly called chatWithBackend(query, userId).
   * If userId was missing/null, the backend received no user_id.
   *
   * Now we explicitly validate it before sending the request.
   */

  const chat =
    useCallback(
      async (
        query: string
      ): Promise<string> => {

        const cleanQuery =
          query.trim();


        if (!cleanQuery) {

          throw new Error(
            'Please enter a question.'
          );

        }


        if (!userId) {

          throw new Error(
            'Your ClimateGuard profile is not connected. Please register again before using personalized AI queries.'
          );

        }


        return await chatWithBackend(
          cleanQuery,
          userId
        );

      },
      [userId]
    );


  const logout =
    useCallback(
      () => {

        persist(null);

        setIsRegistered(false);

        setUserId(null);

        setOperator({
          name: '',
          phone: '',
          address: '',
        });

        setCoordinates({
          ...DEFAULT_COORDINATES,
          label: 'Location pending',
        });

        setConditions(
          DEFAULT_CONDITIONS
        );

        setAlerts([]);

        setReport(null);

        setRegistrationError(
          null
        );

        setWeatherError(null);

        setAddressState(
          'MANUAL'
        );

        setLocationStatus(
          'INITIALIZING'
        );

        setInitPhase('IDLE');

        setCurrentViewState(
          'HERO'
        );

        audioService.playTick();

      },
      []
    );


  return (
    <ClimateContext.Provider
      value={{

        currentView,

        setCurrentView,

        isRegistered,

        userId,

        locationStatus,

        coordinates,

        conditions,

        alerts,

        operator,

        report,

        initPhase,

        addressState,

        weatherError,

        registrationError,

        requestLocation,

        updateAddress,

        registerOperator,

        cycleRisk,

        refreshWeather,

        dismissReport,

        chat,

        logout,

      }}
    >

      {children}

    </ClimateContext.Provider>
  );

};


export const useClimate = () => {

  const context =
    useContext(
      ClimateContext
    );

  if (!context) {

    throw new Error(
      'useClimate must be used within ClimateProvider'
    );

  }

  return context;

};