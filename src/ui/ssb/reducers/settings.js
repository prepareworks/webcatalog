import { TOGGLE_SETTING_DIALOG, SET_BEHAVIOR, SET_BEHAVIORS } from '../constants/actions';
import defaultSettings from '../constants/defaultSettings';

const initialState = {
  isOpen: false,
  behaviors: defaultSettings,
};


const settings = (state = initialState, action) => {
  switch (action.type) {
    case TOGGLE_SETTING_DIALOG: {
      return Object.assign({}, state, {
        isOpen: !state.isOpen,
      });
    }
    case SET_BEHAVIOR: {
      const newState = Object.assign({}, state, {});
      newState.behaviors[action.behaviorName] = action.behaviorVal;
      return newState;
    }
    case SET_BEHAVIORS: {
      return Object.assign({}, state, {
        behaviors: action.behaviors,
      });
    }
    default:
      return state;
  }
};

export default settings;
