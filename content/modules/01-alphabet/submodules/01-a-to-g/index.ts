import type { SubModule } from '@/content/types'
import { videoUrl, imageUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'alphabet-a-to-g',
  moduleId: 'alphabet',
  title: 'Letters A to G',
  shortTitle: 'A–G',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    {
      id: 'letter-a',
      label: 'A',
      videoPath: videoUrl('/videos/alphabet/A.mp4'),
      imagePath: imageUrl('/images/alphabet/A.jpg'),
      acceptedAnswers: ['a'],
    },
    {
      id: 'letter-b',
      label: 'B',
      videoPath: videoUrl('/videos/alphabet/B.mp4'),
      imagePath: imageUrl('/images/alphabet/B.png'),
      acceptedAnswers: ['b'],
    },
    {
      id: 'letter-c',
      label: 'C',
      videoPath: videoUrl('/videos/alphabet/C.mp4'),
      imagePath: imageUrl('/images/alphabet/C.png'),
      acceptedAnswers: ['c'],
    },
    {
      id: 'letter-d',
      label: 'D',
      videoPath: videoUrl('/videos/alphabet/D.mp4'),
      imagePath: imageUrl('/images/alphabet/D.png'),
      acceptedAnswers: ['d'],
    },
    {
      id: 'letter-e',
      label: 'E',
      videoPath: videoUrl('/videos/alphabet/E.mp4'),
      imagePath: imageUrl('/images/alphabet/E.png'),
      acceptedAnswers: ['e'],
    },
    {
      id: 'letter-f',
      label: 'F',
      videoPath: videoUrl('/videos/alphabet/F.mp4'),
      imagePath: imageUrl('/images/alphabet/F.png'),
      acceptedAnswers: ['f'],
    },
    {
      id: 'letter-g',
      label: 'G',
      videoPath: videoUrl('/videos/alphabet/G.mp4'),
      imagePath: imageUrl('/images/alphabet/G.png'),
      acceptedAnswers: ['g'],
    },
  ],
}

export default submodule
