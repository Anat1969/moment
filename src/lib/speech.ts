// הקלטה + תמלול חינמי.
// שתי שכבות: MediaRecorder שומר את הקול עצמו (עובד בכל דפדפן),
// Web Speech API מתמלל בזמן אמת (Chrome/אנדרואיד; ב-iOS לרוב לא זמין).

type SR = any
const SRClass: SR =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null

export const canTranscribe = Boolean(SRClass)

export interface Recorder {
  stop: () => Promise<{ blob: Blob | null; transcript: string }>
  onText: (cb: (text: string) => void) => void
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const chunks: BlobPart[] = []
  let mr: MediaRecorder | null = null
  try {
    mr = new MediaRecorder(stream)
    mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
    mr.start()
  } catch { mr = null }

  let finalText = ''
  let interim = ''
  let cb: ((t: string) => void) | null = null
  let rec: any = null

  if (SRClass) {
    rec = new SRClass()
    rec.lang = 'he-IL'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e: any) => {
      interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t + ' '
        else interim += t
      }
      cb?.((finalText + interim).trim())
    }
    rec.onerror = () => {}
    try { rec.start() } catch {}
  }

  return {
    onText(fn) { cb = fn },
    stop() {
      return new Promise(resolve => {
        try { rec?.stop() } catch {}
        const finish = (blob: Blob | null) => {
          stream.getTracks().forEach(t => t.stop())
          resolve({ blob, transcript: (finalText + interim).trim() })
        }
        if (mr && mr.state !== 'inactive') {
          mr.onstop = () => finish(new Blob(chunks, { type: mr!.mimeType || 'audio/webm' }))
          mr.stop()
        } else finish(null)
      })
    }
  }
}
