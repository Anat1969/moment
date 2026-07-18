export type Member = 'ענת' | 'נתן' | 'עילאי' | 'לוטם'
export const MEMBERS: Member[] = ['ענת', 'נתן', 'עילאי', 'לוטם']

export type Tag = 'תרבות' | 'טבע' | 'אוכל' | 'קנייה' | 'ספורט' | 'סתם'
export const TAGS: Tag[] = ['תרבות', 'טבע', 'אוכל', 'קנייה', 'ספורט', 'סתם']

export interface Capture {
  id: string
  taken_at: string
  author: Member
  image_path: string | null
  audio_path: string | null
  transcript: string
  note: string
  lat: number | null
  lng: number | null
  place_name: string | null
  tags: string[]
  trip_day: number | null
  _pending?: boolean
  _imageBlob?: Blob
  _audioBlob?: Blob
  _localUrl?: string
}
