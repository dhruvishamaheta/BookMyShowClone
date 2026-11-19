import concert from "../assets/concert.jpg";
import comedy from "../assets/comedy.jpg";
import concert1 from "../assets/concert1.jpg";
import Musicnight from "../assets/Musicnight.jpg";
import comedy1 from "../assets/comedy1.jpg";
import comedy2 from "../assets/comedy2.jpg";
import dandiya from "../assets/dandiya.jpg";
import blindfoldgame from "../assets/blindfoldgame.jpg";
import lasershow from "../assets/lasershow.jpg";
import splash from "../assets/splash.jpg";
import hero from "../assets/hero.png";
import beach from "../assets/beach.jpg";
import poster1 from "../assets/poster1.jpg";
import poster2 from "../assets/poster2.jpg";
import diljitDosanjh from "../assets/diljit-dosanjh.png";

const eventsData = [
  {
    id: "event1",
    title: "Concert Night Arena",
    poster: concert,
    category: "auditorium",
    type: "Music Concert",
    venue: "Sardar Patel Stadium, Ahmedabad",
    date: "Sat 24 Oct 2026",
    price: 2500,
    rating: 9.2,
    language: "Hindi, English",
    description: "A grand stadium concert night with superstar playback singers and electrifying sound production."
  },
  {
    id: "event2",
    title: "Stand-up Comedy Central",
    poster: comedy,
    category: "cafe",
    type: "Comedy Show",
    venue: "Tea Post, CG Road, Ahmedabad",
    date: "Sun 25 Oct 2026",
    price: 299,
    rating: 8.8,
    language: "Hindi, Gujarati",
    description: "Laugh out loud with top viral stand-up comedians performing brand new punchlines."
  },
  {
    id: "event3",
    title: "Fusion Music Festival",
    poster: concert1,
    category: "auditorium",
    type: "Music Night",
    venue: "Tagore Hall, Ahmedabad",
    date: "Fri 30 Oct 2026",
    price: 1200,
    rating: 9.0,
    language: "Hindi, English",
    description: "An electrifying fusion music festival uniting classical ragas and progressive rock instruments."
  },
  {
    id: "event4",
    title: "Soulful Acoustic Music Night",
    poster: Musicnight,
    category: "auditorium",
    type: "Live Music",
    venue: "Nehru Auditorium, Ahmedabad",
    date: "Sat 31 Oct 2026",
    price: 1800,
    rating: 9.1,
    language: "Hindi, Urdu",
    description: "Enjoy soulful acoustic live music performances, ghazals, and vintage Bollywood melodies."
  },
  {
    id: "event5",
    title: "Comedy Show Uncensored",
    poster: comedy1,
    category: "cafe",
    type: "Stand-up Comedy",
    venue: "Cafe Mocha, Ahmedabad",
    date: "Sun 1 Nov 2026",
    price: 199,
    rating: 8.6,
    language: "English, Hindi",
    description: "A fun weekend evening of witty observational jokes, crowd interactions, and sharp storytelling."
  },
  {
    id: "event6",
    title: "Comedy Night Chai & Giggles",
    poster: comedy2,
    category: "cafe",
    type: "Comedy Night",
    venue: "Tea Post, Maninagar, Ahmedabad",
    date: "Sat 7 Nov 2026",
    price: 299,
    rating: 8.7,
    language: "Gujarati, Hindi",
    description: "Intimate comedy night loaded with desi wit, relatable stories, and steaming special masala chai."
  },
  {
    id: "event7",
    title: "Dandiya Dhamaka 2026",
    poster: dandiya,
    category: "festival",
    type: "Dance Festival",
    venue: "Kankaria Grounds, Ahmedabad",
    date: "Fri 13 Nov 2026",
    price: 499,
    rating: 9.5,
    language: "Gujarati, Hindi",
    description: "A lively Navratri dandiya night with traditional orchestra beats, vibrant attire, and prizes."
  },
  {
    id: "event8",
    title: "Blindfold Gala Mystery Challenge",
    poster: blindfoldgame,
    category: "experience",
    type: "Adventure",
    venue: "Escape Room, Ahmedabad",
    date: "Sat 14 Nov 2026",
    price: 599,
    rating: 8.9,
    language: "English, Hindi",
    description: "Solve puzzles in this immersive sensory blackout challenge with your group of friends."
  },
  {
    id: "event9",
    title: "Grand Laser & Light Spectacular",
    poster: lasershow,
    category: "stadium",
    type: "Light Event",
    venue: "City Square, Ahmedabad",
    date: "Sun 15 Nov 2026",
    price: 399,
    rating: 9.0,
    language: "English",
    description: "A dazzling 3D laser projection mapping show with synchronized music and pyro fireworks."
  },
  {
    id: "event10",
    title: "Splash Foam Party & DJ Fest",
    poster: splash,
    category: "waterpark",
    type: "Pool Fest",
    venue: "Wave Pool, Surat",
    date: "Sat 21 Nov 2026",
    price: 349,
    rating: 8.8,
    language: "Hindi, English",
    description: "A refreshing splash party with top DJs, giant foam cannons, and exciting pool games."
  },
  {
    id: "event11",
    title: "Sunset Coastal Beach Fest",
    poster: beach,
    category: "beach",
    type: "Open-Air Event",
    venue: "Mandvi Beach, Kutch",
    date: "Sun 22 Nov 2026",
    price: 699,
    rating: 9.3,
    language: "English, Hindi, Gujarati",
    description: "A coastal music and food carnival with sunset beach vibes, drum circles, and fire shows."
  },
  {
    id: "event12",
    title: "Starry Night Outdoor Symphony",
    poster: hero,
    category: "outdoor",
    type: "Night Concert",
    venue: "Sky Park Arena, Ahmedabad",
    date: "Fri 27 Nov 2026",
    price: 1299,
    rating: 9.2,
    language: "English, Hindi",
    description: "A premium open-air orchestra symphony playing iconic film soundtracks under the stars."
  },
  {
    id: "event13",
    title: "Classic Opera & Broadway Night",
    poster: poster1,
    category: "theater",
    type: "Opera",
    venue: "Grand Opera House, Mumbai",
    date: "Sun 29 Nov 2026",
    price: 2199,
    rating: 9.4,
    language: "English",
    description: "A classical opera and Broadway musical masterpiece performed by international vocalists."
  },
  {
    id: "event14",
    title: "Bollywood Retro Dance Bash",
    poster: poster2,
    category: "party",
    type: "Dance Event",
    venue: "Club Velvet, Ahmedabad",
    date: "Sat 5 Dec 2026",
    price: 899,
    rating: 8.9,
    language: "Hindi",
    description: "A high-octane 90s & 2000s Bollywood dance party with celebrity DJs and neon dance floor."
  },
  {
    id: "event15",
    title: "Diljit Dosanjh - Aura India Tour",
    poster: diljitDosanjh,
    category: "auditorium",
    type: "Music Concert",
    venue: "Narendra Modi Stadium, Ahmedabad",
    location: "Narendra Modi Stadium, Motera, Ahmedabad",
    date: "Sat 21 Nov 2026",
    startDate: "2026-11-21",
    endDate: "2026-11-21",
    price: 1999,
    rating: 9.8,
    language: "Punjabi, Hindi, English",
    description: "Experience Diljit Dosanjh live at the Narendra Modi Stadium on the Aura India Tour."
  }
];

export default eventsData;
