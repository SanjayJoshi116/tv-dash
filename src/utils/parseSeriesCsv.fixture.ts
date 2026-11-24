// Shared CSV fixtures for parseSeriesCsv + useTvData tests
const HEADER = 'TV ID,Name,Language,Seasons,Episode Runtime,First Air Year,Genres,Creators,Networks,Status,Total Episodes,Last Episode Air Date,Popularity,Vote Count,Vote Average,Actors/Actresses,Keywords/Tags,First Air Date,Overview,Tagline,Poster URL,Age Rating,Seasons Watched,Episodes Watched,Total Runtime Watched (min)'
export const VALID_ROW = '1,Breaking Bad,en,5,47,2008,"Drama,Crime",Vince Gilligan,AMC,Ended,62,2013-09-29,500,1000,9.5,Bryan Cranston,,2008-01-20,A chemistry teacher,,https://example.com/bb.jpg,TV-MA,1,62,2914'
export const csv = (...rows: string[]) => [HEADER, ...rows].join('\n')
export const VALID_CSV = csv(VALID_ROW)
// VALID_ROW (or `row`) with its TV ID (first field) swapped
export const withId = (id: string, row = VALID_ROW) => row.replace(/^1,/, `${id},`)
