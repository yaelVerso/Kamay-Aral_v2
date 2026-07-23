import type { SubModule } from '@/content/types'
import { videoUrl, imageUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'feelings-feelings',
  moduleId: 'feelings',
  title: 'Feelings',
  shortTitle: 'Feelings',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'feeling-happy', label: 'Happy', videoPath: videoUrl('/videos/feelings/happy.mp4'), imagePath: imageUrl('/images/10 - feelings/10 - happy.png'), acceptedAnswers: ['happy'] },
    { id: 'feeling-sad', label: 'Sad', videoPath: videoUrl('/videos/feelings/sad.mp4'), imagePath: imageUrl('/images/10 - feelings/10 - sad.png'),acceptedAnswers: ['sad'] },
    { id: 'feeling-angry', label: 'Angry', videoPath: videoUrl('/videos/feelings/angry.mp4'), imagePath: imageUrl('/images/10 - feelings/10 - angry.png'),acceptedAnswers: ['angry'] },
    { id: 'feeling-scared', label: 'Scared', videoPath: videoUrl('/videos/feelings/scared.mp4'), acceptedAnswers: ['scared'] },
    { id: 'feeling-surprised', label: 'Surprised', videoPath: videoUrl('/videos/feelings/surprised.mp4'), acceptedAnswers: ['surprised'] },
    { id: 'feeling-tired', label: 'Tired', videoPath: videoUrl('/videos/feelings/tired.mp4'), acceptedAnswers: ['tired'] },
    { id: 'feeling-hungry', label: 'Hungry', videoPath: videoUrl('/videos/feelings/hungry.mp4'), acceptedAnswers: ['hungry'] },
    { id: 'feeling-thirsty', label: 'Thirsty', videoPath: videoUrl('/videos/feelings/thirsty.mp4'), acceptedAnswers: ['thirsty'] },
  ],
}

export default submodule
