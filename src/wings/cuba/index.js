// CUBA WING lobby: the Ministry of Permanent Revolution, awaiting one part.
import { createWingLobby } from '../../hub/index.js';
import * as CUBA from './departments.js';
import dress from './dress.js';

export default createWingLobby({ ...CUBA, LOBBY: { ...CUBA.LOBBY, dress } });
