import { createContext, useContext } from 'react';

export interface RestApi {
  startRest: (seconds: number) => void;
}

export const RestContext = createContext<RestApi>({ startRest: () => {} });

export const useRestTimer = () => useContext(RestContext);
