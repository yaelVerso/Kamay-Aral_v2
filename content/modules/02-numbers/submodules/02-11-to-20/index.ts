import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'numbers-11-to-20',
  moduleId: 'numbers',
  title: 'Numbers 11 to 20',
  shortTitle: '11-20',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'numbers-11', label: '11', videoPath: videoUrl('/videos/numbers/11.mp4'), acceptedAnswers: ['11', 'eleven'] },
    { id: 'numbers-12', label: '12', videoPath: videoUrl('/videos/numbers/12.mp4'), acceptedAnswers: ['12', 'twelve'] },
    { id: 'numbers-13', label: '13', videoPath: videoUrl('/videos/numbers/13.mp4'), acceptedAnswers: ['13', 'thirteen'] },
    { id: 'numbers-14', label: '14', videoPath: videoUrl('/videos/numbers/14.mp4'), acceptedAnswers: ['14', 'fourteen'] },
    { id: 'numbers-15', label: '15', videoPath: videoUrl('/videos/numbers/15.mp4'), acceptedAnswers: ['15', 'fifteen'] },
    { id: 'numbers-16', label: '16', videoPath: videoUrl('/videos/numbers/16.mp4'), acceptedAnswers: ['16', 'sixteen'] },
    { id: 'numbers-17', label: '17', videoPath: videoUrl('/videos/numbers/17.mp4'), acceptedAnswers: ['17', 'seventeen'] },
    { id: 'numbers-18', label: '18', videoPath: videoUrl('/videos/numbers/18.mp4'), acceptedAnswers: ['18', 'eighteen'] },
    { id: 'numbers-19', label: '19', videoPath: videoUrl('/videos/numbers/19.mp4'), acceptedAnswers: ['19', 'nineteen'] },
    { id: 'numbers-20', label: '20', videoPath: videoUrl('/videos/numbers/20.mp4'), acceptedAnswers: ['20', 'twenty'] },
  ],
}

export default submodule
