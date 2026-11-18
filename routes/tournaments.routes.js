import express from 'express';

const router = express.Router();

export const tournamentsList = [
  {
    _id: 't1',
    title: 'BGMI SHOWDOWN TOURNAMENT',
    game: 'BGMI',
    tag: 'BGMI',
    year: '2027',
    description: 'The biggest battle royale event in India returns with top squads fighting for glory.',
    image: '/assets/tournament_bgmi_showdown_4k.jpg',
    prizePool: '$250,000',
    status: 'upcoming',
    featured: true,
  },
  {
    _id: 't2',
    title: 'PUBG MOBILE GLOBAL CHAMPIONSHIP',
    game: 'PUBG Mobile',
    tag: 'PUBG',
    year: '2027',
    description: 'The ultimate global clash brings the finest teams together to compete on the world stage.',
    image: '/assets/tournament_pubg_mobile_4k.jpg',
    prizePool: '$1,000,000',
    status: 'upcoming',
    featured: true,
  },
  {
    _id: 't3',
    title: 'BGMI LAN WARRIORS CHALLENGE',
    game: 'BGMI',
    tag: 'BGMI',
    year: '2027',
    description: 'Top-tier Indian teams prepare to clash in the most anticipated offline tournament of the season.',
    image: '/assets/tournament_bgmi_lan_warriors_4k.jpg',
    prizePool: '$300,000',
    status: 'upcoming',
    featured: true,
  },
  {
    _id: 't4',
    title: 'PUBG ULTIMATE SQUAD SERIES',
    game: 'PUBG Mobile',
    tag: 'PUBG',
    year: '2027',
    description: 'An action-packed tournament featuring intense battle royale matches and massive prizes.',
    image: '/assets/tournament_pubg_ultimate_squad_4k.jpg',
    prizePool: '$500,000',
    status: 'upcoming',
    featured: true,
  },
];

export const gamesList = [
  { _id: 'g1', name: 'Counter Strike 2', slug: 'cs2', logo: '/assets/games/cs2.png', status: 'confirmed' },
  { _id: 'g2', name: 'Valorant', slug: 'valorant', logo: '/assets/games/valorant.png', status: 'confirmed' },
  { _id: 'g3', name: 'Fatal Fury: City of the Wolves', slug: 'fatal-fury', logo: '/assets/games/fatal_fury.png', status: 'confirmed' },
  { _id: 'g4', name: 'Chess', slug: 'chess', logo: '/assets/games/chess.png', status: 'confirmed' },
  { _id: 'g5', name: 'Dota 2', slug: 'dota2', logo: '/assets/games/dota2.png', status: 'confirmed' },
  { _id: 'g6', name: 'Upcoming Title', slug: 'upcoming-title', logo: '?', status: 'revealing_soon', note: "We'll update soon" },
];

export const newsList = [
  {
    _id: 'n1',
    title: 'The race for the Club Championship is over! - LiveTournaments.in',
    category: 'WEEKLY RECAP',
    summary: 'A thrilling culmination to the grand championship race.',
    image: '/assets/recap_1.jpg',
    publishedAt: new Date('2026-11-15'),
  },
  {
    _id: 'n2',
    title: 'Team Spirit Wins CS2 At LT.IN | LiveTournaments.in',
    category: 'DAILY RECAP',
    summary: 'Team Spirit clinches the trophy in a dramatic five-map thriller.',
    image: '/assets/recap_2.jpg',
    publishedAt: new Date('2026-11-16'),
  },
  {
    _id: 'n3',
    title: 'AG.AL Have Secured The Club Championship | LiveTournaments.in',
    category: 'DAILY RECAP',
    summary: 'Dominant consistency across all titles secures AG.AL the #1 spot.',
    image: '/assets/recap_3.jpg',
    publishedAt: new Date('2026-11-17'),
  },
];

router.get('/', (req, res) => res.json(tournamentsList));
router.get('/games', (req, res) => res.json(gamesList));
router.get('/news', (req, res) => res.json(newsList));

export default router;
