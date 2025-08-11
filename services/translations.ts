
import React from 'react';
import { Language } from '../types';

const translations = {
  en: {
    // App/Global
    'app_title': 'Bingo Night',
    'app_error': 'Application Error',
    'app_error_description': 'This might be a one-time issue. Please try refreshing the page. If the problem persists, ensure your database is set up correctly.',
    'app_error_connection': 'Failed to initialize application data: {message}. Please refresh the page to try again.',
    'app_error_table_missing': 'Database tables are missing.',
    'app_error_table_missing_description': 'Please ask your administrator to run the initial setup SQL in the Supabase project.',
    'app_loading': 'Initializing & connecting to database...',
    'developed_by': 'Developed by Bereket A.',
    'or': 'Or',
    'hide': 'Hide',
    'show': 'Show',
    'players': 'Players',
    'selected': 'selected',
    'card': 'Card',
    'cards': 'Cards',
    'slow': 'Slow',
    'normal': 'Normal',
    'fast': 'Fast',
    'automatic': 'Automatic',
    'manual': 'Manual',
    'english': 'English',
    'amharic': 'Amharic',
    'logout': 'Logout',
    'end': 'End',
    'unmute': 'Unmute',
    'mute': 'Mute',
    'total': 'Total',
    'current_number': 'Current Number',
    'chat_placeholder': 'Type a message...',
    'chat_send': 'Send',
    'chat_title': 'Game Chat',

    // Login Screen
    'welcome_to_bingo_night': 'Welcome to Bingo Night',
    'login_prompt': 'Log in as a Manager or join a game.',
    'login_manager_username_placeholder': 'Manager Username',
    'login_password_placeholder': 'Password',
    'login_error_invalid_credentials': 'Invalid username or password.',
    'login_as_manager': 'Login as Manager',
    'join_a_game': 'Join a Game',

    // Player Client
    'join_bingo_night': 'Join Bingo Night',
    'status_enter_game_id': 'Enter Game ID to join',
    'your_name': 'Your Name',
    'game_id_placeholder': '4-Digit Game ID',
    'error_name_id_required': 'Please enter your name and the Game ID.',
    'status_initializing_connection': 'Initializing connection...',
    'status_connecting_to_host': 'Connecting to host: {hostId}...',
    'status_retrying_connection': 'Game ID not found. Retrying connection ({count}/{max})...',
    'error_invalid_game_id': 'Invalid Game ID. It must be a 4-digit number.',
    'error_connection_timed_out': 'Connection timed out. Please check the Game ID and your network.',
    'status_connection_successful': 'Connection successful! Joining lobby...',
    'error_connection_lost': 'Connection to host has been lost.',
    'error_connection_error': 'A connection error occurred: {message}',
    'error_unexpected': 'An unexpected error occurred: {message}',
    'error_browser_incompatible': 'Your browser is not compatible. Please use a modern browser.',
    'error_disconnected_from_server': 'Disconnected from the signaling server. Check your internet.',
    'error_network': 'Network error. Could not reach the host. Check Game ID.',
    'error_peer_unavailable': 'Could not connect to the host. Please double-check the Game ID and try again.',
    'error_server_error': 'Unable to connect to the server. Please try again later.',
    'error_webrtc_unsupported': 'WebRTC is not supported by your browser.',
    'error_connection_failed': 'Connection failed: {message}',
    'error_unexpected_setup': 'An unexpected error occurred during setup: {message}',
    'game_lobby': 'Game Lobby',
    'welcome_player': 'Welcome, {name}! The host is setting up the game.',
    'select_a_card': 'Select a Card',
    'create_your_own': 'Create Your Own',
    'card_selected': 'Your Card is Selected!',
    'choose_your_card': 'Choose Your Card',
    'can_change_card': 'You can change your selection by picking another card.',
    'pick_one_card': 'Pick one card to play with.',
    'generating_cards': 'Generating new bingo cards...',
    'must_select_card': 'You must select or create a card to join the game.',
    'total_players': 'Total Players',
    'prize_pool': 'Prize Pool',
    'status_confirming_card': 'Confirming card with host...',
    'status_card_accepted': 'Card accepted by host!',
    'status_waiting_for_host': 'Waiting for host to start...',
    'error_card_duplicate': 'This card is taken. Please choose another.',
    'status_game_starting': 'Game is starting!',
    'error_game_started_without_you': 'You haven\'t selected a card! The game has started without you.',
    'lets_play_bingo': 'Let\'s Play BINGO!',
    'good_luck_player': 'Good luck, {name}! Marking is {mode}.',
    'manual_mode': 'Manual Mode',
    'manual_mode_description': 'Click on called numbers on your card to mark them.',
    'waiting_for_card': 'Waiting for your card...',
    'status_bingo_sent': 'BINGO! Waiting for host to verify...',
    'switch_to_manager_login': 'Switch to Manager/Admin Login',
    'previous_card': 'PREVIOUS',
    
    // Card Creator
    'create_your_own_card_title': 'Create Your Own Card',
    'create_card_description': 'Enter a valid number in each cell according to its column.',
    'free_space': 'FREE',
    'submit_my_card': 'Submit My Card',
    'validation_nan': 'NaN',
    'validation_out_of_range': 'Range {min}-{max}',
    'validation_required': 'Required',
    'validation_duplicate': 'Duplicate',
    'validation_fix_duplicates': 'Please fix the duplicate numbers on your card.',
    'validation_fix_errors': 'Please fix the errors on your card.',

    // Game Setup
    'game_setup_title': 'Game Setup & Lobby',
    'welcome_manager': 'Welcome, {name}! Configure the game and invite players.',
    'game_history': 'Game History',
    'win_condition': 'Win Condition',
    'no_winning_patterns_enabled': 'No winning patterns enabled by admin.',
    'game_modes': 'Game Modes',
    'calling_mode': 'Calling Mode',
    'marking_mode': 'Marking Mode',
    'calling_speed': 'Calling Speed',
    'stake_per_card': 'Stake per Card',
    'enter_amount': 'Enter amount',
    'voice_language': 'Voice Language',
    'lobby': 'Lobby',
    'game_id_share': 'Game ID (Share with players)',
    'hide_game_id': 'Hide Game ID',
    'show_game_id': 'Show Game ID',
    'waiting_for_players': 'Waiting for players to join...',
    'host_game_prompt': 'Click "Host Game" to create a lobby and get a Game ID.',
    'game_summary': 'Game Summary',
    'possible_prize': 'Possible Prize',
    'total_cards': 'Total Cards',
    'at_least_2_cards_required': 'At least 2 cards are required to start',
    'start_game_for_all': 'Start Game for All Players ({count})',
    'host_game_and_create_lobby': 'Host Game & Create Lobby',

    // Game Screen
    'play_again': 'Play Again',
    'call_next': 'Call Next',
    'start_game': 'Start Game',
    'pause': 'Pause',
    'resume': 'Resume',
    'start': 'Start',
    'end_game_and_return_to_setup': 'End Game and Return to Setup',
    'winning_pattern': 'Winning Pattern',
    'number_of_players': 'Number of Players/Cards',
    'card_is_hidden': 'Card is hidden',
    'show_card': 'Show Card',
    'no_players_in_game': 'No players in game.',
    'total_stake': 'Total Stake',
    'disconnected': 'Disconnected',
    'loading_card': 'Loading card...',
    
    // Bingo Modal
    'congratulations_you_won_speech': 'Congratulations! You won!',
    'you_won_prize_speech': 'You won ${prize}!',
    'player_got_bingo_speech': '{name} got BINGO!',
    'congratulations_you_won': 'Congratulations! You won!',
    'player_got_bingo': React.createElement('span', null, 'Player ', React.createElement('b', {className: "font-bold text-amber-400"}, '{name}'), ' got BINGO!'),
    'you_won_prize': 'You won ${prize}!',
    'audit_trail': 'Audit Trail',
  },
  am: {
    // App/Global
    'app_title': 'ቢንጎ ምሽት',
    'app_error': 'የመተግበሪያ ስህተት',
    'app_error_description': 'ይህ የአንድ ጊዜ ችግር ሊሆን ይችላል። እባክዎ ገጹን እንደገና ለማደስ ይሞክሩ። ችግሩ ከቀጠለ፣ የውሂብ ጎታዎ በትክክል መዋቀሩን ያረጋግጡ።',
    'app_error_connection': 'የመተግበሪያ ውሂብን ማስጀመር አልተሳካም፦ {message}። እባክዎ እንደገና ለመሞከር ገጹን ያድሱ።',
    'app_error_table_missing': 'የውሂብ ጎታ ሠንጠረዦች ጠፍተዋል።',
    'app_error_table_missing_description': 'እባክዎ አስተዳዳሪዎን በሱፓቤዝ ፕሮጀክት ውስጥ የመጀመሪያውን የማዋቀሪያ SQL እንዲያሂድ ይጠይቁ።',
    'app_loading': 'የውሂብ ጎታ በማስጀመር እና በመገናኘት ላይ...',
    'developed_by': 'በበረከት አ. የተሰራ',
    'or': 'ወይም',
    'hide': 'ደብቅ',
    'show': 'አሳይ',
    'players': 'ተጫዋቾች',
    'selected': 'ተመርጧል',
    'card': 'ካርድ',
    'cards': 'ካርዶች',
    'slow': 'ዝግ',
    'normal': 'መደበኛ',
    'fast': 'ፈጣን',
    'automatic': 'ራስ-ሰር',
    'manual': 'በእጅ',
    'english': 'English',
    'amharic': 'አማርኛ',
    'logout': 'ውጣ',
    'end': 'ጨርስ',
    'unmute': 'ድምጽ ክፈት',
    'mute': 'ድምጽ ዝጋ',
    'total': 'ድምር',
    'current_number': 'የአሁኑ ቁጥር',
    'chat_placeholder': 'መልዕክት ይጻፉ...',
    'chat_send': 'ላክ',
    'chat_title': 'የጨዋታ ውይይት',

    // Login Screen
    'welcome_to_bingo_night': 'እንኳን ወደ ቢንጎ ምሽት በደህና መጡ',
    'login_prompt': 'እንደ አስተዳዳሪ ይግቡ ወይም ጨዋታ ይቀላቀሉ',
    'login_manager_username_placeholder': 'የአስተዳዳሪ የተጠቃሚ ስም',
    'login_password_placeholder': 'የይለፍ ቃል',
    'login_error_invalid_credentials': 'የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል።',
    'login_as_manager': 'እንደ አስተዳዳሪ ይግቡ',
    'join_a_game': 'ጨዋታ ይቀላቀሉ',

    // Player Client
    'join_bingo_night': 'የቢንጎ ምሽት ይቀላቀሉ',
    'status_enter_game_id': 'ለመቀላቀል የጨዋታ መለያ ያስገቡ',
    'your_name': 'የእርስዎ ስም',
    'game_id_placeholder': 'ባለ 4-ნიშን የጨዋታ መለያ',
    'error_name_id_required': 'እባክዎ ስምዎን እና የጨዋታ መለያውን ያስገቡ።',
    'status_initializing_connection': 'ግንኙነት በመጀመር ላይ...',
    'status_connecting_to_host': 'ከአስተናጋጅ ጋር በመገናኘት ላይ፡ {hostId}...',
    'status_retrying_connection': 'የጨዋታ መለያ አልተገኘም። ግንኙነቱን እንደገና በመሞከር ላይ ({count}/{max})...',
    'error_invalid_game_id': 'የተሳሳተ የጨዋታ መለያ። ባለ 4-ნიშን ቁጥር መሆን አለበት።',
    'error_connection_timed_out': 'ግንኙነቱ ጊዜው አልፎበታል። እባክዎ የጨዋታ መለያዎን እና የበይነመረብ ግንኙነትዎን ያረጋግጡ።',
    'status_connection_successful': 'ግንኙነት ተሳክቷል! ወደ መሰብሰቢያ ክፍል በመግባት ላይ...',
    'error_connection_lost': 'ከአስተናጋጁ ጋር የነበረው ግንኙነት ተቋርጧል።',
    'error_connection_error': 'የግንኙነት ስህተት ተከስቷል፦ {message}',
    'error_unexpected': 'ያልተጠበቀ ስህተት ተከስቷል፦ {message}',
    'error_browser_incompatible': 'የእርስዎ አሳሽ ተኳሃኝ አይደለም። እባክዎ ዘመናዊ አሳሽ ይጠቀሙ።',
    'error_disconnected_from_server': 'ከምልክት ሰጪው አገልጋይ ጋር ግንኙነቱ ተቋርጧል። የበይነመረብ ግንኙነትዎን ያረጋግጡ።',
    'error_network': 'የአውታረ መረብ ስህተት። አስተናጋጁን ማግኘት አልተቻለም። የጨዋታ መለያውን ያረጋግጡ።',
    'error_peer_unavailable': 'ከአስተናጋጁ ጋር መገናኘት አልተቻለም። እባክዎ የጨዋታ መለያውን ደግመው ያረጋግጡ እና እንደገና ይሞክሩ።',
    'error_server_error': 'ከአገልጋዩ ጋር መገናኘት አልተቻለም። እባክዎ ቆይተው እንደገና ይሞክሩ።',
    'error_webrtc_unsupported': 'WebRTC በአሳሽዎ አይደገፍም።',
    'error_connection_failed': 'ግንኙነት አልተሳካም፦ {message}',
    'error_unexpected_setup': 'በማዋቀር ጊዜ ያልተጠበቀ ስህተት ተከስቷል፦ {message}',
    'game_lobby': 'የጨዋታ መሰብሰቢያ',
    'welcome_player': 'እንኳን ደህና መጣህ/ሽ, {name}! አስተናጋጁ ጨዋታውን እያዘጋጀ ነው።',
    'select_a_card': 'ካርድ ይምረጡ',
    'create_your_own': 'የራስዎን ይፍጠሩ',
    'card_selected': 'ካርድዎ ተመርጧል!',
    'choose_your_card': 'የሚጫወቱበትን ካርድ ይምረጡ',
    'can_change_card': 'ሌላ ካርድ በመምረጥ ምርጫዎን መቀየር ይችላሉ።',
    'pick_one_card': 'ለመጫወት አንድ ካርድ ይምረጡ።',
    'generating_cards': 'አዲስ የቢንጎ ካርዶች በመመረት ላይ...',
    'must_select_card': 'ጨዋታውን ለመቀላቀል ካርድ መምረጥ ወይም መፍጠር አለብዎት።',
    'total_players': 'ጠቅላላ ተጫዋቾች',
    'prize_pool': 'የሽልማት ገንዳ',
    'status_confirming_card': 'ካርድዎን ከአስተናጋጁ ጋር በማረጋገጥ ላይ...',
    'status_card_accepted': 'ካርድዎ በአስተናጋጁ ተቀባይነት አግኝቷል!',
    'status_waiting_for_host': 'አስተናጋጁ ጨዋታውን እስኪጀምር በመጠበቅ ላይ...',
    'error_card_duplicate': 'ይህ ካርድ በሌላ ተጫዋች ተይዟል። እባክዎ ሌላ ይምረጡ።',
    'status_game_starting': 'ጨዋታው ሊጀመር ነው!',
    'error_game_started_without_you': 'ካርድ አልመረጡም! ጨዋታው ያለእርስዎ ተጀምሯል።',
    'lets_play_bingo': 'ቢንጎ እንጫወት!',
    'good_luck_player': 'መልካም ዕድል, {name}! ቁጥር ማቆር {mode} ነው።',
    'manual_mode': 'በእጅ ማቆር',
    'manual_mode_description': 'የተጠሩ ቁጥሮችን በካርድዎ ላይ ጠቅ በማድረግ ያቁሩ።',
    'waiting_for_card': 'ካርድዎን በመጠባበቅ ላይ...',
    'status_bingo_sent': 'ቢንጎ! አስተናጋጁ እስኪያረጋግጥ በመጠባበቅ ላይ...',
    'switch_to_manager_login': 'ወደ አስተዳዳሪ መግቢያ ቀይር',
    'previous_card': 'ያለፈው',

    // Card Creator
    'create_your_own_card_title': 'የራስዎን ካርድ ይፍጠሩ',
    'create_card_description': 'በእያንዳንዱ ሳጥን ውስጥ እንደ ዓምዱ ትክክለኛ ቁጥር ያስገቡ።',
    'free_space': 'ነጻ',
    'submit_my_card': 'የእኔን ካርድ አስገባ',
    'validation_nan': 'ቁጥር አይደለም',
    'validation_out_of_range': 'ከክልል ውጪ ({min}-{max})',
    'validation_required': 'ያስፈልጋል',
    'validation_duplicate': 'ተደጋጋሚ',
    'validation_fix_duplicates': 'እባክዎ በካርድዎ ላይ የተደጋገሙትን ቁጥሮች ያስተካክሉ።',
    'validation_fix_errors': 'እባክዎ በካርድዎ ላይ ያሉትን ስህተቶች ያስተካክሉ።',

    // Game Setup
    'game_setup_title': 'የጨዋታ ማዋቀር እና መሰብሰቢያ',
    'welcome_manager': 'እንኳን ደህና መጡ, {name}! ጨዋታውን ያዋቅሩ እና ተጫዋቾችን ይጋብዙ።',
    'game_history': 'የጨዋታ ታሪክ',
    'win_condition': 'የማሸነፊያ ሁኔታ',
    'no_winning_patterns_enabled': 'በአስተዳዳሪ የነቃ የማሸነፊያ ስርዓተ ጥለት የለም።',
    'game_modes': 'የጨዋታ ሁነታዎች',
    'calling_mode': 'የቁጥር ጥሪ ሁነታ',
    'marking_mode': 'የቁጥር ማቆር ሁነታ',
    'calling_speed': 'የቁጥር ጥሪ ፍጥነት',
    'stake_per_card': 'ለአንድ ካርድ የሚከፈል',
    'enter_amount': 'መጠን ያስገቡ',
    'voice_language': 'የድምጽ ቋንቋ',
    'lobby': 'መሰብሰቢያ',
    'game_id_share': 'የጨዋታ መለያ (ለተጫዋቾች ያጋሩ)',
    'hide_game_id': 'የጨዋታ መለያ ደብቅ',
    'show_game_id': 'የጨዋታ መለያ አሳይ',
    'waiting_for_players': 'ተጫዋቾች እስኪቀላቀሉ በመጠባበቅ ላይ...',
    'host_game_prompt': 'መሰብሰቢያ ለመፍጠር እና የጨዋታ መለያ ለማግኘት "ጨዋታ አስተናግድ" የሚለውን ይጫኑ።',
    'game_summary': 'የጨዋታ ማጠቃለያ',
    'possible_prize': 'ሊደረስበት የሚችል ሽልማት',
    'total_cards': 'ጠቅላላ ካርዶች',
    'at_least_2_cards_required': 'ለመጀመር ቢያንስ 2 ካርዶች ያስፈልጋሉ።',
    'start_game_for_all': 'ለሁሉም ተጫዋቾች ({count}) ጨዋታውን ጀምር',
    'host_game_and_create_lobby': 'ጨዋታ አስተናግድ እና መሰብሰቢያ ፍጠር',

    // Game Screen
    'play_again': 'እንደገና ይጫወቱ',
    'call_next': 'ቀጣይ ጥራ',
    'start_game': 'ጨዋታ ጀምር',
    'pause': 'ለአፍታ አቁም',
    'resume': 'ቀጥል',
    'start': 'ጀምር',
    'end_game_and_return_to_setup': 'ጨዋታውን ጨርስ እና ወደ ማዋቀሪያ ተመለስ',
    'winning_pattern': 'የማሸነፊያ ስርዓተ ጥለት',
    'number_of_players': 'የተጫዋቾች/ካርዶች ብዛት',
    'card_is_hidden': 'ካርድ ተደብቋል',
    'show_card': 'ካርድ አሳይ',
    'no_players_in_game': 'በጨዋታው ውስጥ ምንም ተጫዋቾች የሉም።',
    'total_stake': 'አጠቃላይ መዋጮ',
    'disconnected': 'ግንኙነት ተቋርጧል',
    'loading_card': 'ካርድ በመጫን ላይ...',
    
    // Bingo Modal
    'congratulations_you_won_speech': 'እንኳን ደስ አለዎት! አሸንፈዋል!',
    'you_won_prize_speech': 'የ${prize} አሸናፊ ሆነዋል!',
    'player_got_bingo_speech': '{name} ቢንጎ ብሏል/ብላለች!',
    'congratulations_you_won': 'እንኳን ደስ አለዎት! አሸንፈዋል!',
    'player_got_bingo': React.createElement('span', null, 'ተጫዋች ', React.createElement('b', {className: "font-bold text-amber-400"}, '{name}'), ' ቢንጎ ብሏል/ብላለች!'),
    'you_won_prize': 'የ${prize} አሸናፊ ሆነዋል!',
    'audit_trail': 'የኦዲት መዝገብ',
  }
};

