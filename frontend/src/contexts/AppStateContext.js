import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppStateContext = createContext();

// Action types
const ACTIONS = {
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  SET_SELECTED_SUBREDDIT: 'SET_SELECTED_SUBREDDIT',
  SET_AVAILABLE_POSTS: 'SET_AVAILABLE_POSTS',
  SET_SELECTED_POSTS: 'SET_SELECTED_POSTS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE',
  RESTORE_STATE: 'RESTORE_STATE'
};

// Initial state
const initialState = {
  currentStep: 'select',
  selectedSubreddit: '',
  availablePosts: [],
  selectedPosts: [],
  isLoading: false,
  error: null,
  lastUpdated: null
};

// Reducer function
const appStateReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload, lastUpdated: Date.now() };
    case ACTIONS.SET_SELECTED_SUBREDDIT:
      return { ...state, selectedSubreddit: action.payload, lastUpdated: Date.now() };
    case ACTIONS.SET_AVAILABLE_POSTS:
      return { ...state, availablePosts: action.payload, lastUpdated: Date.now() };
    case ACTIONS.SET_SELECTED_POSTS:
      return { ...state, selectedPosts: action.payload, lastUpdated: Date.now() };
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload, lastUpdated: Date.now() };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, lastUpdated: Date.now() };
    case ACTIONS.RESET_STATE:
      return { ...initialState, lastUpdated: Date.now() };
    case ACTIONS.RESTORE_STATE:
      return { ...action.payload, lastUpdated: Date.now() };
    default:
      return state;
  }
};

// Storage key
const STORAGE_KEY = 'reddit-gemini-app-state';

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  // Save state to localStorage on changes
  useEffect(() => {
    if (state.lastUpdated) {
      try {
        const stateToSave = {
          ...state,
          // Don't save loading states or errors
          isLoading: false,
          error: null
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to save app state:', error);
      }
    }
  }, [state]);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Only restore if the state is recent (within 1 hour)
        const oneHour = 60 * 60 * 1000;
        if (parsedState.lastUpdated && (Date.now() - parsedState.lastUpdated) < oneHour) {
          dispatch({ type: ACTIONS.RESTORE_STATE, payload: parsedState });
        }
      }
    } catch (error) {
      console.warn('Failed to restore app state:', error);
    }
  }, []);

  // Action creators
  const actions = {
    setCurrentStep: (step) => dispatch({ type: ACTIONS.SET_CURRENT_STEP, payload: step }),
    setSelectedSubreddit: (subreddit) => dispatch({ type: ACTIONS.SET_SELECTED_SUBREDDIT, payload: subreddit }),
    setAvailablePosts: (posts) => dispatch({ type: ACTIONS.SET_AVAILABLE_POSTS, payload: posts }),
    setSelectedPosts: (posts) => dispatch({ type: ACTIONS.SET_SELECTED_POSTS, payload: posts }),
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    resetState: () => {
      localStorage.removeItem(STORAGE_KEY);
      dispatch({ type: ACTIONS.RESET_STATE });
    }
  };

  const value = {
    ...state,
    ...actions
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export { ACTIONS };
