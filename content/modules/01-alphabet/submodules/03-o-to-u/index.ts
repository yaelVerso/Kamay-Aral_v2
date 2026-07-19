import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'alphabet-o-to-u',
  moduleId: 'alphabet',
  title: 'Letters O to U',
  shortTitle: 'O–U',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'letter-o', label: 'O', videoPath: videoUrl('/videos/alphabet/o.mp4'), acceptedAnswers: ['o'] },
    { id: 'letter-p', label: 'P', videoPath: videoUrl('/videos/alphabet/p.mp4'), acceptedAnswers: ['p'] },
    { id: 'letter-q', label: 'Q', videoPath: videoUrl('/videos/alphabet/q.mp4'), acceptedAnswers: ['q'] },
    { id: 'letter-r', label: 'R', videoPath: videoUrl('/videos/alphabet/r.mp4'), acceptedAnswers: ['r'] },
    { id: 'letter-s', label: 'S', videoPath: videoUrl('/videos/alphabet/s.mp4'), acceptedAnswers: ['s'] },
    { id: 'letter-t', label: 'T', videoPath: videoUrl('/videos/alphabet/t.mp4'), acceptedAnswers: ['t'] },
    { id: 'letter-u', label: 'U', videoPath: videoUrl('/videos/alphabet/u.mp4'), acceptedAnswers: ['u'] },
  ],
}

export default submodule