export type TranslationKey = keyof (typeof translations)['en'];

const replaceVarsString = (text: string, vars?: Record<string, any>): string => {
  if (!vars) return text;
  return Object.entries(vars).reduce((acc, [key, value]) => {
    const replacement = (value !== null && value !== undefined) ? String(value) : '';
    return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), replacement);
  }, text);
};


const replaceVars = (text: string | React.ReactNode, vars?: Record<string, any>): string | React.ReactNode => {
    if (!vars || typeof text !== 'string') return text;
  
    // Check if any var is a React node
    const hasReactNode = Object.values(vars).some(v => React.isValidElement(v));
  
    if (!hasReactNode) {
      return replaceVarsString(text, vars);
    }
  
    const parts = text.split(/(\{\w+\})/g);
    return parts.map((part, index) => {
      if (/^\{(\w+)\}$/.test(part)) {
        const key = part.substring(1, part.length - 1);
        return vars[key] !== undefined ? React.createElement(React.Fragment, { key: index }, vars[key]) : part;
      }
      return part;
    });
};

export const getTranslator = (lang: Language) => {
  const t = (key: TranslationKey, vars?: Record<string, any>): string | React.ReactNode => {
    const text = translations[lang]?.[key] || translations['en'][key];
    return replaceVars(text, vars);
  };
  const t_str = (key: TranslationKey, vars?: Record<string, any>): string => {
      const text = translations[lang]?.[key] || translations['en'][key];
      if (typeof text !== 'string') {
        console.warn(`Translation key '${key}' returned a ReactNode for t_str. Returning a fallback string.`);
        return key;
      }
      return replaceVarsString(text, vars);
  };
  return { t, t_str };
};
