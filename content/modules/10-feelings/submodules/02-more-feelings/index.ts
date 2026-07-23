import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'feelings-more-feelings',
  moduleId: 'feelings',
  title: 'More Feelings',
  shortTitle: 'More',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'feeling-hurt', label: 'Hurt', videoPath: videoUrl('/videos/feelings/hurt.mp4'), acceptedAnswers: ['hurt'] },
    { id: 'feeling-pain', label: 'Pain', videoPath: videoUrl('/videos/feelings/pain.mp4'), acceptedAnswers: ['pain'] },
    { id: 'feeling-okay', label: 'Okay', videoPath: videoUrl('/videos/feelings/okay.mp4'), acceptedAnswers: ['okay', 'ok'] },
    { id: 'feeling-shy', label: 'Shy', videoPath: videoUrl('/videos/feelings/shy.mp4'), acceptedAnswers: ['shy'] },
    { id: 'feeling-excited', label: 'Excited', videoPath: videoUrl('/videos/feelings/excited.mp4'), acceptedAnswers: ['excited'] },
    { id: 'feeling-confused', label: 'Confused', videoPath: videoUrl('/videos/feelings/confused.mp4'), acceptedAnswers: ['confused'] },
    { id: 'feeling-bored', label: 'Bored', videoPath: videoUrl('/videos/feelings/bored.mp4'), acceptedAnswers: ['bored'] },
    { id: 'feeling-worried', label: 'Worried', videoPath: videoUrl('/videos/feelings/worried.mp4'), acceptedAnswers: ['worried'] },
  ],
}

export default submodule
