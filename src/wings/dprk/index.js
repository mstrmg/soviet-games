// NORTH KOREA WING lobby: the Ministry of Glorious Firsts, lit for foreign cameras.
import { createWingLobby } from '../../hub/index.js';
import * as DPRK from './departments.js';
import dress from './dress.js';

export default createWingLobby({ ...DPRK, LOBBY: { ...DPRK.LOBBY, dress } });
