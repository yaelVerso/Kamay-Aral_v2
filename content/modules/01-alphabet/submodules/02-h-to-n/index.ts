import type { SubModule } from '@/content/types'
import { videoUrl, imageUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'alphabet-h-to-n',
  moduleId: 'alphabet',
  title: 'Letters H to N',
  shortTitle: 'H–N',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'letter-h', label: 'H', videoPath: videoUrl('/videos/alphabet/h.mp4'), imagePath: imageUrl('/images/alphabet/h.png'), acceptedAnswers: ['h'] },
    { id: 'letter-i', label: 'I', videoPath: videoUrl('/videos/alphabet/i.mp4'), imagePath: imageUrl('/images/alphabet/i.png'), acceptedAnswers: ['i'] },
    { id: 'letter-j', label: 'J', videoPath: videoUrl('/videos/alphabet/j.mp4'), imagePath: imageUrl('/images/alphabet/j.png'), acceptedAnswers: ['j'] },
    { id: 'letter-k', label: 'K', videoPath: videoUrl('/videos/alphabet/k.mp4'), imagePath: imageUrl('/images/alphabet/k.png'), acceptedAnswers: ['k'] },
    { id: 'letter-l', label: 'L', videoPath: videoUrl('/videos/alphabet/l.mp4'), imagePath: imageUrl('/images/alphabet/l.png'), acceptedAnswers: ['l'] },
    { id: 'letter-m', label: 'M', videoPath: videoUrl('/videos/alphabet/m.mp4'), imagePath: imageUrl('/images/alphabet/m.png'), acceptedAnswers: ['m'] },
    { id: 'letter-n', label: 'N', videoPath: videoUrl('/videos/alphabet/n.mp4'), imagePath: imageUrl('/images/alphabet/n.png'), acceptedAnswers: ['n'] },
  ],
}

export default submodule
